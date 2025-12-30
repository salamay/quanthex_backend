import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn } from "typeorm";

@Entity("withdrawals")
export class WithdrawalEntity {

    @PrimaryColumn()
    withdrawal_id: string;
    
    @Column()
    uid: string;

    
    @Column()
    staking_id: string;
    
    @Column({ nullable: false, type: 'bigint' })
    withdrawal_created_at: BigInt;
    
    @Column({ nullable: false, type: 'bigint' })
    withdrawal_updated_at: BigInt;
    
    // Token information from the staked asset
    @Column()
    withdrawal_asset_symbol: string;
    
    @Column()
    withdrawal_asset_contract: string;
    
    @Column()
    withdrawal_asset_decimals: number;
    
    @Column()
    withdrawal_asset_name: string;
    
    @Column()
    withdrawal_asset_image: string;
    
    // Withdrawal amount
    @Column()
    withdrawal_amount_crypto: string;
    
    @Column()
    withdrawal_amount_fiat: string;
    
    // Withdrawal status (e.g., "Pending", "Processing", "Completed", "Rejected")
    @Column()
    withdrawal_status: string;
    
    // Chain information (if needed for admin processing)
    @Column({ nullable: true })
    withdrawal_chain_id: number;
    
    @Column({ nullable: true })
    withdrawal_chain_name: string;
}

