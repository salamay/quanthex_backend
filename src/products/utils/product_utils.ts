export class ProductUtils {

    static LEVEL_ZERO_HASHRATE = 0
    static LEVEL_ONE_HASHRATE = 187898.987 // Example hashrate values
    static LEVEL_TWO_HASHRATE=375797.974
    static LEVEL_THREE_HASHRATE=563696.961
    static LEVEL_FOUR_HASHRATE=751595.948
    // static LEVEL_FIVE_HASHRATE=939494.935
    // static LEVEL_SIX_HASHRATE=1127393.923

    static getHashRate(noOfReferrals:number):number{
        if(noOfReferrals==0){
            return this.LEVEL_ZERO_HASHRATE;
        }else if(noOfReferrals>1 && noOfReferrals<6){
            return this.LEVEL_ONE_HASHRATE;
        }else if(noOfReferrals>6 && noOfReferrals<36){
            return this.LEVEL_TWO_HASHRATE;
        } else if(noOfReferrals>=36 && noOfReferrals<216){
            return this.LEVEL_THREE_HASHRATE;
        }
        else if(noOfReferrals>=216 && noOfReferrals<324){
            return this.LEVEL_FOUR_HASHRATE;
        }else{
            return this.LEVEL_ONE_HASHRATE
        }
    }
}