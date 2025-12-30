import { Injectable, InternalServerErrorException, UnprocessableEntityException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { ProductsManager } from './products_manager';
import { SubscriptionPayload } from './dtos/subscription_payload';
import { SubscriptionEntity } from './entities/subscription_entities';
import { JsonRpcProvider } from 'ethers';
import { Active, MINING } from 'src/constants/my_constants';
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

@Injectable()
export class ProductsService {

    constructor(
        private productsManager: ProductsManager,
        private dataSource: DataSource,
    ) {}

    async subscribeToProduct(uid: string, email: string, payload: SubscriptionPayload): Promise<SubscriptionEntity> {
        const rpc=NetworkUtils.getRpc(payload.sub_chain_id)
        const status: Boolean = await this.submitTransaction(uid, payload.sub_signed_tx, rpc)
        if (!status){
            throw new UnprocessableEntityException('Transaction submission failed');
        }
        payload.email = email;
        const subType=payload.sub_type;
        if (subType === MINING){
            const subEntity: SubscriptionEntity= await this.createSubscriptionProduct(uid,email, payload);
            await this.createMiningRecord(uid, email, subEntity);
            return subEntity;
        }else{

        }
    }

    /**
     * Convert SubscriptionPayload -> SubscriptionEntity and persist.
     * Uses TypeORM repository.create() to map plain object to entity instance,
     * then repository.save() to insert/update.
     */
    async createSubscriptionProduct(uid: string, email: string,payload: SubscriptionPayload): Promise<SubscriptionEntity> {
        console.log(`Creating subscription product for user: ${uid}`);
        const timestamp = Date.now();
        payload.email = email;
        payload.sub_created_at = BigInt(timestamp);
        payload.sub_updated_at = BigInt(timestamp);
        payload.sub_status = Active
        return await this.dataSource.transaction(async manager => {
            try {
                const sub_id=MyUtils.generateUUID()
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
        })
    }
    
    
    async createMiningRecord(uid:string,email:string,payload:SubscriptionEntity):Promise<MiningEntity>{
        console.log(`Creating mining record for user: ${uid}`);
        const timestamp = Date.now();
        return await this.dataSource.transaction(async manager=>{
            const miningEntity=new MiningEntity();
            miningEntity.min_id =MyUtils.generateUUID();
            miningEntity.uid=uid;
            miningEntity.email=email;
            miningEntity.min_created_at = BigInt(timestamp);
            miningEntity.min_updated_at=BigInt(timestamp);
            miningEntity.min_subscription_id = payload.sub_id;
            miningEntity.hash_rate=ProductUtils.LEVEL_ONE_HASHRATE.toString();
            const miningRepo=manager.getRepository(MiningEntity);
            return await miningRepo.save(miningEntity);
        })
    }

    async createStakingRecord(uid: string, email: string, payload: StakingPayload): Promise<StakingEntity>{
        console.log(`Creating staking record for user: ${uid}`);
        const timestamp = Date.now();
        const status: Boolean = await this.submitTransaction(uid, payload.signed_tx, payload.rpc)
        if (!status) {
            throw new UnprocessableEntityException('Transaction submission failed');
        }
        return await this.dataSource.transaction(async manager=>{
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
                where:{uid:uid},
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
        return await this.dataSource.transaction(async manager=>{
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
                
                // Delete the staking after withdrawal is created
                await stakingRepo.delete({ staking_id: staking.staking_id });
                console.log(`Staking ${staking.staking_id} deleted after withdrawal ${withdrawal_id} was created`);
                
                return savedWithdrawal;
            }catch(err){
                console.error('Error creating withdrawal request:', err);
            
                throw new InternalServerErrorException('Failed to create withdrawal request');
            }
        })
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
            }

            if (attempt < maxAttempts) {
                // simple backoff before retrying
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }

        console.log(`Transaction submission failed after ${maxAttempts} attempts for user ${uid}`);
        return false;
    }
}
