import {Column, Entity, PrimaryColumn} from 'typeorm'
@Entity("profiles")
export class ProfileEntity {
    @PrimaryColumn({unique:true,nullable:false})
    uid: string
    @Column({nullable: false})
    email: string
    @Column({ nullable: false })
    account_status: string
    @Column({ nullable: false })
    roles   : string
    @Column({ nullable: false })
    profile_created_at: number
    @Column({ nullable: false })
    profile_updated_at: number
    @Column({ nullable: true })
    pin: string
    @Column({ nullable: false })
    referral_code: string
}