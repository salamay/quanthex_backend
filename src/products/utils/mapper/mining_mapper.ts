import { MiningEntity } from "src/products/entities/minings"

export class MiningMapper {

    static toEntity(row:any):MiningEntity{
        const miningEntity=new MiningEntity()
        miningEntity.min_id = row.min_id
        miningEntity.uid = row.uid
        miningEntity.email=row.email
        miningEntity.min_created_at = row.min_created_at
        miningEntity.min_updated_at = row.min_updated_at
        miningEntity.min_subscription_id = row.min_subscription_id
        miningEntity.hash_rate = row.hash_rate
        return miningEntity
    }
}