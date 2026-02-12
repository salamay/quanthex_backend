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
import { ProfileMapper } from './mapper/profile_mapper';
import { REFERRAL_DEPTH_DIRECT, REFERRAL_DEPTH_INDIRECT } from 'src/constants/my_constants';

@Injectable()
export class UsersService {


    logger = new Logger(UsersService.name);

    constructor(
        private userManager: UserManager,
        @InjectEntityManager() private readonly entityManager: EntityManager,
    ) { }


    async getProfileByUid(uid: string) : Promise<ProfileEntity> {
        const query = "SELECT * FROM profiles WHERE uid = ?";
        const userRepository = this.userManager.profileRepository;
        const result = await userRepository.query(query, [uid]);
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

    async getDirectReferrals(uid: string): Promise<ReferralDto[]> {
        this.logger.debug("Getting referrals for user ",uid)
        const depth = REFERRAL_DEPTH_DIRECT;
        const referrals: ReferralDto[]=[]
        const query = `SELECT * FROM referrals r
                       LEFT JOIN profiles p ON r.referree_uid = p.uid
                       WHERE referral_uid = ? AND depth = ? `;
        try {
            const results: [] = await this.userManager.referralRepository.query(query, [uid, +depth])
            this.logger.debug(`Found ${results.length} referrals for user ${uid}`)
            for (const row of results) {
                const referralDto = new ReferralDto()
                const referralEntity = ReferralEntityMapper.toEntity(row);
                const referreeEntity = ProfileMapper.toEntity(row);
                referralDto.info = referralEntity
                referralDto.profile = referreeEntity
                referrals.push(referralDto)
            }
        } catch (err) {
            throw new UnprocessableEntityException('An error occurred while processing your request');
        }
        return referrals;
    }

    async refferalCodeUser(referralCode: string): Promise<ProfileEntity>{
        this.logger.debug("getting user this referral belongs to ", referralCode)
        const query ="SELECT * from profiles WHERE referral_code=?"
        try{
        const results: [] = await this.userManager.profileRepository.query(query, [referralCode])
        if(results.length===0){
            this.logger.debug("Could not find user that this referral code belongs to")
            throw new NotFoundException("User not found")
        }
        return results.at(0)as ProfileEntity
        }catch(err){
            throw new UnprocessableEntityException('An error occurred while processing your request');
        }
    }

    async hasReferredSomeone(uid: string, referralCode: string): Promise<boolean> {
        this.logger.debug(`Checking if user ${uid} has referred someone with referral code ${referralCode} before`);
        try {
            const query = "SELECT COUNT(*) as count FROM referrals WHERE referral_uid = ? AND referree_uid = ?";
            const results: any[] = await this.userManager.referralRepository.query(query, [uid, referralCode]);
            const count = results[0]?.count || 0;
            return count > 0;
        } catch (err) {
            this.logger.error(`Error checking referrals for user ${uid} with referral code ${referralCode}:`, err);
            throw new UnprocessableEntityException('An error occurred while checking referrals');
        }
    }
}
