import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn } from "typeorm";
@Entity("stakings")
export class StakingEntity {

    @PrimaryColumn()
    staking_id: string;
    @Column()
    uid: string
    @Column()
    email: string
    @Column({ nullable: false, type: 'bigint' })
    stake_created_at: BigInt
    @Column({ nullable: false, type: 'bigint' })
    stake_updated_at: BigInt
    @Column()
    staked_asset_symbol: string
    @Column()
    staked_asset_contract: string
    @Column()
    stacked_asset_decimals: number
    @Column()
    staked_asset_name: string
    @Column()
    staked_asset_image: string
    @Column()
    staked_amount_fiat: string
    @Column()
    staked_amount_crypto: string
    @Column()
    staking_status: string
    @Column()   
    staking_reward_contract: string
    @Column()
    staking_reward_chain_id: number
    @Column()
    staking_reward_chain_name: string
    @Column()
    staking_reward_asset_name: string
    @Column()
    staking_reward_asset_symbol: string
    @Column()
    staking_reward_asset_decimals: number
    @Column()
    staking_reward_asset_image: string
    @Column({ nullable: false, type: 'bigint' })
    duration: number
    @Column({ nullable: false, type: 'bigint' })
    end_date: number
    @Column({ nullable: false, type: 'bigint' })
    start_date: number
    @Column()
    staking_wallet_hash:string
    @Column()
    staking_wallet_address:string
    @Column({nullable: false})
    staking_referral_code:string
}
