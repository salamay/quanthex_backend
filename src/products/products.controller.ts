import { Body, Controller, Get, Post, Query, Request, UnauthorizedException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { WithdrawalPayload } from './dtos/withdrawal_payload';

@Controller('products')
export class ProductsController {

    constructor(private productsService: ProductsService){

    }

    @Post('subscribe')
    async subscribeToProduct(@Request() req,@Body() payload):Promise<any>{
        // Implementation goes here
        const { uid, email} = req.user;
            if (!uid) {
              throw new UnauthorizedException('Missing user id on request');
            }
        return await this.productsService.subscribeToProduct(uid, email, payload);
    }

    @Post('stake')
    async stakeProduct(@Request() req,@Body() payload):Promise<any>{
        const { uid, email} = req.user;
            if (!uid) {
              throw new UnauthorizedException('Missing user id on request');
            }
        return await this.productsService.createStakingRecord(uid, email, payload);
    }

    @Get('minings')
    async getUserMinings(@Request() req):Promise<any>{
        const { uid, email} = req.user;
            if (!uid) {
              throw new UnauthorizedException('Missing user id on request');
            }
        return await this.productsService.getMiningRecords(uid);
    }
    
    @Get('stakings')
    async getUserStakings(@Request() req):Promise<any>{
        const { uid, email} = req.user;
            if (!uid) {
              throw new UnauthorizedException('Missing user id on request');
            }
        return await this.productsService.getStakingRecords(uid);
    }

    @Post('withdraw')
    async createWithdrawal(@Request() req, @Body() payload: WithdrawalPayload):Promise<any>{
        const { uid, email} = req.user;
            if (!uid) {
              throw new UnauthorizedException('Missing user id on request');
            }
        return await this.productsService.createWithdrawalRequest(uid, email, payload);
    }

    @Get('withdrawals')
    async getUserWithdrawals(@Request() req):Promise<any>{
        const { uid, email} = req.user;
            if (!uid) {
              throw new UnauthorizedException('Missing user id on request');
            }
        return await this.productsService.getWithdrawalRecords(uid);
    }

    @Get("subscription-direct-referrals")
    async getSubscriptionReferrals(@Request() req, @Query('subscriptionId') subscriptionId: string): Promise<any> {
        const uid = req.user?.uid;
        console.log('Fetching referrals for user:', uid);
        if (!uid) {
            throw new UnauthorizedException('Missing user id on request');
        }
        return await this.productsService.getSubscriptionReferrals(uid, subscriptionId);
    }

    @Get("subscription-indirect-referrals")
    async getIndirectReferrals(@Request() req, @Query('subscriptionId') subscriptionId: string): Promise<any> {
        const uid = req.user?.uid;
        console.log('Fetching indirect referrals for user:', uid);
        if (!uid) {
            throw new UnauthorizedException('Missing user id on request');
        }
        return await this.productsService.getIndirectReferrals(uid, subscriptionId);
    }
}
