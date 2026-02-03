import { RiskCategory, Finding, ProtocolData, PoolData } from '../types/risk';

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
export class MEVAnalyzer {
  
  analyze(protocol: ProtocolData): RiskCategory {
    const findings: Finding[] = [];
    let totalScore = 0;

    if (!protocol.pools || protocol.pools.length === 0) {
      return {
        name: 'MEV Risk',
        score: 2,
        severity: 'low',
        findings: [{
          title: 'No Pool Data Available',
          description: 'Unable to analyze MEV exposure without pool/DEX data.',
          confidence: 0.3
        }]
      };
    }

    // Analyze each pool for MEV vulnerability
    for (const pool of protocol.pools) {
      const poolFindings = this.analyzePool(pool);
      findings.push(...poolFindings.findings);
      totalScore += poolFindings.score;
    }

    // Check for oracle-based MEV
    const oracleMEV = this.analyzeOracleMEV(protocol);
    findings.push(...oracleMEV.findings);
    totalScore += oracleMEV.score;

    const avgScore = findings.length > 0 ? totalScore / findings.length : 0;
    
    return {
      name: 'MEV Risk',
      score: Math.min(10, avgScore),
      severity: this.scoreSeverity(avgScore),
      findings
    };
  }

  private analyzePool(pool: PoolData): { score: number; findings: Finding[] } {
    const findings: Finding[] = [];
    let score = 0;

    // Calculate sandwich attack profitability
    // Low liquidity + high volume = profitable sandwiches
    const volumeToLiquidity = pool.volume24h / (pool.liquidity || 1);
    
    if (volumeToLiquidity > 0.5 && pool.liquidity < 500000) {
      findings.push({
        title: `High Sandwich Attack Exposure: ${pool.token0}/${pool.token1}`,
        description: `Pool has ${(volumeToLiquidity * 100).toFixed(0)}% daily volume relative to liquidity with only $${(pool.liquidity / 1000).toFixed(0)}k TVL.`,
        attackVector: 'Searchers can profitably sandwich large trades. Expected cost to users: 0.5-2% per trade.',
        mitigation: 'Use private mempools (Jito), implement MEV-aware routing, or add minimum output protection.',
        confidence: 0.85
      });
      score += 7;
    } else if (volumeToLiquidity > 0.3) {
      findings.push({
        title: `Moderate Sandwich Risk: ${pool.token0}/${pool.token1}`,
        description: `Active pool with ${(volumeToLiquidity * 100).toFixed(0)}% daily turnover may attract MEV bots.`,
        attackVector: 'Large trades (>1% of pool) are sandwichable.',
        confidence: 0.6
      });
      score += 4;
    }

    // Check for JIT liquidity vulnerability
    if (pool.fees < 0.003 && pool.liquidity > 1000000) {
      findings.push({
        title: `JIT Liquidity Target: ${pool.token0}/${pool.token1}`,
        description: `Low fee pool (${(pool.fees * 100).toFixed(2)}%) with high liquidity attracts JIT attacks.`,
        attackVector: 'JIT liquidity providers can add/remove liquidity around large trades, extracting fees from passive LPs.',
        mitigation: 'Consider higher fee tiers or concentrated liquidity with active management.',
        confidence: 0.7
      });
      score += 5;
    }

    return { score, findings };
  }

  private analyzeOracleMEV(protocol: ProtocolData): { score: number; findings: Finding[] } {
    const findings: Finding[] = [];
    let score = 0;

    // Generic oracle front-running warning
    findings.push({
      title: 'Oracle Update Front-Running Risk',
      description: 'Protocols using on-chain oracles are vulnerable to front-running around price updates.',
      attackVector: 'Searchers monitor oracle update transactions and front-run with arbitrage or liquidations.',
      mitigation: 'Use pull oracles (Pyth), implement commit-reveal schemes, or add oracle update delays.',
      confidence: 0.5
    });
    score += 3;

    return { score, findings };
  }

  private scoreSeverity(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 8) return 'critical';
    if (score >= 6) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }
}
