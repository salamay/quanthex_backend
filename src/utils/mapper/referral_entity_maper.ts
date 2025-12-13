import { ReferralEntity } from "src/users/entities/referral_entity"

export class ReferralEntityMapper {


    static toEntity(data: any): ReferralEntity {
        const referral = new ReferralEntity();

        referral.id = data.id;
        referral.referral_uid = data.referral_uid;
        referral.referree_uid = data.referree_uid;
        referral.referral_created_at = data.referral_created_at;
        referral.referral_updated_at = data.referral_updated_at;
        return referral;
    }

}