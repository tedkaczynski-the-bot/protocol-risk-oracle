import { RiskCategory, Finding, ProtocolData } from '../types/risk';

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
export class GameTheoryAnalyzer {
  
  analyze(protocol: ProtocolData): RiskCategory {
    const findings: Finding[] = [];
    
    // 1. Nash Equilibrium Analysis
    const nashFindings = this.analyzeNashEquilibria(protocol);
    findings.push(...nashFindings);
    
    // 2. Dominant Strategy Analysis
    const dominantFindings = this.analyzeDominantStrategies(protocol);
    findings.push(...dominantFindings);
    
    // 3. Coordination Game Analysis (Schelling Points)
    const coordinationFindings = this.analyzeCoordinationGames(protocol);
    findings.push(...coordinationFindings);
    
    // 4. Mechanism Design Flaws
    const mechanismFindings = this.analyzeMechanismDesign(protocol);
    findings.push(...mechanismFindings);
    
    // 5. Multi-Agent Dynamics
    const multiAgentFindings = this.analyzeMultiAgentDynamics(protocol);
    findings.push(...multiAgentFindings);
    
    // Calculate weighted score
    const totalScore = findings.reduce((sum, f) => {
      const severityWeight = { critical: 10, high: 7, medium: 4, low: 1 };
      const severity = this.findingSeverity(f.confidence || 0.5);
      return sum + (severityWeight[severity] * (f.confidence || 0.5));
    }, 0);
    
    const avgScore = findings.length > 0 ? Math.min(10, totalScore / findings.length) : 0;
    
    return {
      name: 'Game-Theoretic Risk',
      score: avgScore,
      severity: this.scoreSeverity(avgScore),
      findings
    };
  }

  /**
   * Nash Equilibrium Analysis
   * 
   * Identifies whether the protocol's intended state is a Nash equilibrium,
   * and whether there are alternative equilibria that harm the protocol.
   */
  private analyzeNashEquilibria(protocol: ProtocolData): Finding[] {
    const findings: Finding[] = [];

    // Check for bank run equilibrium (classic coordination failure)
    if (protocol.pools && protocol.tvl) {
      const totalPoolLiquidity = protocol.pools.reduce((sum, p) => sum + p.liquidity, 0);
      const utilizationRatio = totalPoolLiquidity / protocol.tvl;
      
      if (utilizationRatio < 0.3) {
        findings.push({
          title: 'Bank Run Equilibrium Exists',
          description: `Only ${(utilizationRatio * 100).toFixed(0)}% of TVL is liquid. Two Nash equilibria exist: (1) Everyone stays → stable, (2) Everyone withdraws → collapse. Both are self-fulfilling.`,
          attackVector: 'TRIGGER MECHANISM: Any shock (hack rumor, whale exit, market crash) can flip the system from equilibrium 1 to 2. Once the run starts, staying becomes irrational — the run completes.',
          mitigation: 'Implement withdrawal queues, dynamic exit fees, or overcollateralization to make "stay" dominant regardless of others\' actions.',
          confidence: 0.85,
          gameTheory: {
            concept: 'Multiple Nash Equilibria',
            payoffMatrix: 'Stay/Stay: (1,1), Stay/Run: (-1,0), Run/Stay: (0,-1), Run/Run: (0,0)',
            equilibria: ['(Stay, Stay)', '(Run, Run)'],
            vulnerability: 'Coordination failure via belief shift'
          }
        });
      }
    }

    // Check for governance stalemate equilibrium
    if (protocol.governance) {
      const { quorum, topHolderVotingPower } = protocol.governance;
      
      // If top holder can block but not pass, and quorum is hard to reach
      if (topHolderVotingPower > 0.33 && topHolderVotingPower < 0.5 && quorum > 0.2) {
        findings.push({
          title: 'Governance Deadlock Equilibrium',
          description: `Top holder has ${(topHolderVotingPower * 100).toFixed(0)}% (blocking minority) while quorum requires ${(quorum * 100).toFixed(0)}%. Nash equilibrium is permanent stalemate.`,
          attackVector: 'EXPLOIT: Attacker accumulates blocking stake, then extracts rent by threatening to block beneficial proposals unless paid. Governance hostage situation.',
          mitigation: 'Implement optimistic governance (proposals pass unless vetoed), or conviction voting to break deadlocks.',
          confidence: 0.75,
          gameTheory: {
            concept: 'Veto Player Deadlock',
            equilibria: ['Stalemate (no proposals pass)'],
            vulnerability: 'Rent extraction via blocking power'
          }
        });
      }
    }

    return findings;
  }

  /**
   * Dominant Strategy Analysis
   * 
   * Identifies when rational actors have a clear best strategy regardless
   * of what others do — and whether that strategy harms the protocol.
   */
  private analyzeDominantStrategies(protocol: ProtocolData): Finding[] {
    const findings: Finding[] = [];

    // Check for "farm and dump" dominant strategy
    if (protocol.tokenomics) {
      const { emissionRate, circulatingSupply, concentration } = protocol.tokenomics;
      
      if (emissionRate && circulatingSupply) {
        const dailyDilution = (emissionRate * 24) / circulatingSupply;
        
        if (dailyDilution > 0.01) { // >1% daily dilution
          findings.push({
            title: 'Dominant Strategy: Farm-and-Dump',
            description: `Daily emission dilution of ${(dailyDilution * 100).toFixed(2)}% creates a dominant strategy to sell rewards immediately.`,
            attackVector: 'DOMINANT STRATEGY PROOF: If you hold rewards, you lose value to dilution. If you sell, you capture value. Selling is strictly better regardless of others\' actions → death spiral.',
            mitigation: 'Implement ve-tokenomics (locking for voting power), real yield from protocol fees, or aggressive buyback-and-burn.',
            confidence: 0.9,
            gameTheory: {
              concept: 'Strictly Dominant Strategy',
              strategy: 'Sell immediately upon receiving rewards',
              dominance: 'Strictly dominant — always better regardless of others',
              outcome: 'Sustained sell pressure → price decline → reduced TVL → reduced rewards → spiral'
            }
          });
        }
      }
    }

    // Check for MEV extraction dominant strategy
    if (protocol.pools) {
      const vulnerablePools = protocol.pools.filter(p => 
        p.volume24h / p.liquidity > 0.3 && p.liquidity < 500000
      );
      
      if (vulnerablePools.length > 0) {
        findings.push({
          title: 'Dominant Strategy: MEV Extraction',
          description: `${vulnerablePools.length} pool(s) have profitable sandwich conditions. Searchers have dominant strategy to extract.`,
          attackVector: 'EXPECTED VALUE: For searchers, sandwiching is +EV regardless of competition. Nash equilibrium is maximum extraction until marginal profit = gas cost.',
          mitigation: 'Private mempools, MEV-share mechanisms, or batch auctions to redirect value to users.',
          confidence: 0.8,
          gameTheory: {
            concept: 'Tragedy of the Commons',
            strategy: 'Extract maximum MEV',
            outcome: 'Users bear cost, LPs exit, liquidity degrades'
          }
        });
      }
    }

    return findings;
  }

  /**
   * Coordination Game Analysis
   * 
   * Identifies Schelling points and coordination attack surfaces.
   */
  private analyzeCoordinationGames(protocol: ProtocolData): Finding[] {
    const findings: Finding[] = [];

    // Check for Schelling point attacks on governance
    if (protocol.governance && protocol.governance.votingPeriod < 5 * 24 * 3600) {
      findings.push({
        title: 'Schelling Point Attack Surface',
        description: `Short voting period (${Math.floor(protocol.governance.votingPeriod / 3600)}h) enables coordination attacks around public focal points.`,
        attackVector: 'ATTACK: Attacker publicly announces "vote YES on proposal X at block Y". This creates a Schelling point — voters coordinate on the announced strategy because they expect others to. Flash loans amplify.',
        mitigation: 'Implement commit-reveal voting, time-weighted voting power, or minimum deliberation periods.',
        confidence: 0.7,
        gameTheory: {
          concept: 'Schelling Point / Focal Point',
          vulnerability: 'Public announcements become self-fulfilling coordination devices',
          amplifiers: ['Flash loans', 'Social media', 'Whale wallets']
        }
      });
    }

    // Check for oracle coordination attacks
    if (protocol.pools && protocol.pools.length > 0) {
      const lowLiquidityPools = protocol.pools.filter(p => p.liquidity < 100000);
      
      if (lowLiquidityPools.length >= 2) {
        findings.push({
          title: 'Cross-Venue Oracle Manipulation',
          description: `${lowLiquidityPools.length} low-liquidity pools can be manipulated simultaneously to move aggregate price oracles.`,
          attackVector: 'COORDINATION: Attacker manipulates multiple venues in same block. TWAP oracles that aggregate see consistent "real" price movement. Liquidations triggered on false signals.',
          mitigation: 'Use median oracles, implement circuit breakers, require minimum source liquidity.',
          confidence: 0.75,
          gameTheory: {
            concept: 'Coordinated Deviation',
            attack: 'Multi-venue simultaneous manipulation',
            cost: 'Flash loan fees only — capital efficient'
          }
        });
      }
    }

    return findings;
  }

  /**
   * Mechanism Design Flaw Detection
   * 
   * Identifies violations of core mechanism design principles:
   * - Incentive Compatibility (IC)
   * - Individual Rationality (IR)
   * - Budget Balance
   */
  private analyzeMechanismDesign(protocol: ProtocolData): Finding[] {
    const findings: Finding[] = [];

    // Check IC violation: Are users incentivized to report truthfully?
    if (protocol.governance) {
      findings.push({
        title: 'Incentive Compatibility Analysis',
        description: 'Governance votes are public and non-binding pre-vote. Users can misrepresent preferences to manipulate expectations.',
        attackVector: 'IC VIOLATION: Voters can vote against their true preference if they believe it influences others (strategic voting). True preferences are not revealed.',
        mitigation: 'Implement quadratic voting, futarchy (prediction markets), or conviction voting to align revealed and true preferences.',
        confidence: 0.6,
        gameTheory: {
          concept: 'Incentive Compatibility (Revelation Principle)',
          violation: 'Strategic voting is rational',
          fix: 'Mechanism should make truth-telling dominant'
        }
      });
    }

    // Check for value leakage (Budget Balance violation)
    if (protocol.pools) {
      const totalVolume = protocol.pools.reduce((sum, p) => sum + p.volume24h, 0);
      const totalFees = protocol.pools.reduce((sum, p) => sum + (p.volume24h * p.fees), 0);
      const mevEstimate = totalVolume * 0.005; // Rough MEV estimate
      
      if (mevEstimate > totalFees * 0.5) {
        findings.push({
          title: 'Value Leakage to External Extractors',
          description: `Estimated MEV extraction (~$${(mevEstimate).toFixed(0)}/day) exceeds ${((mevEstimate / totalFees) * 100).toFixed(0)}% of LP fee revenue.`,
          attackVector: 'BUDGET IMBALANCE: Protocol participants (LPs, traders) generate value that leaks to non-participants (MEV searchers, builders). Negative-sum for protocol ecosystem.',
          mitigation: 'MEV internalization via protocol-owned searchers, MEV-share, or batch auctions.',
          confidence: 0.65,
          gameTheory: {
            concept: 'Budget Balance / Value Leakage',
            leakage: 'MEV to external searchers',
            impact: 'LPs subsidize searcher profits'
          }
        });
      }
    }

    return findings;
  }

  /**
   * Multi-Agent Dynamics
   * 
   * Analyzes emergent behavior from multiple rational agents interacting.
   */
  private analyzeMultiAgentDynamics(protocol: ProtocolData): Finding[] {
    const findings: Finding[] = [];

    // Check for liquidation cascade dynamics
    if (protocol.tvl && protocol.pools) {
      const totalLiquidity = protocol.pools.reduce((sum, p) => sum + p.liquidity, 0);
      const liquidityRatio = totalLiquidity / protocol.tvl;
      
      if (liquidityRatio < 0.2) {
        findings.push({
          title: 'Liquidation Cascade Dynamics',
          description: `Low liquidity ratio (${(liquidityRatio * 100).toFixed(0)}%) creates conditions for cascading liquidations.`,
          attackVector: 'CASCADE MECHANISM: Initial liquidation → sell pressure → price drop → more positions underwater → more liquidations → accelerating spiral. Each agent\'s rational exit worsens conditions for remaining agents.',
          mitigation: 'Implement gradual liquidations, liquidation insurance funds, or dynamic collateral requirements based on liquidity conditions.',
          confidence: 0.8,
          gameTheory: {
            concept: 'Negative Externality Cascade',
            mechanism: 'Each exit imposes cost on remaining participants',
            outcome: 'Race to exit first'
          }
        });
      }
    }

    // Check for frontrunning arms race
    if (protocol.pools && protocol.pools.some(p => p.volume24h > 100000)) {
      findings.push({
        title: 'Frontrunning Arms Race',
        description: 'High-volume pools incentivize competitive latency optimization among searchers.',
        attackVector: 'ARMS RACE: Searchers invest in faster infrastructure → margins compress → only well-capitalized players survive → centralization of MEV extraction → potential for censorship/manipulation.',
        mitigation: 'Time-based ordering (batch auctions), encrypted mempools, or MEV-smoothing mechanisms.',
        confidence: 0.7,
        gameTheory: {
          concept: 'Red Queen Effect / Arms Race',
          outcome: 'Socially wasteful investment in speed',
          centralisation: 'Tends toward oligopoly of sophisticated actors'
        }
      });
    }

    // Check for information asymmetry exploitation
    if (protocol.governance && protocol.governance.timelockDelay < 48 * 3600) {
      findings.push({
        title: 'Information Asymmetry Exploitation',
        description: `Short timelock (${Math.floor(protocol.governance.timelockDelay / 3600)}h) favors sophisticated actors who monitor proposals continuously.`,
        attackVector: 'ASYMMETRY: Sophisticated actors exit before harmful proposals execute. Retail users with slower information processing bear the cost. Creates adverse selection — only naive capital remains.',
        mitigation: 'Extend timelocks, implement proposal notification systems, or add automatic position unwinding for impacted users.',
        confidence: 0.65,
        gameTheory: {
          concept: 'Adverse Selection / Lemon Problem',
          asymmetry: 'Speed of information processing',
          outcome: 'Sophisticated actors extract from naive actors'
        }
      });
    }

    return findings;
  }

  private findingSeverity(confidence: number): 'low' | 'medium' | 'high' | 'critical' {
    if (confidence >= 0.85) return 'critical';
    if (confidence >= 0.7) return 'high';
    if (confidence >= 0.5) return 'medium';
    return 'low';
  }

  private scoreSeverity(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 8) return 'critical';
    if (score >= 6) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }
}
