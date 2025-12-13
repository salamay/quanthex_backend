import { Controller } from '@nestjs/common';
import { Body, Post, Request } from '@nestjs/common';
import { register } from 'module';
import { RegistrationDto } from 'src/users/dtos/registration_dto';
import { AuthService } from './auth.service';
import { log } from 'console';

@Controller('auth')
export class AuthController {

    constructor(private authService: AuthService) {


    }
    @Post('register')
    async registerUser(@Request() req, @Body() registerationBody: RegistrationDto): Promise<any> {
        // Registration logic will be handled in UsersService
        if (!registerationBody.email || !registerationBody.password) {
            throw new Error('Email and password are required');
        }
        return await this.authService.registerUser(registerationBody);
    }
    @Post('login')
    async loginUser(@Request() req, @Body() loginBody): Promise<any> {
        if (!loginBody.email || !loginBody.password) {
            throw new Error('Email and password are required');
        }
        return await this.authService.signIn(loginBody);
    }

}
