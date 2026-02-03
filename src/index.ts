import express from 'express';
import { EconomicAnalyzer } from './analyzers/economic';
import { GovernanceAnalyzer } from './analyzers/governance';
import { MEVAnalyzer } from './analyzers/mev';
import { ProtocolRiskReport, ProtocolData } from './types/risk';

const app = express();
app.use(express.json());

const economicAnalyzer = new EconomicAnalyzer();
const governanceAnalyzer = new GovernanceAnalyzer();
const mevAnalyzer = new MEVAnalyzer();

// Generate full risk report for a protocol
function analyzeProtocol(data: ProtocolData): ProtocolRiskReport {
  const economic = economicAnalyzer.analyze(data);
  const governance = governanceAnalyzer.analyze(data);
  const mev = mevAnalyzer.analyze(data);
  
  // Placeholder for remaining analyzers
  const liquidity = { name: 'Liquidity Risk', score: 0, severity: 'low' as const, findings: [] };
  const composability = { name: 'Composability Risk', score: 0, severity: 'low' as const, findings: [] };

  const categories = { economic, governance, liquidity, composability, mev };
  
  // Calculate overall score (weighted average)
  const weights = { economic: 0.3, governance: 0.2, liquidity: 0.25, composability: 0.15, mev: 0.1 };
  const overallScore = Object.entries(categories).reduce((sum, [key, cat]) => {
    return sum + cat.score * (weights[key as keyof typeof weights] || 0);
  }, 0);

  const severityOrder = ['low', 'medium', 'high', 'critical'];
  const maxSeverity = Object.values(categories).reduce((max, cat) => {
    return severityOrder.indexOf(cat.severity) > severityOrder.indexOf(max) ? cat.severity : max;
  }, 'low' as 'low' | 'medium' | 'high' | 'critical');

  const allFindings = Object.values(categories).flatMap(c => c.findings);
  const criticalFindings = allFindings.filter(f => f.confidence > 0.7);

  return {
    protocol: data.name,
    address: data.address,
    timestamp: Date.now(),
    overallScore: Math.round(overallScore * 10) / 10,
    overallSeverity: maxSeverity,
    categories,
    summary: `Analyzed ${data.name}: Found ${allFindings.length} potential risk factors. ${criticalFindings.length} high-confidence findings require attention.`,
    recommendations: criticalFindings.slice(0, 3).map(f => f.mitigation || f.title)
  };
}

// API endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', version: '0.1.0' });
});

app.post('/api/analyze', (req, res) => {
  try {
    const data: ProtocolData = req.body;
    if (!data.address || !data.name) {
      return res.status(400).json({ error: 'Missing required fields: address, name' });
    }
    const report = analyzeProtocol(data);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Analysis failed', details: String(error) });
  }
});

app.get('/api/demo', (req, res) => {
  // Demo analysis with sample data - a deliberately risky protocol
  const sampleProtocol: ProtocolData = {
    address: 'DemoProtocol111111111111111111111111111111111',
    name: 'Risky DeFi Protocol',
    tvl: 50000000,
    tokenomics: {
      totalSupply: 1000000000,
      circulatingSupply: 250000000,
      emissionRate: 100000, // per hour - very high!
      concentration: 0.75 // high concentration
    },
    governance: {
      quorum: 0.03, // 3% - very low
      votingPeriod: 3 * 24 * 3600, // 3 days
      timelockDelay: 12 * 3600, // 12 hours - short
      proposalThreshold: 0.01,
      topHolderVotingPower: 0.45 // 45% - high concentration
    },
    pools: [
      { address: 'pool1', token0: 'SOL', token1: 'DEMO', liquidity: 50000, volume24h: 45000, fees: 0.003 },
      { address: 'pool2', token0: 'USDC', token1: 'DEMO', liquidity: 200000, volume24h: 150000, fees: 0.001 }
    ]
  };
  
  const report = analyzeProtocol(sampleProtocol);
  res.json(report);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Protocol Risk Oracle running on port ${PORT}`);
  console.log(`Demo: http://localhost:${PORT}/api/demo`);
});

export { analyzeProtocol };
