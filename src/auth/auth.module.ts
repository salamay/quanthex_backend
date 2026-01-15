import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserManager } from 'src/users/user_manager';
import { UsersService } from 'src/users/users.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/users/entities/user_entity';
import { ProfileEntity } from 'src/users/entities/profile_entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MyJwtStrategy } from './jwt/my_jwt_strategy';
import { LoggedDevice } from './entities/logged_device';
import { ReferralEntity } from 'src/users/entities/referral_entity';
import { ProductsService } from 'src/products/products.service';
import { ProductsManager } from 'src/products/products_manager';
import { SubscriptionEntity } from 'src/products/entities/subscription_entities';
import { MiningEntity } from 'src/products/entities/minings';
import { StakingEntity } from 'src/products/entities/staking_entity';
import { OtpService } from './otp/otp_service';
import { EmailApiService } from './email.service';
import { PushService } from './push.service';
import { WithdrawalEntity } from 'src/products/entities/withdrawal_entity';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationEntity } from 'src/notification/entities/Notification_entity';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([UserEntity, ProfileEntity, LoggedDevice, ReferralEntity, SubscriptionEntity, MiningEntity, StakingEntity, WithdrawalEntity, NotificationEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '365d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, UserManager, UsersService, MyJwtStrategy, ProductsService, ProductsManager, OtpService, EmailApiService, PushService, NotificationService]
})
export class AuthModule {}
