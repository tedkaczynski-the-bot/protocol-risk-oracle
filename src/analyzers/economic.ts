import { RiskCategory, Finding, ProtocolData, TokenomicsData } from '../types/risk';

/**
 * Economic Risk Analyzer
 * 
 * Applies game-theoretic analysis to identify economic attack vectors:
 * - Nash equilibrium violations (where rational actors can profit by deviating)
 * - Incentive misalignments (where protocol goals conflict with user incentives)
 * - Value extraction opportunities (MEV, front-running, sandwich attacks)
 */
export class EconomicAnalyzer {
  
  analyze(protocol: ProtocolData): RiskCategory {
    const findings: Finding[] = [];
    let totalScore = 0;
    let findingCount = 0;

    // Check tokenomics
    if (protocol.tokenomics) {
      const tokenomicsFindings = this.analyzeTokenomics(protocol.tokenomics);
      findings.push(...tokenomicsFindings.findings);
      totalScore += tokenomicsFindings.score;
      findingCount++;
    }

    // Check for flash loan vulnerability patterns
    const flashLoanFindings = this.analyzeFlashLoanRisk(protocol);
    findings.push(...flashLoanFindings.findings);
    totalScore += flashLoanFindings.score;
    findingCount++;

    // Check for oracle manipulation risks
    const oracleFindings = this.analyzeOracleRisk(protocol);
    findings.push(...oracleFindings.findings);
    totalScore += oracleFindings.score;
    findingCount++;

    // Check for incentive alignment
    const incentiveFindings = this.analyzeIncentiveAlignment(protocol);
    findings.push(...incentiveFindings.findings);
    totalScore += incentiveFindings.score;
    findingCount++;

    const avgScore = findingCount > 0 ? totalScore / findingCount : 0;
    
    return {
      name: 'Economic Risk',
      score: Math.min(10, avgScore),
      severity: this.scoreSeverity(avgScore),
      findings
    };
  }

  private analyzeTokenomics(tokenomics: TokenomicsData): { score: number; findings: Finding[] } {
    const findings: Finding[] = [];
    let score = 0;

    // Check supply concentration (Gini coefficient)
    if (tokenomics.concentration !== undefined) {
      if (tokenomics.concentration > 0.8) {
        findings.push({
          title: 'Extreme Token Concentration',
          description: `Token supply is highly concentrated (Gini: ${tokenomics.concentration.toFixed(2)}). Top holders control majority of supply.`,
          attackVector: 'Whale manipulation: Large holders can crash price, front-run governance, or execute dump-and-pump schemes.',
          mitigation: 'Implement vesting schedules, progressive decentralization, or holder caps.',
          confidence: 0.9
        });
        score += 8;
      } else if (tokenomics.concentration > 0.6) {
        findings.push({
          title: 'Moderate Token Concentration',
          description: `Token supply shows moderate concentration (Gini: ${tokenomics.concentration.toFixed(2)}).`,
          attackVector: 'Coordinated selling pressure from top holders could cause significant price impact.',
          confidence: 0.7
        });
        score += 4;
      }
    }

    // Check emission rate vs circulating supply
    if (tokenomics.emissionRate && tokenomics.circulatingSupply) {
      const annualDilution = (tokenomics.emissionRate * 365 * 24) / tokenomics.circulatingSupply;
      if (annualDilution > 1.0) {
        findings.push({
          title: 'Hyperinflationary Emission Schedule',
          description: `Annual emission rate (${(annualDilution * 100).toFixed(0)}%) exceeds circulating supply. Severe dilution risk.`,
          attackVector: 'Early participants can farm and dump before dilution impacts price. Death spiral risk.',
          mitigation: 'Implement emission curve decay, buyback mechanisms, or utility sinks.',
          confidence: 0.95
        });
        score += 9;
      } else if (annualDilution > 0.5) {
        findings.push({
          title: 'High Emission Rate',
          description: `Annual dilution of ${(annualDilution * 100).toFixed(0)}% may outpace organic demand.`,
          attackVector: 'Sustained sell pressure from reward farming could suppress price appreciation.',
          confidence: 0.8
        });
        score += 5;
      }
    }

    // Check for upcoming cliff vesting
    if (tokenomics.vestingSchedule && tokenomics.vestingSchedule.length > 0) {
      const now = Date.now() / 1000;
      const upcomingUnlocks = tokenomics.vestingSchedule.filter(
        v => v.timestamp > now && v.timestamp < now + 30 * 24 * 3600
      );
      
      const totalUnlock = upcomingUnlocks.reduce((sum, v) => sum + v.amount, 0);
      const unlockPercent = (totalUnlock / tokenomics.circulatingSupply) * 100;
      
      if (unlockPercent > 10) {
        findings.push({
          title: 'Major Token Unlock Imminent',
          description: `${unlockPercent.toFixed(1)}% of circulating supply unlocks within 30 days.`,
          attackVector: 'Unlocking insiders may sell immediately, causing significant price impact.',
          mitigation: 'Monitor unlock dates, consider hedging positions before unlock events.',
          confidence: 0.85
        });
        score += 7;
      }
    }

    return { score: findings.length > 0 ? score / findings.length : 0, findings };
  }

  private analyzeFlashLoanRisk(protocol: ProtocolData): { score: number; findings: Finding[] } {
    const findings: Finding[] = [];
    let score = 0;

    // Check for price-dependent operations without proper guards
    if (protocol.pools && protocol.pools.length > 0) {
      const lowLiquidityPools = protocol.pools.filter(p => p.liquidity < 100000);
      
      if (lowLiquidityPools.length > 0) {
        findings.push({
          title: 'Low Liquidity Pools Vulnerable to Manipulation',
          description: `${lowLiquidityPools.length} pool(s) have liquidity under $100k, making them susceptible to flash loan price manipulation.`,
          attackVector: 'Attacker can borrow large amounts via flash loan, manipulate pool price, exploit price-dependent operations, then repay loan in single transaction.',
          mitigation: 'Use TWAP oracles, implement price impact limits, or require multi-block settlement.',
          confidence: 0.8
        });
        score += 7;
      }
    }

    return { score, findings };
  }

  private analyzeOracleRisk(protocol: ProtocolData): { score: number; findings: Finding[] } {
    const findings: Finding[] = [];
    let score = 0;

    // Check for single oracle dependency
    findings.push({
      title: 'Oracle Configuration Review Required',
      description: 'Unable to automatically determine oracle configuration. Manual review recommended.',
      attackVector: 'Single oracle dependency can lead to price manipulation or stale price exploitation.',
      mitigation: 'Use decentralized oracles (Pyth, Switchboard) with staleness checks and circuit breakers.',
      confidence: 0.5
    });
    score += 3;

    return { score, findings };
  }

  private analyzeIncentiveAlignment(protocol: ProtocolData): { score: number; findings: Finding[] } {
    const findings: Finding[] = [];
    let score = 0;

    // Game-theoretic check: Is the Nash equilibrium aligned with protocol goals?
    // This is a heuristic - real analysis would need protocol-specific logic
    
    if (protocol.pools && protocol.pools.length > 0) {
      // Check for incentive to withdraw vs stay (bank run analysis)
      const avgUtilization = protocol.pools.reduce((sum, p) => {
        const util = p.volume24h / (p.liquidity || 1);
        return sum + util;
      }, 0) / protocol.pools.length;

      if (avgUtilization > 0.9) {
        findings.push({
          title: 'High Utilization Creates Withdrawal Race',
          description: `Average pool utilization is ${(avgUtilization * 100).toFixed(0)}%. In a stress event, rational actors will race to exit, potentially causing cascading liquidations.`,
          attackVector: 'Bank run dynamics: First withdrawers get full value, late withdrawers face slippage or insolvency.',
          mitigation: 'Implement withdrawal queues, dynamic fees, or circuit breakers during high-stress periods.',
          confidence: 0.75
        });
        score += 6;
      }
    }

    return { score, findings };
  }

  private scoreSeverity(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 8) return 'critical';
    if (score >= 6) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }
}
