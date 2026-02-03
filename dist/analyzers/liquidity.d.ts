import { RiskCategory, ProtocolData } from '../types/risk';
/**
 * Liquidity Risk Analyzer
 *
 * Identifies liquidity-related vulnerabilities:
 * - Bank run dynamics
 * - Impermanent loss exposure
 * - Liquidity concentration
 * - Withdrawal queue risks
 * - De-peg scenarios
 */
export declare class LiquidityAnalyzer {
    analyze(protocol: ProtocolData): RiskCategory;
    private analyzePoolLiquidity;
    private analyzeImpermanentLoss;
    private scoreSeverity;
}
