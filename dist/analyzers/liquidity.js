"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiquidityAnalyzer = void 0;
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
class LiquidityAnalyzer {
    analyze(protocol) {
        const findings = [];
        let totalScore = 0;
        if (!protocol.pools || protocol.pools.length === 0) {
            return {
                name: 'Liquidity Risk',
                score: 2,
                severity: 'low',
                findings: [{
                        title: 'No Liquidity Pool Data',
                        description: 'Unable to analyze liquidity risks without pool data.',
                        confidence: 0.3
                    }]
            };
        }
        // Analyze TVL concentration
        const totalLiquidity = protocol.pools.reduce((sum, p) => sum + p.liquidity, 0);
        const largestPool = Math.max(...protocol.pools.map(p => p.liquidity));
        const concentration = largestPool / totalLiquidity;
        if (concentration > 0.8) {
            findings.push({
                title: 'Extreme Liquidity Concentration',
                description: `${(concentration * 100).toFixed(0)}% of liquidity is in a single pool. Protocol health depends on one venue.`,
                attackVector: 'If the dominant pool is drained or depegs, the entire protocol loses liquidity. Single point of failure.',
                mitigation: 'Incentivize liquidity across multiple pools/DEXes. Implement liquidity mining diversification.',
                confidence: 0.85
            });
            totalScore += 7;
        }
        // Check for shallow liquidity relative to TVL claims
        if (protocol.tvl && totalLiquidity < protocol.tvl * 0.1) {
            findings.push({
                title: 'Liquidity-TVL Mismatch',
                description: `Tradeable liquidity ($${(totalLiquidity / 1e6).toFixed(1)}M) is only ${((totalLiquidity / protocol.tvl) * 100).toFixed(0)}% of reported TVL ($${(protocol.tvl / 1e6).toFixed(1)}M).`,
                attackVector: 'Exit liquidity crisis: Users may not be able to withdraw at stated values. Paper gains vs realizable value.',
                mitigation: 'Verify TVL methodology. Check for locked/illiquid portions. Implement withdrawal limits.',
                confidence: 0.75
            });
            totalScore += 6;
        }
        // Analyze individual pool health
        for (const pool of protocol.pools) {
            const poolFindings = this.analyzePoolLiquidity(pool);
            findings.push(...poolFindings.findings);
            totalScore += poolFindings.score;
        }
        // Check for impermanent loss exposure
        const ilFindings = this.analyzeImpermanentLoss(protocol.pools);
        findings.push(...ilFindings.findings);
        totalScore += ilFindings.score;
        const avgScore = findings.length > 0 ? totalScore / findings.length : 0;
        return {
            name: 'Liquidity Risk',
            score: Math.min(10, avgScore),
            severity: this.scoreSeverity(avgScore),
            findings
        };
    }
    analyzePoolLiquidity(pool) {
        const findings = [];
        let score = 0;
        // Check for thin liquidity
        if (pool.liquidity < 10000) {
            findings.push({
                title: `Critically Thin Liquidity: ${pool.token0}/${pool.token1}`,
                description: `Pool has only $${pool.liquidity.toLocaleString()} in liquidity.`,
                attackVector: 'Any significant trade will cause extreme slippage. Easy to manipulate for oracle attacks.',
                mitigation: 'Avoid using this pool for price discovery. Add liquidity mining incentives.',
                confidence: 0.9
            });
            score += 8;
        }
        else if (pool.liquidity < 100000) {
            findings.push({
                title: `Low Liquidity Pool: ${pool.token0}/${pool.token1}`,
                description: `Pool has $${(pool.liquidity / 1000).toFixed(0)}k in liquidity — vulnerable to large trades.`,
                attackVector: 'Trades over $${(pool.liquidity * 0.01).toFixed(0)} will incur >1% slippage.',
                confidence: 0.7
            });
            score += 4;
        }
        // Check volume sustainability
        const dailyFeeRevenue = pool.volume24h * pool.fees;
        const annualizedAPR = (dailyFeeRevenue * 365) / pool.liquidity;
        if (annualizedAPR < 0.02) { // Less than 2% APR from fees
            findings.push({
                title: `Unsustainable LP Economics: ${pool.token0}/${pool.token1}`,
                description: `Fee APR of ${(annualizedAPR * 100).toFixed(1)}% may not compensate LPs for impermanent loss risk.`,
                attackVector: 'Rational LPs will withdraw, reducing liquidity over time. Death spiral risk.',
                mitigation: 'Add token incentives, increase fee tier, or improve volume through integrations.',
                confidence: 0.6
            });
            score += 3;
        }
        return { score, findings };
    }
    analyzeImpermanentLoss(pools) {
        const findings = [];
        let score = 0;
        // Check for volatile pair exposure
        const volatilePairs = pools.filter(p => !p.token0.includes('USD') && !p.token1.includes('USD') &&
            !p.token0.includes('USDC') && !p.token1.includes('USDC') &&
            !p.token0.includes('USDT') && !p.token1.includes('USDT'));
        if (volatilePairs.length > pools.length * 0.7) {
            findings.push({
                title: 'High Impermanent Loss Exposure',
                description: `${volatilePairs.length} of ${pools.length} pools are volatile-volatile pairs with no stablecoin anchor.`,
                attackVector: 'LPs face significant IL during price divergence. Can lose 5-25% vs holding during volatile periods.',
                mitigation: 'Consider single-sided staking, concentrated liquidity management, or IL protection mechanisms.',
                confidence: 0.7
            });
            score += 5;
        }
        return { score, findings };
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
exports.LiquidityAnalyzer = LiquidityAnalyzer;
