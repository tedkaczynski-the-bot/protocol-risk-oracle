import { EconomicAnalyzer } from '../src/analyzers/economic'
import { GovernanceAnalyzer } from '../src/analyzers/governance'
import { MEVAnalyzer } from '../src/analyzers/mev'
import { LiquidityAnalyzer } from '../src/analyzers/liquidity'
import { GameTheoryAnalyzer } from '../src/analyzers/game-theory'
import { ComposabilityAnalyzer } from '../src/analyzers/composability'
import { ProtocolRiskReport, ProtocolData } from '../src/types/risk'

// Initialize analyzers
const economicAnalyzer = new EconomicAnalyzer()
const governanceAnalyzer = new GovernanceAnalyzer()
const mevAnalyzer = new MEVAnalyzer()
const liquidityAnalyzer = new LiquidityAnalyzer()
const gameTheoryAnalyzer = new GameTheoryAnalyzer()
const composabilityAnalyzer = new ComposabilityAnalyzer()

export function analyzeProtocol(data: ProtocolData): ProtocolRiskReport {
  const economic = economicAnalyzer.analyze(data)
  const governance = governanceAnalyzer.analyze(data)
  const mev = mevAnalyzer.analyze(data)
  const liquidity = liquidityAnalyzer.analyze(data)
  const gameTheory = gameTheoryAnalyzer.analyze(data)
  const composability = composabilityAnalyzer.analyze(data)

  const categories = { economic, governance, liquidity, composability, mev, gameTheory }

  const weights = {
    economic: 0.2,
    governance: 0.15,
    liquidity: 0.2,
    composability: 0.1,
    mev: 0.1,
    gameTheory: 0.25,
  }

  const overallScore = Object.entries(categories).reduce((sum, [key, cat]) => {
    return sum + cat.score * (weights[key as keyof typeof weights] || 0)
  }, 0)

  const severityOrder = ['low', 'medium', 'high', 'critical'] as const
  const maxSeverity = Object.values(categories).reduce((max, cat) => {
    return severityOrder.indexOf(cat.severity) > severityOrder.indexOf(max)
      ? cat.severity
      : max
  }, 'low' as 'low' | 'medium' | 'high' | 'critical')

  const allFindings = Object.values(categories).flatMap((c) => c.findings)
  const criticalFindings = allFindings.filter((f) => f.confidence > 0.7)

  const nashEquilibria = gameTheory.findings
    .filter((f) => f.gameTheory?.equilibria)
    .flatMap((f) => f.gameTheory!.equilibria || [])

  const dominantStrategies = gameTheory.findings
    .filter((f) => f.gameTheory?.strategy && f.gameTheory?.dominance)
    .map((f) => `${f.gameTheory!.strategy} (${f.gameTheory!.dominance})`)

  return {
    protocol: data.name,
    address: data.address,
    timestamp: Date.now(),
    overallScore: Math.round(overallScore * 10) / 10,
    overallSeverity: maxSeverity,
    categories,
    summary: `Analyzed ${data.name}: Found ${allFindings.length} potential risk factors. ${criticalFindings.length} high-confidence findings.`,
    recommendations: criticalFindings
      .slice(0, 5)
      .map((f) => f.mitigation || f.title)
      .filter(Boolean),
    nashEquilibria: nashEquilibria.length > 0 ? nashEquilibria : undefined,
    dominantStrategies: dominantStrategies.length > 0 ? dominantStrategies : undefined,
  }
}

export const sampleProtocol: ProtocolData = {
  address: 'DemoProtocol111111111111111111111111111111111',
  name: 'Risky DeFi Protocol',
  tvl: 50000000,
  tokenomics: {
    totalSupply: 1000000000,
    circulatingSupply: 250000000,
    emissionRate: 100000,
    concentration: 0.75,
  },
  governance: {
    quorum: 0.03,
    votingPeriod: 2 * 24 * 3600,
    timelockDelay: 12 * 3600,
    proposalThreshold: 0.01,
    topHolderVotingPower: 0.45,
  },
  pools: [
    {
      address: 'pool1',
      token0: 'SOL',
      token1: 'DEMO',
      liquidity: 50000,
      volume24h: 45000,
      fees: 0.003,
    },
    {
      address: 'pool2',
      token0: 'USDC',
      token1: 'DEMO',
      liquidity: 200000,
      volume24h: 150000,
      fees: 0.001,
    },
    {
      address: 'pool3',
      token0: 'DEMO',
      token1: 'JUP',
      liquidity: 30000,
      volume24h: 25000,
      fees: 0.003,
    },
  ],
}
