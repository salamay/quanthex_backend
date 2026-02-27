import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionEntity } from './entities/subscription_entities';
import { ProductsController } from './products.controller';
import { ProductsManager } from './products_manager';
import { StakingEntity } from './entities/staking_entity';
import { WithdrawalEntity } from './entities/withdrawal_entity';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationEntity } from 'src/notification/entities/Notification_entity';
import { UsersService } from 'src/users/users.service';
import { PushService } from 'src/auth/push.service';
import { UserEntity } from 'src/users/entities/user_entity';
import { UserManager } from 'src/users/user_manager';
import { ReferralEntity } from 'src/users/entities/referral_entity';
import { ProfileEntity } from 'src/users/entities/profile_entity';
import { LoggedDevice } from 'src/auth/entities/logged_device';
import { StakingReferralsEntity } from './entities/staking_referrals';

@Module({
  imports: [
    TypeOrmModule.forFeature([SubscriptionEntity, StakingEntity, WithdrawalEntity, NotificationEntity, ReferralEntity,StakingReferralsEntity,ProfileEntity,UserEntity,LoggedDevice]),
  ],
  providers: [ProductsService, ProductsManager,NotificationService,UsersService,PushService,UserManager],
  controllers: [ProductsController]
})
export class ProductsModule {}
