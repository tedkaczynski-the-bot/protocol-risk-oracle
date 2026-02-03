"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.helius = exports.HeliusProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const HELIUS_API_KEY = process.env.HELIUS_API_KEY || '';
const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
/**
 * Helius Data Provider
 * Fetches real Solana blockchain data for risk analysis
 */
class HeliusProvider {
    constructor(apiKey) {
        this.apiKey = apiKey || HELIUS_API_KEY;
        this.rpcUrl = `https://mainnet.helius-rpc.com/?api-key=${this.apiKey}`;
    }
    async getTokenInfo(mintAddress) {
        if (!this.apiKey) {
            console.warn('No Helius API key configured');
            return null;
        }
        try {
            // Get token metadata via DAS API
            const response = await axios_1.default.post(this.rpcUrl, {
                jsonrpc: '2.0',
                id: 'token-info',
                method: 'getAsset',
                params: { id: mintAddress }
            });
            const asset = response.data.result;
            if (!asset)
                return null;
            return {
                address: mintAddress,
                symbol: asset.content?.metadata?.symbol || 'UNKNOWN',
                name: asset.content?.metadata?.name || 'Unknown Token',
                decimals: asset.token_info?.decimals || 9,
                supply: asset.token_info?.supply || 0,
                holders: asset.ownership?.total || undefined
            };
        }
        catch (error) {
            console.error('Error fetching token info:', error);
            return null;
        }
    }
    async getTopTokenHolders(mintAddress, limit = 10) {
        if (!this.apiKey)
            return [];
        try {
            // Use Helius' token holders endpoint
            const response = await axios_1.default.get(`https://api.helius.xyz/v0/token/${mintAddress}/holders?api-key=${this.apiKey}&limit=${limit}`);
            const totalSupply = response.data.totalSupply || 1;
            return (response.data.holders || []).map((h) => ({
                address: h.owner,
                balance: h.balance,
                percentage: (h.balance / totalSupply) * 100
            }));
        }
        catch (error) {
            console.error('Error fetching token holders:', error);
            return [];
        }
    }
    async getAccountInfo(address) {
        try {
            const response = await axios_1.default.post(this.rpcUrl, {
                jsonrpc: '2.0',
                id: 'account-info',
                method: 'getAccountInfo',
                params: [address, { encoding: 'jsonParsed' }]
            });
            const info = response.data.result?.value;
            if (!info)
                return null;
            return {
                address,
                lamports: info.lamports,
                owner: info.owner,
                data: info.data
            };
        }
        catch (error) {
            console.error('Error fetching account info:', error);
            return null;
        }
    }
    async getTransactionHistory(address, limit = 100) {
        if (!this.apiKey)
            return [];
        try {
            const response = await axios_1.default.get(`https://api.helius.xyz/v0/addresses/${address}/transactions?api-key=${this.apiKey}&limit=${limit}`);
            return response.data || [];
        }
        catch (error) {
            console.error('Error fetching transaction history:', error);
            return [];
        }
    }
    /**
     * Calculate Gini coefficient for token distribution
     * Returns value between 0 (perfect equality) and 1 (perfect inequality)
     */
    calculateGiniCoefficient(holders) {
        if (holders.length === 0)
            return 0;
        const balances = holders.map(h => h.balance).sort((a, b) => a - b);
        const n = balances.length;
        const totalBalance = balances.reduce((sum, b) => sum + b, 0);
        if (totalBalance === 0)
            return 0;
        let cumulativeSum = 0;
        let giniSum = 0;
        for (let i = 0; i < n; i++) {
            cumulativeSum += balances[i];
            giniSum += (2 * (i + 1) - n - 1) * balances[i];
        }
        return giniSum / (n * totalBalance);
    }
}
exports.HeliusProvider = HeliusProvider;
exports.helius = new HeliusProvider();
