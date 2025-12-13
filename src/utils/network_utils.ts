export class NetworkUtils {
    public static rpcs: {[chainId: number]: string}={
        137:"https://go.getblock.us/6fca04d1f8204303bda2c7c8072cbd4a"
    }

    public static getRpc(chainId: number): string {
        return NetworkUtils.rpcs[chainId];
    }
}