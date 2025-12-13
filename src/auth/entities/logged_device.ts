import { Column, Entity, PrimaryColumn } from 'typeorm'


@Entity('logged_devices')
export class LoggedDevice {
    @PrimaryColumn({nullable: false,unique:true})
    device_id: string
    @Column({nullable: false})
    device_token: string
    @Column({nullable: false})
    user_id: string
    @Column({nullable: false})
    logged_at: number
    @Column({nullable: false})
    device_type: string
}
