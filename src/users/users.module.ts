import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserManager } from './user_manager';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user_entity';
import { ProfileEntity } from './entities/profile_entity';
import { LoggedDevice } from 'src/auth/entities/logged_device';
import { ReferralEntity } from './entities/referral_entity';

@Module({

  imports: [
    TypeOrmModule.forFeature([
      UserEntity, ProfileEntity, LoggedDevice,ReferralEntity
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService, UserManager]
  
})
export class UsersModule {}
