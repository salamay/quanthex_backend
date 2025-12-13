import { InjectRepository} from "@nestjs/typeorm";
import { SubscriptionEntity } from "./entities/subscription_entities";
import { Repository } from "typeorm";
import { Injectable } from "@nestjs/common";
import { StakingEntity } from "./entities/staking_entity";

@Injectable()
export class ProductsManager {

    constructor(@InjectRepository(SubscriptionEntity) public subscriptionRepo: Repository<SubscriptionEntity>,
    @InjectRepository(StakingEntity) public stakingRepo: Repository<StakingEntity>
) {

    }
}