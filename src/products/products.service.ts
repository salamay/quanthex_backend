import { Injectable, InternalServerErrorException, UnprocessableEntityException } from '@nestjs/common';
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
        payload.sub_created_at = timestamp;
        payload.sub_updated_at = timestamp;
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
            miningEntity.min_created_at=timestamp;
            miningEntity.min_updated_at=timestamp;
            miningEntity.min_subscription_id = payload.sub_id;
            miningEntity.hash_rate=ProductUtils.LEVEL_FIVE_HASHRATE.toString();
            const miningRepo=manager.getRepository(MiningEntity);
            return await miningRepo.save(miningEntity);
        })
    }

    async createStakingRecord(uid: string, email: string, payload: StakingPayload): Promise<StakingEntity>{
        console.log(`Creating staking record for user: ${uid}`);
        const timestamp = Date.now();
        return await this.dataSource.transaction(async manager=>{
            try{
                const staking_id = MyUtils.generateUUID();
                const data = { ...payload, uid, email, staking_id, } as Partial<StakingEntity>;
                data.stake_created_at = timestamp;
                data.stake_updated_at = timestamp;
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
    

    async submitTransaction(uid: string, signedTx: string,rpc: string): Promise<boolean> {
        const provider=new JsonRpcProvider(rpc)
        try{
            const txHash = await provider.send("eth_sendRawTransaction",[signedTx])
            console.log(`Transaction submitted for user ${uid} : ${txHash}`);
            const receipt = await provider.waitForTransaction(txHash);
            // 3. Check status
            if (receipt?.status === 1) {
                console.log("Transaction SUCCESS");
                return true;
            } else {
                console.log("Transaction FAILED");
                return false
            }

        }catch(err){
            console.error('Error submitting transaction:', err);
            return false
        }
    }
}
