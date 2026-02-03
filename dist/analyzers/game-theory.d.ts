import { RiskCategory, ProtocolData } from '../types/risk';
/**
 * Game-Theoretic Risk Analyzer
 *
 * Core mechanism design analysis based on:
 * - Nash Equilibrium identification (where rational actors stabilize)
 * - Dominant Strategy analysis (what rational actors WILL do)
 * - Mechanism vulnerability detection (where design breaks down)
 * - Schelling Point exploitation (coordination attack surfaces)
 * - Incentive Compatibility verification (IC constraints)
 *
 * Philosophy: Most DeFi exploits aren't bugs — they're rational actors
 * following incentives to unintended conclusions.
 */
export declare class GameTheoryAnalyzer {
    analyze(protocol: ProtocolData): RiskCategory;
    /**
     * Nash Equilibrium Analysis
     *
     * Identifies whether the protocol's intended state is a Nash equilibrium,
     * and whether there are alternative equilibria that harm the protocol.
     */
    private analyzeNashEquilibria;
    /**
     * Dominant Strategy Analysis
     *
     * Identifies when rational actors have a clear best strategy regardless
     * of what others do — and whether that strategy harms the protocol.
     */
    private analyzeDominantStrategies;
    /**
     * Coordination Game Analysis
     *
     * Identifies Schelling points and coordination attack surfaces.
     */
    private analyzeCoordinationGames;
    /**
     * Mechanism Design Flaw Detection
     *
     * Identifies violations of core mechanism design principles:
     * - Incentive Compatibility (IC)
     * - Individual Rationality (IR)
     * - Budget Balance
     */
    private analyzeMechanismDesign;
    /**
     * Multi-Agent Dynamics
     *
     * Analyzes emergent behavior from multiple rational agents interacting.
     */
    private analyzeMultiAgentDynamics;
    private findingSeverity;
    private scoreSeverity;
}
