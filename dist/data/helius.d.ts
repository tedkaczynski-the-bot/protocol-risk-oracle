export interface TokenInfo {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    supply: number;
    holders?: number;
    topHolders?: {
        address: string;
        balance: number;
        percentage: number;
    }[];
}
export interface AccountInfo {
    address: string;
    lamports: number;
    owner: string;
    data: any;
}
/**
 * Helius Data Provider
 * Fetches real Solana blockchain data for risk analysis
 */
export declare class HeliusProvider {
    private apiKey;
    private rpcUrl;
    constructor(apiKey?: string);
    getTokenInfo(mintAddress: string): Promise<TokenInfo | null>;
    getTopTokenHolders(mintAddress: string, limit?: number): Promise<{
        address: string;
        balance: number;
        percentage: number;
    }[]>;
    getAccountInfo(address: string): Promise<AccountInfo | null>;
    getTransactionHistory(address: string, limit?: number): Promise<any[]>;
    /**
     * Calculate Gini coefficient for token distribution
     * Returns value between 0 (perfect equality) and 1 (perfect inequality)
     */
    calculateGiniCoefficient(holders: {
        balance: number;
    }[]): number;
}
export declare const helius: HeliusProvider;
