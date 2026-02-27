import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { UserEntity } from './users/entities/user_entity';
import { ProfileEntity } from './users/entities/profile_entity';
import { AuthModule } from './auth/auth.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UserManager } from './users/user_manager';
import { UsersService } from './users/users.service';
import { AuthService } from './auth/auth.service';
import { LoggedDevice } from './auth/entities/logged_device';
import { ProductsModule } from './products/products.module';
import { SubscriptionEntity } from './products/entities/subscription_entities';
import { MiningEntity } from './products/entities/minings';
import { StakingEntity } from './products/entities/staking_entity';
import { WithdrawalEntity } from './products/entities/withdrawal_entity';
import { ReferralEntity } from './users/entities/referral_entity';
import { NotificationModule } from './notification/notification.module';
import { NotificationEntity } from './notification/entities/Notification_entity';
import { StakingReferralsEntity } from './products/entities/staking_referrals';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService)=>({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        bigNumberStrings: true,
        entities:[                
          UserEntity, ProfileEntity, LoggedDevice, SubscriptionEntity, MiningEntity, StakingEntity, WithdrawalEntity, ReferralEntity, StakingReferralsEntity, NotificationEntity
        ],
        synchronize: false,
      })
    }),
    UsersModule,
    AuthModule,
    ProductsModule,
    NotificationModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
