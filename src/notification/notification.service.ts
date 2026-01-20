import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { NotificationEntity } from './entities/Notification_entity';
@Injectable()
export class NotificationService {

    constructor(private dataSource: DataSource){
        
    }


    async createNotification(notification: NotificationEntity): Promise<NotificationEntity> {
        const notificationRepository = this.dataSource.getRepository(NotificationEntity);
        return notificationRepository.save(notification);
    }

    async getNotificationsByUid(uid: string, offset: number = 0, limit: number = 20): Promise<NotificationEntity[]> {
        console.log(`Fetching notifications for user: ${uid}, offset: ${offset}, limit: ${limit}`);
        const notificationRepository = this.dataSource.getRepository(NotificationEntity);
        return notificationRepository.find({
            where: { noti_user: uid },
            order: { noti_created_at: 'DESC' },
            skip: offset,
            take: limit
        });
    }

    async getUnreadNotificationsByUid(uid: string, offset: number = 0, limit: number = 20): Promise<NotificationEntity[]> {
        console.log(`Fetching unread notifications for user: ${uid}, offset: ${offset}, limit: ${limit}`);
        const notificationRepository = this.dataSource.getRepository(NotificationEntity);
        return notificationRepository.find({
            where: { 
                noti_user: uid,
                noti_seen: false
            },
            order: { noti_created_at: 'DESC' },
            skip: offset,
            take: limit
        });
    }

    async getUnreadNotificationsCount(uid: string): Promise<{ count: number }> {
        console.log(`Getting unread notifications count for user: ${uid}`);
        const notificationRepository = this.dataSource.getRepository(NotificationEntity);
        const count = await notificationRepository.count({
            where: { 
                noti_user: uid,
                noti_seen: false
            }
        });
        return { count };
    }

    async markNotificationAsSeen(uid: string, notificationId: string): Promise<NotificationEntity> {
        console.log(`Marking notification ${notificationId} as seen for user: ${uid}`);
        const notificationRepository = this.dataSource.getRepository(NotificationEntity);
        
        const notification = await notificationRepository.findOne({
            where: { noti_id: notificationId, noti_user: uid }
        });

        if (!notification) {
            throw new NotFoundException('Notification not found or you do not have permission to access it');
        }

        notification.noti_seen = true;
        notification.noti_seen_at = BigInt(Date.now());
        notification.noti_updated_at = BigInt(Date.now());

        return await notificationRepository.save(notification);
    }

}
