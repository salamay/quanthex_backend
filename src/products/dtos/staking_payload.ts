export class StakingPayload {
        id: string;
        
        uid: string
        
        email: string
        
        stake_created_at: BigInt
        
        stake_updated_at: BigInt
        
        staked_asset_symbol: string
        
        staked_asset_contract: string
        
        stacked_asset_decimals: number
        
        staked_asset_name: string
        
        staked_asset_image: string
        
        staked_amount_fiat: string
        
        staked_amount_crypto: string
        
        staking_status: string
           
        staking_reward_contract: string
        
        staking_reward_chain_id: number
        
        staking_reward_chain_name: string
        
        staking_reward_asset_name: string
        
        staking_reward_asset_symbol: string
        
        staking_reward_asset_decimals: number
        
        staking_reward_asset_image: string
        signed_tx: string
        rpc: string
        duration: number
        end_date: number
        start_date: number
        staking_wallet_hash: string
        staking_wallet_address: string
      
}