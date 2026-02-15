import { Injectable, InternalServerErrorException, UnprocessableEntityException, UnauthorizedException, NotFoundException, Logger } from '@nestjs/common';
import { ProductsManager } from './products_manager';
import { SubscriptionPayload } from './dtos/subscription_payload';
import { SubscriptionEntity } from './entities/subscription_entities';
import { JsonRpcProvider } from 'ethers';
import { Active, Completed, MINING, REFERRAL_DEPTH_DIRECT, REFERRAL_DEPTH_INDIRECT } from 'src/constants/my_constants';
import { NetworkUtils } from 'src/utils/network_utils';
import { DataSource } from 'typeorm';
import { MyUtils } from 'src/utils/my_utils';
import { MiningEntity } from './entities/minings';
import { MiningDto } from './dtos/mining_dto';
import { min } from 'rxjs';
import { StakingPayload } from './dtos/staking_payload';
import { StakingEntity } from './entities/staking_entity';
import { MiningMapper } from './utils/mapper/mining_mapper';
import { ProductUtils } from './utils/product_utils';
import { WithdrawalPayload } from './dtos/withdrawal_payload';
import { WithdrawalEntity } from './entities/withdrawal_entity';
import { NotificationEntity } from 'src/notification/entities/Notification_entity';
import { NotificationService } from 'src/notification/notification.service';
import { PushService } from 'src/auth/push.service';
import { UsersService } from 'src/users/users.service';
import { LoggedDevice } from 'src/auth/entities/logged_device';
import { NOTIFICATION_TYPE_MINING, NOTIFICATION_TYPE_STAKING, NOTIFICATION_TYPE_WITHDRAWAL } from 'src/utils/constants';
import { ReferralEntity } from 'src/users/entities/referral_entity';
import { ProfileEntity } from 'src/users/entities/profile_entity';
import { ReferralDto } from 'src/users/dtos/referral_dto';
import { ProfileMapper } from 'src/users/mapper/profile_mapper';
import { ReferralEntityMapper } from 'src/utils/mapper/referral_entity_maper';

@Injectable()
export class ProductsService {
    logger = new Logger(ProductsService.name);
    constructor(
        private productsManager: ProductsManager,
        private dataSource: DataSource,
        private notificationService: NotificationService,
        private pushService: PushService,
        private userService: UsersService,
    ) {}

    async subscribeToProduct(uid: string, email: string, payload: SubscriptionPayload): Promise<SubscriptionEntity> {
        // const referralProfile: ProfileEntity = await this.userService.refferalCodeUser(payload.sub_referral_code)
        // if (referralProfile == null) {
        //     throw new UnprocessableEntityException('Referral code not found');
        // }
        // const hasReferred = await this.userService.hasReferredSomeone(uid,referralProfile.uid);
        // if (hasReferred) {
        //     throw new UnprocessableEntityException('You have already referred this user');
        // }
        // const user = await this.userService.getProfileByUid(uid);
        // if (user == null) {
        //     throw new UnprocessableEntityException('User not found');
        // }
        // if (user.referral_code == payload.sub_referral_code) {
        //     throw new UnprocessableEntityException('You cannot refer yourself');
        // }


        const fromSubscription: SubscriptionEntity = await this.getSubscriptionByMiningTag(payload.sub_referral_code)
        if (fromSubscription == null) {
            throw new UnprocessableEntityException('Subscription not found');
        }
        if (fromSubscription.sub_status !== Active){
            throw new UnprocessableEntityException('Subscription is not active');
        }
        if (!this.checkIfProductIsSame(fromSubscription.sub_package_name, payload.sub_package_name)) {
            throw new UnprocessableEntityException(`You cannot subscribe to a different product, please use the same product as your upline: ${fromSubscription.sub_package_name}`);
        }
        const walletExists = await this.checkIfWalletExistsInSub(payload.sub_wallet_hash)
        if (walletExists) {
            throw new UnprocessableEntityException('Wallet already in use, please use a different wallet');
        }
        const hasReferred = await this.hasReferredSomeone(fromSubscription.uid, uid);
        if (hasReferred) {
            throw new UnprocessableEntityException('You have already referred this user or you have this user as your descendant');
        }
        // const hasBeenReferredBefore = await this.hasBeenReferredBefore(fromSubscription.uid);
        // if (hasBeenReferredBefore) {
        //     throw new UnprocessableEntityException('You cannot refer this user again as this user has already been referred before');
        // }

        const rpc=NetworkUtils.getRpc(payload.sub_chain_id)
        const status: Boolean = await this.submitTransaction(uid, payload.sub_signed_tx, rpc)
        if (!status){
            throw new UnprocessableEntityException('Transaction submission failed');
        }
        payload.email = email;
        const subType=payload.sub_type;
        return await this.dataSource.transaction(async manager => {
            const subEntity: SubscriptionEntity = await this.createSubscriptionProduct(uid, email, payload);
            await this.createMiningRecord(uid, email, subEntity, fromSubscription.sub_id);
            return subEntity;
        })
    }

    /**
     * Convert SubscriptionPayload -> SubscriptionEntity and persist.
     * Uses TypeORM repository.create() to map plain object to entity instance,
     * then repository.save() to insert/update.
     */
    async createSubscriptionProduct(uid: string, email: string, payload: SubscriptionPayload): Promise<SubscriptionEntity> {
        try{
            console.log(`Creating subscription product for user: ${uid}`);
            payload.sub_mining_tag = MyUtils.generateLetterCode(9);
            const timestamp = Date.now();
            payload.email = email;
            payload.sub_created_at = BigInt(timestamp);
            payload.sub_updated_at = BigInt(timestamp);
            payload.sub_status = Active
            try {
                const sub_id = MyUtils.generateUUID()
                // Ensure uid is set from the caller (do not trust payload.uid)
                const data = { ...payload, uid, sub_id } as Partial<SubscriptionEntity>;

                // repository.create maps a plain object to an entity instance (runs transformers, etc.)
                const entity = this.productsManager.subscriptionRepo.create(data as SubscriptionEntity);
                // console.log('Mapped SubscriptionEntity:', entity);
                // Optionally normalize/validate fields here (e.g. numbers parsed from strings)
                // entity.sub_chain_id = Number(entity.sub_chain_id);
                const saved = await this.productsManager.subscriptionRepo.save(entity);
                return saved;
            } catch (err) {
                console.error('Error creating subscription entity:', err);
                throw new InternalServerErrorException('Failed to create subscription');
            }
        }catch(err){
            console.error('Error creating subscription product:', err);
            throw new InternalServerErrorException('Failed to create subscription');
        }
    }
    
    
    async createMiningRecord(uid: string, email: string, payload: SubscriptionEntity, fromSubscriptionId: string):Promise<MiningEntity>{
        console.log(`Creating mining record for user: ${uid}`);
        const timestamp = Date.now();
        const miningEntity = await this.dataSource.transaction(async manager=>{
           try{
               const miningEntity = new MiningEntity();
               miningEntity.min_id = MyUtils.generateUUID();
               miningEntity.uid = uid;
               miningEntity.email = email;
               miningEntity.min_created_at = BigInt(timestamp);
               miningEntity.min_updated_at = BigInt(timestamp);
               miningEntity.min_subscription_id = payload.sub_id;
               miningEntity.hash_rate = ProductUtils.LEVEL_ONE_HASHRATE.toString();
               miningEntity.mining_tag = payload.sub_mining_tag;
               const miningRepo = manager.getRepository(MiningEntity);
               return await miningRepo.save(miningEntity);
           }catch(err){
            console.error('Error creating mining record:', err);
            throw new InternalServerErrorException('Failed to create mining');
           }
        })
        const notification: NotificationEntity = new NotificationEntity();
        notification.noti_id = MyUtils.generateUUID();
        notification.noti_user = uid;
        notification.noti_title = 'Mining Created';
        notification.noti_description = `Your mining has been created successfully`;
        notification.noti_type = NOTIFICATION_TYPE_MINING;
        notification.noti_created_at = BigInt(timestamp);
        notification.noti_updated_at = BigInt(timestamp);
        notification.noti_seen = false;
        await this.notificationService.createNotification(notification);
        this.sendPushNotification(uid, 'Mining Created', `Your mining has been created successfully`, miningEntity);
        const fromSubscription: SubscriptionEntity = await this.getSubscriptionByMiningTag(payload.sub_referral_code)
        if (fromSubscription != null) {
            const referralUid = fromSubscription.uid
            //Get the ancestor of the user
            const ancestorReferral = await this.getAncestor(referralUid)
            
            const ref = new ReferralEntity()
            ref.referral_id = MyUtils.generateUUID()
            ref.referral_uid = referralUid
            ref.referree_uid = uid;
            ref.referral_subscription_id = fromSubscriptionId;
            ref.referral_created_at = BigInt(Date.now())
            ref.referral_updated_at = BigInt(Date.now())
            //If the user has an ancestor, set the depth to indirect, otherwise set it to direct
            //We do this because if the user has an ancestor, the user is indirectly referred by the ancestor and the user that refer this person.
            //So the referree is placed under the referral and the ancestor

            if (ancestorReferral != null && ancestorReferral.referral_ancestor_uid != null) {
                //Means the referral has an ancestor, so we set the ancestor
                ref.referral_ancestor_uid = ancestorReferral.referral_ancestor_uid;
                ref.depth = REFERRAL_DEPTH_INDIRECT;
                //Set the ancestor subscription id for tracking
                ref.referral_ancestor_sub_id = ancestorReferral.referral_ancestor_sub_id;

            } else {
                //Means the referral has no ancestor, so we set the referral as the ancestor
                ref.referral_ancestor_uid = referralUid;
                ref.depth = REFERRAL_DEPTH_DIRECT;
                //Since the referral has no ancestor, set set the ancestor subscription id to the subscription id of the referral
                ref.referral_ancestor_sub_id = fromSubscription.sub_id;

            }
            ref.referral_descendant_uid = uid;
            const referralRepository = this.dataSource.manager.getRepository(ReferralEntity)
            await referralRepository.save(ref)
            const referralProfile=await this.userService.getProfileByUid(referralUid)
            this.logger.debug(`Referral recorded: ${referralProfile.uid} referred ${uid}`);
            const directReferrals = await this.userService.getDirectReferrals(referralProfile.uid)
            const indirectReferrals = await this.getIndirectReferrals(referralProfile.uid, fromSubscriptionId)
            const totalReferrals = directReferrals.length + indirectReferrals.length
            this.logger.debug(`User ${referralProfile.uid} now has ${directReferrals.length} direct referrals and ${indirectReferrals.length} indirect referrals.`);
            this.logger.debug(`User ${referralProfile.uid} now has ${totalReferrals} referrals.`);
            const miningRecord = await this.getMiningRecords(referralProfile.uid)
            if (miningRecord.length !== null) {
                this.logger.debug(`Mining records found for user: ${referralProfile.uid}`);
                const miningDto = miningRecord.at(0)
                if (miningDto != null) {
                    this.logger.debug(`Changing hash rate for user: ${referralProfile.uid}`);
                    const hashRate = ProductUtils.getHashRate(totalReferrals)
                    const miningEntity = miningDto.mining
                    miningEntity.hash_rate = hashRate.toString()
                    const miningRepo = this.dataSource.getRepository(MiningEntity);
                    await miningRepo.save(miningEntity);
                    this.sendPushNotification(referralProfile.uid, 'Hash Rate Updated', `Your hash rate has been updated to ${hashRate}`, miningEntity);
                    this.logger.debug(`Hash rate updated to ${hashRate} for user: ${referralProfile.uid}`);
                } else {
                    this.logger.debug(`No mining record found for user: ${referralProfile.uid}. No hash rate change applied.`);
                }
            }
        }
        return miningEntity;
    }

    async createStakingRecord(uid: string, email: string, payload: StakingPayload): Promise<StakingEntity>{
        console.log(`Creating staking record for user: ${uid}`);
        const timestamp = Date.now();
        const status: Boolean = await this.submitTransaction(uid, payload.signed_tx, payload.rpc)
        if (!status) {
            throw new UnprocessableEntityException('Transaction submission failed');
        }
        const stakingEntity = await this.dataSource.transaction(async manager=>{
            try{
                const staking_id = MyUtils.generateUUID();
                const data = { ...payload, uid, email, staking_id, } as Partial<StakingEntity>;
                data.stake_created_at = BigInt(timestamp);
                data.stake_updated_at = BigInt(timestamp);
                data.staking_status = Active;
                const stakingRepo = manager.getRepository(StakingEntity);
                const entity = stakingRepo.create(data as StakingEntity);
                return await stakingRepo.save(entity);
            }catch(err){
                console.error('Error creating staking record:', err);
                throw new InternalServerErrorException('Failed to create staking');
            }
        })
        const notification: NotificationEntity = new NotificationEntity();
        notification.noti_id = MyUtils.generateUUID();
        notification.noti_user = uid;
        notification.noti_title = 'Staking Created';
        notification.noti_description = `Your staking has been created successfully`;
        notification.noti_type = NOTIFICATION_TYPE_STAKING;
        notification.noti_created_at = BigInt(timestamp);
        notification.noti_updated_at = BigInt(timestamp);
        notification.noti_seen = false;
        await this.notificationService.createNotification(notification);
        this.sendPushNotification(uid, 'Staking Created', `Your staking has been created successfully`, stakingEntity);

        return stakingEntity;
    }

    async getMiningRecords(uid: string):Promise<MiningDto[]>{
        console.log(`Fetching mining records for user: ${uid}`);
        const query=`SELECT s.*, m.* FROM subscriptions s 
        LEFT JOIN minings m ON s.sub_id = m.min_subscription_id 
        WHERE s.uid = ? ORDER BY s.sub_created_at DESC`;
        const miningsDto: MiningDto[] = [];
        try{
            const results: [] = await this.productsManager.subscriptionRepo.query(query, [uid]);
            console.log('Mining records fetched:', results.length);
            for (const row of results) {
                const miningDto = new MiningDto();
                miningDto.subscription = row as SubscriptionEntity
                let mining: MiningEntity | null = null;
                miningDto.mining = null;
                if (row['min_id']!=null) {
                    mining =MiningMapper.toEntity(row)
                    miningDto.mining = mining
                }
               
                miningsDto.push(miningDto);
            }
            return miningsDto;
        }catch(err){
            console.error('Error fetching mining records:', err);
            throw new InternalServerErrorException('Failed to fetch mining records');
        }
   
    }
    async getStakingRecords(uid: string):Promise<StakingEntity[]>{
        console.log(`Fetching staking records for user: ${uid}`);
        try{
            return await this.productsManager.stakingRepo.find({
                where:{uid:uid,staking_status:Active},
                order:{stake_created_at:"DESC"}
            });
        }catch(err){
            console.error('Error fetching staking records:', err);
            throw new InternalServerErrorException('Failed to fetch staking records');
        }
    }

    async getWithdrawalRecords(uid: string):Promise<WithdrawalEntity[]>{
        console.log(`Fetching withdrawal records for user: ${uid}`);
        try{
            return await this.productsManager.withdrawalRepo.find({
                where:{uid:uid},
                order:{withdrawal_created_at:"DESC"}
            });
        }catch(err){
            console.error('Error fetching withdrawal records:', err);
            throw new InternalServerErrorException('Failed to fetch withdrawal records');
        }
    }

    async createWithdrawalRequest(uid: string, email: string, payload: WithdrawalPayload): Promise<WithdrawalEntity>{
        console.log(`Creating withdrawal request for user: ${uid}, staking_id: ${payload.staking_id}`);
        const timestamp = Date.now();
        const withdrawalEntity = await this.dataSource.transaction(async manager=>{
            try{
                // Find the staking record
                const stakingRepo = manager.getRepository(StakingEntity);
                const staking = await stakingRepo.findOne({
                    where: { staking_id: payload.staking_id }
                });

                if (!staking) {
                    throw new NotFoundException('Staking record not found');
                }

                // Verify that the staking creator is the one making the withdrawal request
                if (staking.uid !== uid) {
                    throw new UnauthorizedException('You are not authorized to withdraw from this staking. Only the staking creator can make withdrawal requests.');
                }

                // Verify staking is active
                if (staking.staking_status !== Active) {
                    throw new UnprocessableEntityException('Cannot withdraw from inactive staking');
                }

                // Check if there's already a pending withdrawal for this staking
                const withdrawalRepo = manager.getRepository(WithdrawalEntity);
                const existingPendingWithdrawal = await withdrawalRepo.findOne({
                    where: { 
                        staking_id: payload.staking_id,
                        withdrawal_status: 'Pending'
                    }
                });

                if (existingPendingWithdrawal) {
                    throw new UnprocessableEntityException('A pending withdrawal request already exists for this staking');
                }

                // Determine withdrawal amount (use provided amount or full staked amount)
                const withdrawalAmount = payload.withdrawal_amount_crypto || staking.staked_amount_crypto;
                const withdrawalAmountFiat = staking.staked_amount_fiat; // Keep same fiat value for reference

                // Create withdrawal entity with all token information from staking
                const withdrawal_id = MyUtils.generateUUID();
                
                const withdrawalData: Partial<WithdrawalEntity> = {
                    withdrawal_id,
                    uid,
                    staking_id: staking.staking_id,
                    withdrawal_created_at: BigInt(timestamp),
                    withdrawal_updated_at: BigInt(timestamp),
                    // Token information from staked asset
                    withdrawal_asset_symbol: staking.staked_asset_symbol,
                    withdrawal_asset_contract: staking.staked_asset_contract,
                    withdrawal_asset_decimals: staking.stacked_asset_decimals,
                    withdrawal_asset_name: staking.staked_asset_name,
                    withdrawal_asset_image: staking.staked_asset_image,
                    // Withdrawal amounts
                    withdrawal_amount_crypto: withdrawalAmount,
                    withdrawal_amount_fiat: withdrawalAmountFiat,
                    // Status
                    withdrawal_status: 'Pending',
                    // Chain information (if available from staking reward chain)
                    withdrawal_chain_id: staking.staking_reward_chain_id,
                    withdrawal_chain_name: staking.staking_reward_chain_name,
                };

                const entity = withdrawalRepo.create(withdrawalData as WithdrawalEntity);
                const savedWithdrawal = await withdrawalRepo.save(entity);
                //Update the staking status to Completed
                staking.staking_status = Completed;
                await stakingRepo.save(staking);
                
                // // Delete the staking after withdrawal is created
                // await stakingRepo.delete({ staking_id: staking.staking_id });
                console.log(`Staking ${staking.staking_id} deleted after withdrawal ${withdrawal_id} was created`);
                return savedWithdrawal;
            }catch(err){
                console.error('Error creating withdrawal request:', err);
            
                throw new InternalServerErrorException('Failed to create withdrawal request');
            }
        })
        const notification: NotificationEntity = new NotificationEntity();
        notification.noti_id = MyUtils.generateUUID();
        notification.noti_user = uid;
        notification.noti_title = 'Withdrawal Request Created';
        notification.noti_description = `Withdrawal request for staking ${withdrawalEntity.staking_id} was created`;
        notification.noti_type = NOTIFICATION_TYPE_WITHDRAWAL;
        notification.noti_created_at = BigInt(timestamp);
        notification.noti_updated_at = BigInt(timestamp);
        notification.noti_seen = false;
        await this.notificationService.createNotification(notification);
        this.sendPushNotification(uid, 'Withdrawal Request Created', `Withdrawal request for staking ${withdrawalEntity.staking_id} was created`, withdrawalEntity);
        return withdrawalEntity;
    }
    

    async submitTransaction(uid: string, signedTx: string,rpc: string): Promise<boolean> {
        const provider = new JsonRpcProvider(rpc);
        const maxAttempts = 3;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const txHash = await provider.send("eth_sendRawTransaction", [signedTx]);
                console.log(`Transaction submitted for user ${uid} : ${txHash} (attempt ${attempt})`);
                const receipt = await provider.waitForTransaction(txHash);
                if (receipt?.status === 1) {
                    console.log("Transaction SUCCESS");
                    return true;
                } else {
                    console.log(`Transaction FAILED (attempt ${attempt})`);
                    
                    // fall through to retry if attempts remain
                }
            } catch (err) {
                console.error(`Error submitting transaction (attempt ${attempt}):`, err);
                provider.destroy
            }

            if (attempt < maxAttempts) {
                // simple backoff before retrying
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }

        console.log(`Transaction submission failed after ${maxAttempts} attempts for user ${uid}`);
        return false;
    }

    async sendPushNotification(uid: string, title: string, body: string, payload: any) {
        
            setImmediate(async () => {
                try{
                const user = await this.userService.getProfileByUid(uid);
                const loggedDeviceRepo = this.dataSource.manager.getRepository(LoggedDevice);
                const devices: LoggedDevice[] = await loggedDeviceRepo.find({ where: { user_id: uid }, order: { logged_at: "DESC" } });
                
                if (!devices || devices.length === 0) {
                    console.log(`No devices found for user ${uid}, skipping push notification`);
                    return;
                }
                
                const firstDevice = devices[0];
                if (!firstDevice || !firstDevice.device_token) {
                    console.log(`No device token found for user ${uid}, skipping push notification`);
                    return;
                }
                
                const userToken = firstDevice.device_token;
                const data = JSON.parse(JSON.stringify({
                    payload: JSON.stringify(payload),
                    notification: JSON.stringify({
                        title: title,
                        body: body
                    })
                }));
                await this.pushService.sendToToken(userToken, title, body, data);
                
            }catch(err){
                console.error('Error sending push notification:', err);
                // throw new InternalServerErrorException('Failed to send push notification');
            }
            });
        
        
    }
    async getSubscriptionByMiningTag(miningTag: string): Promise<SubscriptionEntity> {
        try{
            const subscriptionRepository = this.dataSource.manager.getRepository(SubscriptionEntity)
            const subscription = await subscriptionRepository.findOne({ where: { sub_mining_tag: miningTag } })
            return subscription;
        }catch(err){
            console.error('Error getting subscription by mining tag:', err);
            throw new InternalServerErrorException('Failed to get subscription by mining tag');
        }
    }
    async getSubscriptionById(subscriptionId: string): Promise<SubscriptionEntity> {
        try {
            const subscriptionRepository = this.dataSource.manager.getRepository(SubscriptionEntity)
            const subscription = await subscriptionRepository.findOne({ where: { sub_id: subscriptionId } })
            return subscription;
        } catch (err) {
            console.error('Error getting subscription by id:', err);
            throw new InternalServerErrorException('Failed to get subscription by id');
        }
    }
    async getSubscriptionReferrals(uid: string, subscriptionId: string): Promise<ReferralDto[]> {
        this.logger.debug("Getting referrals for user ", uid)
        this.logger.debug("Subscription ID: ", subscriptionId)
        const referrals: ReferralDto[] = []
        const query = `SELECT * FROM referrals r 
                       LEFT JOIN profiles p ON r.referree_uid = p.uid
                       WHERE referral_uid = ? AND referral_subscription_id = ?`;
        const referralRepository = this.dataSource.manager.getRepository(ReferralEntity)
        const results: [] = await referralRepository.query(query, [uid, subscriptionId])
        this.logger.debug(`Found ${results.length} referrals for user ${uid}`)
        for (const row of results) {
            const referralDto = new ReferralDto()
            const referralEntity = ReferralEntityMapper.toEntity(row);
            const referreeEntity = ProfileMapper.toEntity(row);
            referralDto.info = referralEntity
            referralDto.profile = referreeEntity
            referrals.push(referralDto)
        }
        return referrals;
    }

    //This only return data for ancestors
    async getIndirectReferrals(uid: string, subscriptionId: string): Promise<ReferralDto[]> {
        this.logger.debug("Getting indirect referrals for user ", uid)
        this.logger.debug(`Subscription ID: ${subscriptionId}`)
        const referrals: ReferralDto[] = []
        const query = `SELECT * FROM referrals r
                       WHERE r.referral_ancestor_uid = ? AND r.referral_ancestor_sub_id = ?`;
        const referralRepository = this.dataSource.manager.getRepository(ReferralEntity)
        const results: [] = await referralRepository.query(query, [uid, ,subscriptionId])
        this.logger.debug(`Found ${results.length} indirect referrals for user ${uid}`)
        for (const row of results) {
            const referralDto = new ReferralDto()
            const referralEntity = ReferralEntityMapper.toEntity(row);
            const referreeEntity = ProfileMapper.toEntity(row);
            referralDto.info = referralEntity
            referralDto.profile = referreeEntity
            referrals.push(referralDto)
        }
        return referrals;
    }

    async hasReferredSomeone(referralUid: string, referreeUid: string): Promise<boolean> {
        this.logger.debug(`Checking if user ${referralUid} has referred someone with user id ${referreeUid} before`);
        try {
            const query = "SELECT COUNT(*) as count FROM referrals WHERE referral_uid = ? AND (referree_uid = ? OR referral_descendant_uid = ?)";
            const results: any[] = await this.dataSource.manager.getRepository(ReferralEntity).query(query, [referralUid, referreeUid, referreeUid]);
            const count = results[0]?.count || 0;
            return count > 0;
        } catch (err) {
            this.logger.error(`Error checking referrals for user ${referralUid} with user id ${referreeUid}:`, err);
            throw new UnprocessableEntityException('An error occurred');
        }
    }
    async hasBeenReferredBefore(referreeUid: string): Promise<boolean> {
        try{
            const query = "SELECT COUNT(*) as count FROM referrals WHERE referree_uid = ?";
            const results: any[] = await this.dataSource.manager.getRepository(ReferralEntity).query(query, [referreeUid]);
            const count = results[0]?.count || 0;
            return count > 0;
        } catch (err) {
            this.logger.error(`Error checking if user ${referreeUid} has been referred before:`, err);
            throw new UnprocessableEntityException('An error occurred');
        }
    }

    async getAncestor(referreeUid: string): Promise<ReferralEntity | null> {
        try{
            //This should return the very first ancestor of the user
            const query = "SELECT * FROM referrals WHERE referree_uid = ? AND referral_ancestor_uid IS NOT NULL ORDER BY referral_created_at ASC LIMIT 1";
            const results: any[] = await this.dataSource.manager.getRepository(ReferralEntity).query(query, [referreeUid]);
            if (results.length > 0) {
                this.logger.debug(`Ancestor found for user ${referreeUid}: ${results[0].referral_ancestor_uid}`);
                const referralEntity = ReferralEntityMapper.toEntity(results[0]);
                return referralEntity;
            }else{
                console.log(`No ancestor found for user ${referreeUid}`);
                return null;
            }
        } catch (err) {
            this.logger.error(`Error getting ancestor: ${referreeUid}`, err);
            throw new UnprocessableEntityException('An error occurred');
        }
    }
    async checkIfWalletExistsInSub(walletHash: string): Promise<boolean> {
        try{
            const query = "SELECT COUNT(*) as count FROM subscriptions WHERE sub_wallet_hash = ?";
            const results: any[] = await this.dataSource.manager.getRepository(SubscriptionEntity).query(query, [walletHash]);
            const count = results[0]?.count || 0;
            return count > 0;
        }
        catch(err){
            this.logger.error(`Error checking if wallet exists: ${walletHash}:`, err);
            throw new UnprocessableEntityException('An error occurred');
        }
    }
    checkIfProductIsSame(uplineName: string, newSubName: string): boolean {
        return uplineName===newSubName;

    }
}


