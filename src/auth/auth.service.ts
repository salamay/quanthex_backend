import { Injectable, Logger, UnprocessableEntityException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MyUtils } from 'src/utils/my_utils';
import { ProfileEntity } from 'src/users/entities/profile_entity';
import { UserEntity } from 'src/users/entities/user_entity';
import { RegistrationDto } from 'src/users/dtos/registration_dto';
import { UserManager } from 'src/users/user_manager';
import { ROLE_USER } from 'src/constants/my_constants';
import { Transactional } from 'typeorm-transactional';
import { v4 as uuidv4 } from 'uuid';
import { DataSource } from 'typeorm';
import { UsersService } from 'src/users/users.service';
import { LoggedDevice } from './entities/logged_device';
import { ReferralEntity } from 'src/users/entities/referral_entity';
import { ProductsService } from 'src/products/products.service';
import { ProductUtils } from 'src/products/utils/product_utils';
import { MiningMapper } from 'src/products/utils/mapper/mining_mapper';
import { MiningEntity } from 'src/products/entities/minings';
import { PushService } from './push.service';
import { OAuth2Client } from 'google-auth-library/build/src/auth/oauth2client';

@Injectable()
export class AuthService {
    logger =new Logger(AuthService.name);
    client = new OAuth2Client(process.env.OAUTH_CLIENT_ID);

    constructor(
        private dataSource: DataSource,
        private JwtService: JwtService,
        private userService: UsersService,
        private productService: ProductsService,
        private pushService: PushService
    ) { }


    async registerUser(registerDto: RegistrationDto): Promise<any> {
        console.log('Registering user with email:', registerDto.email);
        const emailExists = await this.userService.checkEmailExists(registerDto.email);
        if (emailExists) {
            throw new UnprocessableEntityException('Email already exists');
        }
    
        return await this.dataSource.transaction(async manager => {
            const userRepository = manager.getRepository(UserEntity);
            const profileRepository = manager.getRepository(ProfileEntity);
            const uid = uuidv4();
            const userEntity = new UserEntity();
            userEntity.uid = uid;
            userEntity.email = registerDto.email;
            userEntity.password = registerDto.password;
            userEntity.account_status = 'active';
            userEntity.device_token = registerDto.device_token;
            userEntity.roles = ROLE_USER;
            userEntity.user_created_at = BigInt(Date.now());
            userEntity.reg_via = registerDto.reg_via;
            try {
                await userRepository.save(userEntity);
            } catch (err) {
                console.error('Error saving user entity:', err);
                throw new UnprocessableEntityException('An error occurred while processing your request');
            }
            const profileEntity = new ProfileEntity();
            profileEntity.uid = userEntity.uid;
            profileEntity.email = userEntity.email;
            profileEntity.account_status = userEntity.account_status;
            profileEntity.roles = userEntity.roles;
            profileEntity.profile_created_at = BigInt(Date.now());
            profileEntity.profile_updated_at = BigInt(Date.now());
            profileEntity.pin = null;
            profileEntity.referral_code = MyUtils.generateLetterCode(6);
            try {
                await profileRepository.save(profileEntity);
            } catch (err) {
                console.error('Error saving profile entity:', err);
                throw new UnprocessableEntityException('An error occurred while processing your request');
            }
            const loggedDevice: LoggedDevice=new LoggedDevice();
            loggedDevice.device_id=registerDto.device_id;
            loggedDevice.device_token=registerDto.device_token;
            loggedDevice.user_id=uid;
            loggedDevice.logged_at = BigInt(Date.now());
            loggedDevice.device_type=registerDto.device_type;
            const loggedDeviceRepo=manager.getRepository(LoggedDevice);
            await loggedDeviceRepo.save(loggedDevice);
           
            setImmediate(() => {
                this.pushService.sendToToken(
                    registerDto.device_token,
                    'Welcome to Quanthex!',
                    'Thank you for registering with Quanthex. We are excited to have you on board.',
                ).catch(err => this.logger.error('Error sending welcome push notification', err));
            });
            return this.JwtService.sign({ uid: userEntity.uid, email: userEntity.email, roles: userEntity.roles });
        });
    }
    async verifyUser(payload: any):Promise<any>{
        const email=payload.email;
        const password=payload.password;
        const query="SELECT * FROM users WHERE email = ?";
        const results:[]=await this.dataSource.manager.query(query, [email]);
        if (results.length===0){
            throw new UnprocessableEntityException('Invalid email or password');
        }
        const user = results.at(0) as UserEntity;
        if(user.password!==password){
            throw new UnprocessableEntityException('Password is incorrect');
        }
        return user;
    }

    async signIn(payload:any): Promise<any>{
        const email = payload.email;
        const device_token = payload.device_token;
        const device_id = payload.device_id;
        const device_type = payload.device_type;
        const query="SELECT * FROM users WHERE email = ?";
        const results:[]=await this.dataSource.manager.query(query, [email]);
        if (results.length===0){
            throw new UnprocessableEntityException('Invalid email or password');
        }
        const user = results.at(0) as UserEntity;
        if (user.reg_via ==='Basic'){
            const password = payload.password;
            if (user.password !== password) {
                throw new UnprocessableEntityException('Password is incorrect');
            }
        }else if(user.reg_via ==='Google'){

        }else{
            throw new UnprocessableEntityException('Invalid registration method');
        }
        const loggedDevice: LoggedDevice = new LoggedDevice();
        loggedDevice.device_id = device_id;
        loggedDevice.device_token = device_token;
        loggedDevice.user_id = user.uid;
        loggedDevice.logged_at = BigInt(Date.now());
        loggedDevice.device_type = device_type;
        const loggedDeviceRepo = this.dataSource.manager.getRepository(LoggedDevice);
        await loggedDeviceRepo.save(loggedDevice);
        return this.JwtService.sign({ uid: user.uid, email: user.email, roles: user.roles });

    }

    async googleLogin(payload :any): Promise<any>{
        const {id_token}=payload;
        const ticket = await this.client.verifyIdToken({
            idToken:id_token,
            audience: process.env.GOOGLE_CLIENT_ID, // Use your Android/iOS Client ID
        });
        const googlePayload = ticket.getPayload();
        const email = googlePayload.email;
        const firstName = googlePayload.given_name;
        const lastName = googlePayload.family_name;
        console.log(email,firstName,lastName);
        const query="SELECT * FROM users WHERE email = ?";
        const results:[]=await this.dataSource.manager.query(query, [email]);
        const user = results.at(0) as UserEntity;
        if (results.length===0){
            throw new UnprocessableEntityException('Could not find user with this email');
        }
        if(user.reg_via ==='Google'){
            return await this.signIn(payload)
        }
    }
}
