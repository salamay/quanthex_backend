import { Controller, NotFoundException, Param, Query, UnprocessableEntityException } from '@nestjs/common';
import { Body, Post, Request } from '@nestjs/common';
import { register } from 'module';
import { RegistrationDto } from 'src/users/dtos/registration_dto';
import { AuthService } from './auth.service';
import { log } from 'console';
import { OtpService } from './otp/otp_service';
import { EmailApiService } from './email.service';

@Controller('auth')
export class AuthController {

    constructor(private authService: AuthService,private otpService:OtpService, private emailApi: EmailApiService) {}

    @Post('registerOtp')
    async registerOtp(@Request() req, @Query("email") email: string): Promise<any> {
        if (!email) {
            throw new Error('Email is required');
        }
        // const otp = this.otpService.generateRegOtpForEmail(email);
        
        // console.log(`Generated OTP for ${email}: ${otp}`);
        // await this.emailApi.sendOtpEmail(email, 'Registration OTP', otp);
        return { success: true, message: 'OTP generated and sent' };
    }

    @Post('register')
    async registerUser(@Request() req, @Body() registerationBody: RegistrationDto, @Query('otp') otp: string): Promise<any> {
        // Registration logic will be handled in UsersService
        if (!registerationBody.email || !registerationBody.password) {
            throw new Error('Email and password are required');
        }
        // const isOtpValid = this.otpService.validateRegOtpForEmail(registerationBody.email, otp);
        // if (!isOtpValid) {
        //     throw new NotFoundException('Invalid or expired OTP');
        // }
        return await this.authService.registerUser(registerationBody);
    }
    
    @Post('loginOtp')
    async loginOtp(@Request() req, @Body() loginBody): Promise<any> {
        if (!loginBody.email || !loginBody.password) {
            throw new Error('Email and password are required');
        }
        // const otp=this.otpService.generateSignOtpForEmail(loginBody.email);
        // console.log(`Generated OTP for ${loginBody.email}: ${otp}`);
        // await this.emailApi.sendOtpEmail(loginBody.email, 'Login OTP', otp);
        await this.authService.verifyUser(loginBody);
        return { success: true, message: 'OTP generated and sent' };
    }
    @Post('login')
    async loginUser(@Request() req, @Body() loginBody,@Query('otp') otp: string): Promise<any> {
        if (!loginBody.email || !loginBody.password) {
            throw new UnprocessableEntityException('Email and password are required');
        }
        // const isOtpValid=this.otpService.validateSignOtpForEmail(loginBody.email,otp);
        // if(!isOtpValid){
        //     throw new NotFoundException('Invalid or expired OTP');
        // }
        return await this.authService.signIn(loginBody);
    }
    @Post("googleLogin")
    async googleLogin(@Request() req, @Body() googleLoginBody): Promise<any> {
        return await this.authService.googleLogin(googleLoginBody);
    }

}
