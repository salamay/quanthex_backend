import { Column, Entity, PrimaryColumn } from 'typeorm';


@Entity('subscriptions')
export class SubscriptionEntity {

    @PrimaryColumn({unique:true,nullable:false})
    sub_id:string
    @Column({nullable:false})
    uid:string
    @Column({ nullable: false })
    email:string
    @Column({ nullable: false })
    sub_type: string
    @Column({ nullable: false })
    sub_chain_id: number
    @Column({ nullable: false })
    sub_asset_contract: string
    @Column({ nullable: false })
    sub_asset_symbol: string
    @Column({ nullable: false })
    sub_asset_name: string
    @Column({ nullable: false })
    sub_asset_decimals: number
    @Column({ nullable: false })
    sub_asset_image: string
    @Column({ nullable: false })
    sub_created_at: number
    @Column({ nullable: false })
    sub_updated_at: number
    @Column({ nullable: false })
    sub_status: string
    @Column({ nullable: false })
    sub_reward_contract: string
    @Column({ nullable: false })
    sub_reward_chain_id: number
    @Column({ nullable: false })
    sub_reward_asset_name: string
    @Column({ nullable: false })
    sub_reward_asset_symbol: string
    @Column({ nullable: false })
    sub_reward_asset_image: string
    @Column({ nullable: false })
    sub_reward_asset_decimals: number
    @Column({ nullable: false })
    sub_package_name: string
    @Column({ nullable: false })
    sub_duration: number

}