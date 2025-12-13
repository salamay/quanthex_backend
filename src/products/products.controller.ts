import { Body, Controller, Get, Post, Request, UnauthorizedException } from '@nestjs/common';
import { ProductsService } from './products.service';

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
}
