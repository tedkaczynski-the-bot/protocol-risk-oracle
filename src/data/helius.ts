import axios from 'axios';

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || '';
const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  supply: number;
  holders?: number;
  topHolders?: { address: string; balance: number; percentage: number }[];
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
export class HeliusProvider {
  private apiKey: string;
  private rpcUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || HELIUS_API_KEY;
    this.rpcUrl = `https://mainnet.helius-rpc.com/?api-key=${this.apiKey}`;
  }

  async getTokenInfo(mintAddress: string): Promise<TokenInfo | null> {
    if (!this.apiKey) {
      console.warn('No Helius API key configured');
      return null;
    }

    try {
      // Get token metadata via DAS API
      const response = await axios.post(
        this.rpcUrl,
        {
          jsonrpc: '2.0',
          id: 'token-info',
          method: 'getAsset',
          params: { id: mintAddress }
        }
      );

      const asset = response.data.result;
      if (!asset) return null;

      return {
        address: mintAddress,
        symbol: asset.content?.metadata?.symbol || 'UNKNOWN',
        name: asset.content?.metadata?.name || 'Unknown Token',
        decimals: asset.token_info?.decimals || 9,
        supply: asset.token_info?.supply || 0,
        holders: asset.ownership?.total || undefined
      };
    } catch (error) {
      console.error('Error fetching token info:', error);
      return null;
    }
  }

  async getTopTokenHolders(mintAddress: string, limit: number = 10): Promise<{ address: string; balance: number; percentage: number }[]> {
    if (!this.apiKey) return [];

    try {
      // Use Helius' token holders endpoint
      const response = await axios.get(
        `https://api.helius.xyz/v0/token/${mintAddress}/holders?api-key=${this.apiKey}&limit=${limit}`
      );

      const totalSupply = response.data.totalSupply || 1;
      return (response.data.holders || []).map((h: any) => ({
        address: h.owner,
        balance: h.balance,
        percentage: (h.balance / totalSupply) * 100
      }));
    } catch (error) {
      console.error('Error fetching token holders:', error);
      return [];
    }
  }

  async getAccountInfo(address: string): Promise<AccountInfo | null> {
    try {
      const response = await axios.post(this.rpcUrl, {
        jsonrpc: '2.0',
        id: 'account-info',
        method: 'getAccountInfo',
        params: [address, { encoding: 'jsonParsed' }]
      });

      const info = response.data.result?.value;
      if (!info) return null;

      return {
        address,
        lamports: info.lamports,
        owner: info.owner,
        data: info.data
      };
    } catch (error) {
      console.error('Error fetching account info:', error);
      return null;
    }
  }

  async getTransactionHistory(address: string, limit: number = 100): Promise<any[]> {
    if (!this.apiKey) return [];

    try {
      const response = await axios.get(
        `https://api.helius.xyz/v0/addresses/${address}/transactions?api-key=${this.apiKey}&limit=${limit}`
      );
      return response.data || [];
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
  }

  /**
   * Calculate Gini coefficient for token distribution
   * Returns value between 0 (perfect equality) and 1 (perfect inequality)
   */
  calculateGiniCoefficient(holders: { balance: number }[]): number {
    if (holders.length === 0) return 0;
    
    const balances = holders.map(h => h.balance).sort((a, b) => a - b);
    const n = balances.length;
    const totalBalance = balances.reduce((sum, b) => sum + b, 0);
    
    if (totalBalance === 0) return 0;

    let cumulativeSum = 0;
    let giniSum = 0;
    
    for (let i = 0; i < n; i++) {
      cumulativeSum += balances[i];
      giniSum += (2 * (i + 1) - n - 1) * balances[i];
    }

    return giniSum / (n * totalBalance);
  }
}

export const helius = new HeliusProvider();
