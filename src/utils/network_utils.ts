export class NetworkUtils {
    public static rpcs: {[chainId: number]: string}={
        1:"https://go.getblock.io/8e30f8a3d9314d4785167d79abdf164c",
        56:"https://go.getblock.io/119fad79ee5d4ffda4c3de8fdc77618e",
        137:"https://go.getblock.io/5fa1b57ec3724b18944c5c10006d95ef"
    }

    public static getRpc(chainId: number): string {
        return NetworkUtils.rpcs[chainId];
    }
}