"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComposabilityAnalyzer = void 0;
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
class ComposabilityAnalyzer {
    constructor() {
        // Known protocol categories and their typical dependencies
        this.protocolDependencies = {
            'lending': ['oracle', 'collateral-token', 'liquidation-bot'],
            'dex': ['oracle', 'liquidity-source', 'router'],
            'yield': ['underlying-protocol', 'oracle', 'reward-token'],
            'staking': ['validator-set', 'oracle', 'withdrawal-queue'],
            'bridge': ['source-chain', 'destination-chain', 'relayer', 'oracle'],
            'derivative': ['underlying-asset', 'oracle', 'margin-engine'],
        };
    }
    analyze(protocol) {
        const findings = [];
        // 1. Analyze dependency depth
        const depthFindings = this.analyzeDependencyDepth(protocol);
        findings.push(...depthFindings);
        // 2. Analyze oracle concentration
        const oracleFindings = this.analyzeOracleConcentration(protocol);
        findings.push(...oracleFindings);
        // 3. Analyze liquidity fragmentation
        const liquidityFindings = this.analyzeLiquidityFragmentation(protocol);
        findings.push(...liquidityFindings);
        // 4. Analyze collateral chain risk
        const collateralFindings = this.analyzeCollateralChain(protocol);
        findings.push(...collateralFindings);
        // 5. Analyze re-entrancy economics
        const reentrancyFindings = this.analyzeReentrancyEconomics(protocol);
        findings.push(...reentrancyFindings);
        // 6. Analyze bridge/cross-chain risk
        const bridgeFindings = this.analyzeBridgeRisk(protocol);
        findings.push(...bridgeFindings);
        const totalScore = findings.reduce((sum, f) => sum + (f.confidence * 10), 0);
        const avgScore = findings.length > 0 ? Math.min(10, totalScore / findings.length) : 0;
        return {
            name: 'Composability Risk',
            score: avgScore,
            severity: this.scoreSeverity(avgScore),
            findings
        };
    }
    /**
     * Analyze dependency depth - how many protocols deep is the dependency chain?
     */
    analyzeDependencyDepth(protocol) {
        const findings = [];
        // Detect if this looks like a yield aggregator or wrapper
        const isYieldAggregator = protocol.name.toLowerCase().includes('yield') ||
            protocol.name.toLowerCase().includes('vault') ||
            protocol.name.toLowerCase().includes('farm');
        const isLiquidStaking = protocol.name.toLowerCase().includes('staked') ||
            protocol.name.toLowerCase().includes('liquid') ||
            protocol.name.toLowerCase().includes('lst');
        const isDerivative = protocol.name.toLowerCase().includes('perp') ||
            protocol.name.toLowerCase().includes('option') ||
            protocol.name.toLowerCase().includes('synthetic');
        if (isYieldAggregator) {
            findings.push({
                title: 'Yield Aggregator Dependency Stack',
                description: 'Yield aggregators typically depend on 2-4 underlying protocols, creating cascading failure risk.',
                attackVector: 'DEPENDENCY CASCADE: If any underlying protocol is exploited, paused, or depegs, the aggregator inherits that risk. Users may not understand the full dependency tree.',
                mitigation: 'Document full dependency chain. Implement circuit breakers. Diversify across independent protocols. Monitor underlying protocol health.',
                confidence: 0.7,
                gameTheory: {
                    concept: 'Cascading Failure',
                    vulnerability: 'Single point of failure amplified through dependency chain',
                    mechanism: 'Failure propagates upward through composability stack'
                }
            });
        }
        if (isLiquidStaking) {
            findings.push({
                title: 'Liquid Staking Derivative Risk',
                description: 'LSTs depend on validator performance, withdrawal queues, and peg maintenance mechanisms.',
                attackVector: 'DEPEG SCENARIO: If validators are slashed, withdrawals delayed, or market loses confidence, LST can trade below underlying value. Arbitrageurs may not restore peg if withdrawal queue is too long.',
                mitigation: 'Monitor validator performance. Implement insurance mechanisms. Maintain liquid reserves for redemptions.',
                confidence: 0.65,
                gameTheory: {
                    concept: 'Peg Stability Game',
                    equilibria: ['Peg maintained (confidence)', 'Depeg spiral (panic)'],
                    vulnerability: 'Confidence-dependent stability'
                }
            });
        }
        if (isDerivative) {
            findings.push({
                title: 'Derivative Protocol Layered Risk',
                description: 'Derivatives inherit underlying asset risk plus additional mechanism complexity.',
                attackVector: 'ORACLE + MARGIN ATTACK: Manipulate underlying price briefly to trigger liquidations, then profit from forced selling. Complexity increases attack surface.',
                mitigation: 'Use manipulation-resistant oracles. Implement gradual liquidations. Add margin call delays.',
                confidence: 0.75,
                gameTheory: {
                    concept: 'Mechanism Complexity Risk',
                    vulnerability: 'More moving parts = more attack surface',
                    outcome: 'Sophisticated attackers exploit mechanism interactions'
                }
            });
        }
        return findings;
    }
    /**
     * Analyze oracle concentration risk
     */
    analyzeOracleConcentration(protocol) {
        const findings = [];
        // If protocol has significant TVL, it likely depends on oracles
        if (protocol.tvl && protocol.tvl > 10000000) {
            findings.push({
                title: 'Oracle Dependency Analysis Required',
                description: `Protocol with $${(protocol.tvl / 1e6).toFixed(0)}M TVL likely depends on price oracles for critical operations.`,
                attackVector: 'ORACLE MANIPULATION: If protocol uses single oracle or low-liquidity price sources, attackers can manipulate prices to trigger liquidations or favorable trades.',
                mitigation: 'Use multiple independent oracles. Implement TWAP. Add circuit breakers for extreme price moves. Verify oracle source liquidity.',
                confidence: 0.6,
                gameTheory: {
                    concept: 'Single Point of Failure',
                    attack: 'Oracle manipulation for downstream exploitation',
                    cost: 'Cost of moving oracle price temporarily'
                }
            });
        }
        return findings;
    }
    /**
     * Analyze liquidity fragmentation across venues
     */
    analyzeLiquidityFragmentation(protocol) {
        const findings = [];
        if (protocol.pools && protocol.pools.length > 3) {
            const totalLiquidity = protocol.pools.reduce((sum, p) => sum + p.liquidity, 0);
            const avgLiquidity = totalLiquidity / protocol.pools.length;
            // Check if liquidity is fragmented across many small pools
            const smallPools = protocol.pools.filter(p => p.liquidity < avgLiquidity * 0.5);
            if (smallPools.length > protocol.pools.length * 0.5) {
                findings.push({
                    title: 'Liquidity Fragmentation Risk',
                    description: `Liquidity is fragmented across ${protocol.pools.length} pools, with ${smallPools.length} pools below average size.`,
                    attackVector: 'FRAGMENTATION EXPLOIT: Fragmented liquidity means (1) worse execution for traders, (2) easier price manipulation per-venue, (3) arbitrageurs extract value moving between venues.',
                    mitigation: 'Consolidate liquidity to fewer venues. Use aggregators for routing. Incentivize primary liquidity venue.',
                    confidence: 0.6,
                    gameTheory: {
                        concept: 'Coordination Failure',
                        outcome: 'Suboptimal equilibrium where liquidity is dispersed',
                        vulnerability: 'Each venue is independently manipulable'
                    }
                });
            }
        }
        return findings;
    }
    /**
     * Analyze collateral chain risk (recursive borrowing, rehypothecation)
     */
    analyzeCollateralChain(protocol) {
        const findings = [];
        // Detect lending protocol patterns
        const isLending = protocol.name.toLowerCase().includes('lend') ||
            protocol.name.toLowerCase().includes('borrow') ||
            protocol.name.toLowerCase().includes('aave') ||
            protocol.name.toLowerCase().includes('compound') ||
            protocol.name.toLowerCase().includes('margin');
        if (isLending && protocol.tvl && protocol.tvl > 50000000) {
            findings.push({
                title: 'Collateral Chain / Rehypothecation Risk',
                description: 'Lending protocols enable recursive borrowing: deposit A, borrow B, deposit B elsewhere, borrow more. Creates hidden leverage.',
                attackVector: 'LEVERAGE CASCADE: In a downturn, recursive positions unwind simultaneously. Each liquidation triggers more liquidations. Actual leverage in system may be 3-10x what individual positions show.',
                mitigation: 'Track cross-protocol positions. Implement global exposure limits. Monitor system-wide leverage metrics. Add liquidation delays during high-stress periods.',
                confidence: 0.7,
                gameTheory: {
                    concept: 'Hidden Leverage / Systemic Risk',
                    mechanism: 'Recursive borrowing creates correlated positions',
                    vulnerability: 'Cascade liquidations amplify price moves',
                    equilibria: ['Stable leverage (calm markets)', 'Deleveraging spiral (stress)']
                }
            });
        }
        return findings;
    }
    /**
     * Analyze re-entrancy economics
     */
    analyzeReentrancyEconomics(protocol) {
        const findings = [];
        // If protocol interacts with multiple external contracts
        if (protocol.pools && protocol.pools.length > 0) {
            findings.push({
                title: 'Cross-Contract Interaction Risk',
                description: 'Protocol integrates with external contracts (DEXes, oracles, tokens), creating re-entrancy and callback attack surfaces.',
                attackVector: 'ECONOMIC RE-ENTRANCY: Even without code bugs, economic re-entrancy is possible. Example: Flash loan → manipulate pool → trigger protocol action → profit from manipulated state → repay loan.',
                mitigation: 'Implement checks-effects-interactions pattern. Use reentrancy guards. Verify state consistency after external calls. Consider flash loan protection.',
                confidence: 0.55,
                gameTheory: {
                    concept: 'Atomicity Exploitation',
                    attack: 'Use single transaction to create temporary invalid states',
                    cost: 'Flash loan fees only',
                    outcome: 'Extract value from state inconsistencies'
                }
            });
        }
        return findings;
    }
    /**
     * Analyze bridge and cross-chain risks
     */
    analyzeBridgeRisk(protocol) {
        const findings = [];
        const isBridge = protocol.name.toLowerCase().includes('bridge') ||
            protocol.name.toLowerCase().includes('wormhole') ||
            protocol.name.toLowerCase().includes('layerzero') ||
            protocol.name.toLowerCase().includes('cross');
        const usesWrappedAssets = protocol.pools?.some(p => p.token0.toLowerCase().includes('w') ||
            p.token1.toLowerCase().includes('w') ||
            p.token0.toLowerCase().includes('bridge') ||
            p.token1.toLowerCase().includes('bridge'));
        if (isBridge) {
            findings.push({
                title: 'Bridge Protocol - Maximum Composability Risk',
                description: 'Bridges are the highest-risk composability component. They depend on multiple chains, validators/relayers, and have been the target of largest DeFi exploits.',
                attackVector: 'BRIDGE EXPLOITS: Fake deposit proofs, validator collusion, message replay, incomplete finality checks. Bridges hold locked assets that can be drained with a single exploit.',
                mitigation: 'Use battle-tested bridges only. Limit exposure to bridged assets. Verify bridge security model (optimistic vs ZK vs validator set). Monitor bridge TVL and activity anomalies.',
                confidence: 0.85,
                gameTheory: {
                    concept: 'Trust Minimization Failure',
                    vulnerability: 'Bridges introduce trusted components into trustless systems',
                    impact: 'Total loss of bridged assets possible',
                    examples: ['Ronin: $625M', 'Wormhole: $320M', 'Nomad: $190M']
                }
            });
        }
        if (usesWrappedAssets) {
            findings.push({
                title: 'Wrapped Asset Dependency',
                description: 'Protocol uses wrapped/bridged assets that depend on external bridge security.',
                attackVector: 'WRAPPED ASSET DEPEG: If the bridge backing wrapped assets is exploited, wrapped tokens become worthless while appearing to have value. Protocol may hold unbacked IOUs.',
                mitigation: 'Verify bridge backing. Monitor bridge health. Consider native assets where possible. Implement wrapped asset exposure limits.',
                confidence: 0.6,
                gameTheory: {
                    concept: 'Counterparty Risk',
                    vulnerability: 'Wrapped asset value depends on bridge solvency',
                    outcome: 'Depeg if bridge is exploited or insolvent'
                }
            });
        }
        return findings;
    }
    scoreSeverity(score) {
        if (score >= 8)
            return 'critical';
        if (score >= 6)
            return 'high';
        if (score >= 3)
            return 'medium';
        return 'low';
    }
}
exports.ComposabilityAnalyzer = ComposabilityAnalyzer;
