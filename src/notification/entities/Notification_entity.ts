import { Column, Entity, PrimaryColumn } from 'typeorm';
@Entity('notifications')
export class NotificationEntity {
    @PrimaryColumn()
    noti_id: string;
    @Column()
    noti_user: string;
    @Column()
    noti_title: string;
    @Column()
    noti_description: string;
    @Column()
    noti_type: string;
    @Column({ type: 'bigint' })
    noti_created_at: BigInt;
    @Column({ type: 'bigint' })
    noti_updated_at: BigInt;
    @Column()
    noti_seen: boolean;
    @Column({ type: 'bigint' })
    noti_seen_at: BigInt;
    
}