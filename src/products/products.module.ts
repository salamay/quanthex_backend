import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionEntity } from './entities/subscription_entities';
import { ProductsController } from './products.controller';
import { ProductsManager } from './products_manager';
import { StakingEntity } from './entities/staking_entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SubscriptionEntity, StakingEntity]),
  ],
  providers: [ProductsService, ProductsManager],
  controllers: [ProductsController]
})
export class ProductsModule {}
