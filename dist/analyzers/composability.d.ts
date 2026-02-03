import { RiskCategory, ProtocolData } from '../types/risk';
/**
 * Composability Risk Analyzer
 *
 * Analyzes cross-protocol dependencies and integration risks:
 * - Dependency chain vulnerabilities (if protocol A fails, what happens to B?)
 * - Re-entrancy economics (cross-contract call exploitation)
 * - Oracle dependency concentration
 * - Liquidity fragmentation across venues
 * - Collateral chain risks (recursive borrowing)
 * - Bridge dependencies
 */
export declare class ComposabilityAnalyzer {
    private readonly protocolDependencies;
    analyze(protocol: ProtocolData): RiskCategory;
    /**
     * Analyze dependency depth - how many protocols deep is the dependency chain?
     */
    private analyzeDependencyDepth;
    /**
     * Analyze oracle concentration risk
     */
    private analyzeOracleConcentration;
    /**
     * Analyze liquidity fragmentation across venues
     */
    private analyzeLiquidityFragmentation;
    /**
     * Analyze collateral chain risk (recursive borrowing, rehypothecation)
     */
    private analyzeCollateralChain;
    /**
     * Analyze re-entrancy economics
     */
    private analyzeReentrancyEconomics;
    /**
     * Analyze bridge and cross-chain risks
     */
    private analyzeBridgeRisk;
    private scoreSeverity;
}
