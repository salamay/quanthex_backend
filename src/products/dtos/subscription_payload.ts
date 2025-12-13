export class SubscriptionPayload {
    id: string
    uid: string
    email: string
    sub_type: string
    sub_chain_id: number
    sub_asset_contract: string
    sub_asset_symbol: string
    sub_asset_name: string
    sub_asset_decimals: number
    sub_asset_image: string
    sub_created_at: number
    sub_updated_at: number
    sub_status: string
    sub_reward_contract: string
    sub_reward_chain_id: number
    sub_reward_asset_name: string
    sub_reward_asset_symbol: string
    sub_reward_asset_image: string
    sub_reward_asset_decimals: number
    sub_package_name: string
    sub_duration: number
    sub_signed_tx: string
}