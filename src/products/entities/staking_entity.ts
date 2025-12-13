import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn } from "typeorm";
@Entity("stakings")
export class StakingEntity {

    @PrimaryColumn()
    staking_id: string;
    @Column()
    uid: string
    @Column()
    email: string
    @Column()
    stake_created_at: number
    @Column()
    stake_updated_at: number
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
}
