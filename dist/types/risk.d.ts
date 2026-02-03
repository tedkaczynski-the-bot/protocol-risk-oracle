export interface RiskCategory {
    name: string;
    score: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    findings: Finding[];
}
export interface Finding {
    title: string;
    description: string;
    attackVector?: string;
    mitigation?: string;
    confidence: number;
    gameTheory?: GameTheoryContext;
}
export interface GameTheoryContext {
    concept: string;
    strategy?: string;
    dominance?: string;
    payoffMatrix?: string;
    equilibria?: string[];
    vulnerability?: string;
    mechanism?: string;
    outcome?: string;
    attack?: string;
    cost?: string;
    violation?: string;
    fix?: string;
    leakage?: string;
    impact?: string;
    asymmetry?: string;
    centralisation?: string;
    amplifiers?: string[];
    examples?: string[];
}
export interface ProtocolRiskReport {
    protocol: string;
    address: string;
    timestamp: number;
    overallScore: number;
    overallSeverity: 'low' | 'medium' | 'high' | 'critical';
    categories: {
        economic: RiskCategory;
        governance: RiskCategory;
        liquidity: RiskCategory;
        composability: RiskCategory;
        mev: RiskCategory;
        gameTheory: RiskCategory;
    };
    summary: string;
    recommendations: string[];
    nashEquilibria?: string[];
    dominantStrategies?: string[];
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
    concentration?: number;
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
