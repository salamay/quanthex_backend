export class ProductUtils {

    static LEVEL_ONE_HASHRATE = 187898.987 // Example hashrate values
    static LEVEL_TWO_HASHRATE=375797.974
    static LEVEL_THREE_HASHRATE=563696.961
    static LEVEL_FOUR_HASHRATE=751595.948
    static LEVEL_FIVE_HASHRATE=939494.935
    static LEVEL_SIX_HASHRATE=1127393.923

    static getHashRate(noOfReferrals:number):number{
        return noOfReferrals * this.LEVEL_ONE_HASHRATE
    }
}