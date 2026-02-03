export interface RiskCategory {
  name: string;
  score: number; // 0-10, higher = more risk
  severity: 'low' | 'medium' | 'high' | 'critical';
  findings: Finding[];
}

export interface Finding {
  title: string;
  description: string;
  attackVector?: string;
  mitigation?: string;
  confidence: number; // 0-1
}

export interface ProtocolRiskReport {
  protocol: string;
  address: string;
  timestamp: number;
  overallScore: number; // 0-10
  overallSeverity: 'low' | 'medium' | 'high' | 'critical';
  categories: {
    economic: RiskCategory;
    governance: RiskCategory;
    liquidity: RiskCategory;
    composability: RiskCategory;
    mev: RiskCategory;
  };
  summary: string;
  recommendations: string[];
}

export interface ProtocolData {
  address: string;
  name: string;
  tvl?: number;
  tokenomics?: TokenomicsData;
  governance?: GovernanceData;
  pools?: PoolData[];
}

export interface TokenomicsData {
  totalSupply: number;
  circulatingSupply: number;
  emissionRate?: number;
  vestingSchedule?: VestingEvent[];
  concentration?: number; // Gini coefficient
}

export interface GovernanceData {
  quorum: number;
  votingPeriod: number;
  timelockDelay: number;
  proposalThreshold: number;
  topHolderVotingPower: number;
}

export interface PoolData {
  address: string;
  token0: string;
  token1: string;
  liquidity: number;
  volume24h: number;
  fees: number;
}

export interface VestingEvent {
  timestamp: number;
  amount: number;
  recipient: string;
}
