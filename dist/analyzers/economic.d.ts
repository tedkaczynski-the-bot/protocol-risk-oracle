import { RiskCategory, ProtocolData } from '../types/risk';
/**
 * Economic Risk Analyzer
 *
 * Applies game-theoretic analysis to identify economic attack vectors:
 * - Nash equilibrium violations (where rational actors can profit by deviating)
 * - Incentive misalignments (where protocol goals conflict with user incentives)
 * - Value extraction opportunities (MEV, front-running, sandwich attacks)
 */
export declare class EconomicAnalyzer {
    analyze(protocol: ProtocolData): RiskCategory;
    private analyzeTokenomics;
    private analyzeFlashLoanRisk;
    private analyzeOracleRisk;
    private analyzeIncentiveAlignment;
    private scoreSeverity;
}
