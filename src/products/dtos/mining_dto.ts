import { MiningEntity } from "../entities/minings";
import { SubscriptionEntity } from "../entities/subscription_entities";

export class MiningDto {
    subscription: SubscriptionEntity;
    mining: MiningEntity
}