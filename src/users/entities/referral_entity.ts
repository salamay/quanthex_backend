import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn } from "typeorm";

@Entity('referrals')
export class ReferralEntity {
    @PrimaryColumn()
    id: string
    @Column({nullable: false})
    referral_uid: string
    @Column({ nullable: false })
    referree_uid: string
    @Column({ nullable: false })
    referral_created_at: number
    @Column({ nullable: false })
    referral_updated_at: number
}