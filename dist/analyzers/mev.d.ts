import { RiskCategory, ProtocolData } from '../types/risk';
/**
 * MEV Risk Analyzer
 *
 * Identifies Maximum Extractable Value vulnerabilities:
 * - Sandwich attack surfaces
 * - Front-running opportunities
 * - Back-running scenarios
 * - JIT liquidity attacks
 * - Oracle front-running
 */
export declare class MEVAnalyzer {
    analyze(protocol: ProtocolData): RiskCategory;
    private analyzePool;
    private analyzeOracleMEV;
    private scoreSeverity;
}
