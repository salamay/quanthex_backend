import { Injectable } from '@nestjs/common';
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

}
