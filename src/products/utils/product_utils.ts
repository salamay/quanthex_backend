import { ADVANCE, GROWTH, MEGA, PRO, STARTER } from "src/utils/product_constants"

export class ProductUtils {

    static LEVEL_ZERO_HASHRATE = 93949.4935
    static LEVEL_ONE_HASHRATE = 187898.987 // Example hashrate values
    static LEVEL_TWO_HASHRATE=375797.974
    static LEVEL_THREE_HASHRATE=563696.961
    static LEVEL_FOUR_HASHRATE=751595.948

    static starterFactor = 1.00
    static growthFactor = 2.00
    static advanceFactor = 3.00
    static proFactor = 4.00
    static megaFactor = 5.00
    
    // static LEVEL_FIVE_HASHRATE=939494.935
    // static LEVEL_SIX_HASHRATE=1127393.923

    static getHashRate(noOfReferrals:number,packageName:string):number{
        let factor = 1.0;
        if (packageName == STARTER){
            factor = this.starterFactor;
        }else if(packageName == GROWTH){
            factor = this.growthFactor;
        }else if(packageName == ADVANCE){
            factor = this.advanceFactor;
        }else if(packageName == PRO){
            factor = this.proFactor;
        }else if(packageName == MEGA){
            factor = this.megaFactor;
        }
        if(noOfReferrals==0){
            return this.LEVEL_ZERO_HASHRATE * factor;
        }else if(noOfReferrals>1 && noOfReferrals<6){
            return this.LEVEL_ONE_HASHRATE * factor;
        }else if(noOfReferrals>6 && noOfReferrals<36){
            return this.LEVEL_TWO_HASHRATE * factor;
        } else if(noOfReferrals>=36 && noOfReferrals<216){
            return this.LEVEL_THREE_HASHRATE * factor;
        }
        else if(noOfReferrals>=216 && noOfReferrals<324){
            return this.LEVEL_FOUR_HASHRATE * factor;
        }else{
            return this.LEVEL_ONE_HASHRATE * factor;
        }
    }
}