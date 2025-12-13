import { Injectable, Logger, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { RegistrationDto } from './dtos/registration_dto';
import { UserEntity } from './entities/user_entity';
import { UserManager } from './user_manager';
import { MyUtils } from 'src/utils/my_utils';
import { ProfileEntity } from './entities/profile_entity';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from "typeorm/entity-manager/EntityManager";
import { plainToInstance } from 'class-transformer';
import { LoggedDevice } from 'src/auth/entities/logged_device';
import { ReferralEntity } from './entities/referral_entity';
import { ReferralDto } from './dtos/referral_dto';
import { ReferralEntityMapper } from 'src/utils/mapper/referral_entity_maper';

@Injectable()
export class UsersService {


    logger = new Logger(UsersService.name);

    constructor(
        private userManager: UserManager,
        @InjectEntityManager() private readonly entityManager: EntityManager,
    ) { }


    async getProfileByUid(uid: string) : Promise<ProfileEntity> {
        const query = "SELECT * FROM profiles WHERE uid = ?";
    
        const result = await this.entityManager.query(query, [uid]);
        if(!result||result.length===0){
            throw new NotFoundException("User not found")
        }
        return plainToInstance(ProfileEntity, result[0]);

    }

    async checkEmailExists(email: string): Promise<boolean> {
        try{
            const query = "SELECT * FROM users WHERE email = ?";
            const result = await this.entityManager.query(query, [email]);
            return result.length > 0;
        }catch(err){
            throw new UnprocessableEntityException('An error occurred while processing your request');
        }
    }
   
    async getLoggedDevice(uid:string): Promise<LoggedDevice[]>{
        try{
            const query = "SELECT * FROM logged_devices WHERE user_id = ? ORDER BY logged_at DESC";
            const results:[] = await this.entityManager.query(query, [uid]);
            return plainToInstance(LoggedDevice, results);
        }catch(err){
            throw new UnprocessableEntityException('An error occurred while processing your request');
        }

    }

    async getReferrals(uid: string): Promise<ReferralDto[]> {
        this.logger.debug("Getting referrals for user ",uid)
        const referrals: ReferralDto[]=[]
        const query = `SELECT * FROM referrals r
                       LEFT JOIN profiles p ON r.referree_uid = p.uid
                       WHERE referral_uid = ? `;
        const results: []=await this.userManager.referralRepository.query(query,[uid])
        for(const row of results){
            const referralDto=new ReferralDto()
            const referralEntity = ReferralEntityMapper.toEntity(row);
            const referreeEntity= row as ProfileEntity
            referralDto.info=referralEntity
            referralDto.profile = referreeEntity
            referrals.push(referralDto)
        }
        return referrals;
    }

    async refferalCodeUser(referralCode: string): Promise<ProfileEntity>{
        this.logger.debug("getting user this referral belongs to ", referralCode)
        const query ="SELECT * from profiles WHERE referral_code=?"
        const results: [] = await this.userManager.profileRepository.query(query, [referralCode])
        if(results.length===0){
            this.logger.debug("Could not find user that this referral code belongs to")
        }
        return results.at(0)as ProfileEntity
    }
}
