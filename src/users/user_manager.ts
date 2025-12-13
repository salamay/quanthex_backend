import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UserEntity } from "./entities/user_entity";
import { Repository } from "typeorm";
import { ProfileEntity } from "./entities/profile_entity";
import { LoggedDevice } from "src/auth/entities/logged_device";
import { ReferralEntity } from "./entities/referral_entity";

@Injectable()
export class UserManager{

    constructor(
        @InjectRepository(UserEntity)public userRepository:Repository<UserEntity>,
        @InjectRepository(ProfileEntity)public profileRepository:Repository<ProfileEntity>,
        @InjectRepository(LoggedDevice)public loggedDeviceRepository:Repository<LoggedDevice>,
        @InjectRepository (ReferralEntity) public referralRepository:Repository<ReferralEntity>,
    ){

    }
    

}