import { RiskCategory, ProtocolData } from '../types/risk';
/**
 * Governance Risk Analyzer
 *
 * Identifies governance attack vectors:
 * - Vote buying and bribery economics
 * - Quorum manipulation
 * - Timelock bypass scenarios
 * - Proposal spam attacks
 * - Voter apathy exploitation
 */
export declare class GovernanceAnalyzer {
    analyze(protocol: ProtocolData): RiskCategory;
    private scoreSeverity;
}
