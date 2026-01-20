import { Controller, Get, Patch, Param, Query, Request, UnauthorizedException, ParseIntPipe, DefaultValuePipe, Post } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notification')
export class NotificationController {
    constructor(private notificationService: NotificationService) {}

    @Get("notifications")
    async getNotifications(
        @Request() req,
        @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number
    ): Promise<any> {
        const { uid } = req.user;
        if (!uid) {
            throw new UnauthorizedException('Missing user id on request');
        }
        return await this.notificationService.getNotificationsByUid(uid, offset, limit);
    }

    @Get("notifications/unread")
    async getUnreadNotifications(
        @Request() req,
        @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number
    ): Promise<any> {
        const { uid } = req.user;
        if (!uid) {
            throw new UnauthorizedException('Missing user id on request');
        }
        return await this.notificationService.getUnreadNotificationsByUid(uid, offset, limit);
    }

    @Get("notifications/unread/count")
    async getUnreadNotificationsCount(@Request() req): Promise<any> {
        const { uid } = req.user;
        if (!uid) {
            throw new UnauthorizedException('Missing user id on request');
        }
        return await this.notificationService.getUnreadNotificationsCount(uid);
    }

    @Post("seen/:id")
    async markNotificationAsSeen(
        @Request() req,
        @Param('id') notificationId: string
    ): Promise<any> {
        const { uid } = req.user;
        if (!uid) {
            throw new UnauthorizedException('Missing user id on request');
        }
        return await this.notificationService.markNotificationAsSeen(uid, notificationId);
    }
}
