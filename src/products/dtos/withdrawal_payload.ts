export class WithdrawalPayload {
    staking_id: string;
    withdrawal_amount_crypto?: string; // Optional, defaults to full staked amount if not provided
}

