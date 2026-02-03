import express, { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { EconomicAnalyzer } from './analyzers/economic';
import { GovernanceAnalyzer } from './analyzers/governance';
import { MEVAnalyzer } from './analyzers/mev';
import { LiquidityAnalyzer } from './analyzers/liquidity';
import { GameTheoryAnalyzer } from './analyzers/game-theory';
import { ProtocolRiskReport, ProtocolData, Finding } from './types/risk';

const app = express();
app.use(express.json());

// Initialize analyzers
const economicAnalyzer = new EconomicAnalyzer();
const governanceAnalyzer = new GovernanceAnalyzer();
const mevAnalyzer = new MEVAnalyzer();
const liquidityAnalyzer = new LiquidityAnalyzer();
const gameTheoryAnalyzer = new GameTheoryAnalyzer();

// ============================================================================
// X402 PAYMENT LAYER
// ============================================================================

interface X402Config {
  enabled: boolean;
  pricePerAnalysis: number; // in USDC
  recipientAddress: string;
  network: 'base' | 'ethereum' | 'solana';
}

const x402Config: X402Config = {
  enabled: process.env.X402_ENABLED === 'true',
  pricePerAnalysis: parseFloat(process.env.X402_PRICE || '0.10'), // $0.10 default
  recipientAddress: process.env.X402_RECIPIENT || '0x81FD234f63Dd559d0EDA56d17BB1Bb78f236DB37',
  network: (process.env.X402_NETWORK as 'base' | 'ethereum' | 'solana') || 'base'
};

// X402 payment verification middleware
async function x402Middleware(req: Request, res: Response, next: NextFunction) {
  // Skip if x402 not enabled
  if (!x402Config.enabled) {
    return next();
  }

  // Check for x402 payment header
  const paymentProof = req.headers['x-402-payment'] as string;
  const paymentReceipt = req.headers['x-402-receipt'] as string;

  if (!paymentProof && !paymentReceipt) {
    // Return 402 Payment Required with payment instructions
    return res.status(402).json({
      error: 'Payment Required',
      x402: {
        version: '1.0',
        price: x402Config.pricePerAnalysis,
        currency: 'USDC',
        network: x402Config.network,
        recipient: x402Config.recipientAddress,
        memo: `protocol-risk-oracle:${Date.now()}`,
        instructions: 'Send USDC to recipient address with memo. Include tx hash in x-402-payment header.',
        endpoints: {
          analyze: '/api/analyze',
          quote: '/api/x402/quote'
        }
      }
    });
  }

  // Verify payment (simplified - real implementation would check chain)
  // For now, we accept any valid-looking tx hash for testing
  if (paymentProof && paymentProof.length >= 64) {
    // In production: verify tx on-chain, check amount, check recipient
    console.log(`[x402] Payment received: ${paymentProof.slice(0, 16)}...`);
    
    // Add receipt to response headers
    res.setHeader('x-402-receipt', `receipt:${Date.now()}:${paymentProof.slice(0, 16)}`);
    return next();
  }

  // If receipt provided, verify it's valid
  if (paymentReceipt && paymentReceipt.startsWith('receipt:')) {
    // Verify receipt is recent (within 1 hour)
    const parts = paymentReceipt.split(':');
    const timestamp = parseInt(parts[1]);
    if (Date.now() - timestamp < 3600000) {
      return next();
    }
  }

  return res.status(402).json({
    error: 'Invalid payment proof',
    message: 'Provide valid transaction hash in x-402-payment header'
  });
}

// X402 quote endpoint (always free)
app.get('/api/x402/quote', (req, res) => {
  res.json({
    service: 'Protocol Risk Oracle',
    version: '0.3.0',
    x402: {
      enabled: x402Config.enabled,
      price: x402Config.pricePerAnalysis,
      currency: 'USDC',
      network: x402Config.network,
      recipient: x402Config.recipientAddress,
      capabilities: [
        'Full protocol risk analysis',
        'Game-theoretic vulnerability detection',
        'Nash equilibrium identification',
        'Dominant strategy analysis',
        'MEV exposure assessment',
        'Governance attack surface mapping'
      ]
    }
  });
});

// ============================================================================
// CORE ANALYSIS ENGINE
// ============================================================================

function analyzeProtocol(data: ProtocolData): ProtocolRiskReport {
  // Run all analyzers
  const economic = economicAnalyzer.analyze(data);
  const governance = governanceAnalyzer.analyze(data);
  const mev = mevAnalyzer.analyze(data);
  const liquidity = liquidityAnalyzer.analyze(data);
  const gameTheory = gameTheoryAnalyzer.analyze(data);
  
  // Placeholder for composability (TODO: implement)
  const composability = { name: 'Composability Risk', score: 0, severity: 'low' as const, findings: [] };

  const categories = { economic, governance, liquidity, composability, mev, gameTheory };
  
  // Calculate overall score (weighted average - game theory gets significant weight)
  const weights = { 
    economic: 0.20, 
    governance: 0.15, 
    liquidity: 0.20, 
    composability: 0.10, 
    mev: 0.10,
    gameTheory: 0.25 // Game theory is the core differentiator
  };
  
  const overallScore = Object.entries(categories).reduce((sum, [key, cat]) => {
    return sum + cat.score * (weights[key as keyof typeof weights] || 0);
  }, 0);

  const severityOrder = ['low', 'medium', 'high', 'critical'];
  const maxSeverity = Object.values(categories).reduce((max, cat) => {
    return severityOrder.indexOf(cat.severity) > severityOrder.indexOf(max) ? cat.severity : max;
  }, 'low' as 'low' | 'medium' | 'high' | 'critical');

  const allFindings = Object.values(categories).flatMap(c => c.findings);
  const criticalFindings = allFindings.filter(f => f.confidence > 0.7);
  
  // Extract game theory insights
  const nashEquilibria = gameTheory.findings
    .filter(f => f.gameTheory?.equilibria)
    .flatMap(f => f.gameTheory!.equilibria || []);
    
  const dominantStrategies = gameTheory.findings
    .filter(f => f.gameTheory?.strategy && f.gameTheory?.dominance)
    .map(f => `${f.gameTheory!.strategy} (${f.gameTheory!.dominance})`);

  return {
    protocol: data.name,
    address: data.address,
    timestamp: Date.now(),
    overallScore: Math.round(overallScore * 10) / 10,
    overallSeverity: maxSeverity,
    categories,
    summary: generateSummary(data.name, allFindings, criticalFindings, gameTheory),
    recommendations: generateRecommendations(criticalFindings),
    nashEquilibria: nashEquilibria.length > 0 ? nashEquilibria : undefined,
    dominantStrategies: dominantStrategies.length > 0 ? dominantStrategies : undefined
  };
}

function generateSummary(
  name: string, 
  allFindings: Finding[], 
  criticalFindings: Finding[],
  gameTheory: { findings: Finding[] }
): string {
  const gameTheoryIssues = gameTheory.findings.filter(f => f.confidence > 0.6);
  
  let summary = `Analyzed ${name}: Found ${allFindings.length} potential risk factors. `;
  summary += `${criticalFindings.length} high-confidence findings require immediate attention. `;
  
  if (gameTheoryIssues.length > 0) {
    const concepts = [...new Set(gameTheoryIssues.map(f => f.gameTheory?.concept).filter(Boolean))];
    summary += `Game-theoretic vulnerabilities detected: ${concepts.slice(0, 3).join(', ')}.`;
  }
  
  return summary;
}

function generateRecommendations(findings: Finding[]): string[] {
  return findings
    .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
    .slice(0, 5)
    .map(f => f.mitigation || f.title)
    .filter(Boolean);
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

// Health check (always free)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    version: '0.3.0',
    x402: x402Config.enabled,
    analyzers: ['economic', 'governance', 'mev', 'liquidity', 'gameTheory']
  });
});

// Main analysis endpoint (requires x402 payment if enabled)
app.post('/api/analyze', x402Middleware, (req, res) => {
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

// Demo endpoint (always free)
app.get('/api/demo', (req, res) => {
  const sampleProtocol: ProtocolData = {
    address: 'DemoProtocol111111111111111111111111111111111',
    name: 'Risky DeFi Protocol',
    tvl: 50000000,
    tokenomics: {
      totalSupply: 1000000000,
      circulatingSupply: 250000000,
      emissionRate: 100000, // per hour - creates farm-dump dynamics
      concentration: 0.75
    },
    governance: {
      quorum: 0.03, // 3% - trivial to reach
      votingPeriod: 2 * 24 * 3600, // 2 days - short
      timelockDelay: 12 * 3600, // 12 hours - very short
      proposalThreshold: 0.01,
      topHolderVotingPower: 0.45 // near-majority
    },
    pools: [
      { address: 'pool1', token0: 'SOL', token1: 'DEMO', liquidity: 50000, volume24h: 45000, fees: 0.003 },
      { address: 'pool2', token0: 'USDC', token1: 'DEMO', liquidity: 200000, volume24h: 150000, fees: 0.001 },
      { address: 'pool3', token0: 'DEMO', token1: 'JUP', liquidity: 30000, volume24h: 25000, fees: 0.003 }
    ]
  };
  
  const report = analyzeProtocol(sampleProtocol);
  res.json(report);
});

// Serve skill files for agent discovery
app.get('/skill.md', (req, res) => {
  const skillPath = path.join(__dirname, '../skill/skill.md');
  if (fs.existsSync(skillPath)) {
    res.type('text/markdown').send(fs.readFileSync(skillPath, 'utf-8'));
  } else {
    res.status(404).send('Skill file not found');
  }
});

app.get('/heartbeat.md', (req, res) => {
  const hbPath = path.join(__dirname, '../skill/heartbeat.md');
  if (fs.existsSync(hbPath)) {
    res.type('text/markdown').send(fs.readFileSync(hbPath, 'utf-8'));
  } else {
    res.status(404).send('Heartbeat file not found');
  }
});

// Agent registry endpoint (for discovery)
app.get('/agent.json', (req, res) => {
  res.json({
    name: 'Protocol Risk Oracle',
    description: 'Game-theoretic risk analysis for DeFi protocols. Thinks like an attacker.',
    version: '0.3.0',
    author: 'unabotter',
    capabilities: [
      'protocol-analysis',
      'game-theory',
      'risk-assessment',
      'mev-detection',
      'governance-audit'
    ],
    pricing: {
      model: 'x402',
      price: x402Config.pricePerAnalysis,
      currency: 'USDC',
      network: x402Config.network
    },
    endpoints: {
      analyze: '/api/analyze',
      demo: '/api/demo',
      quote: '/api/x402/quote',
      health: '/api/health'
    },
    contact: {
      github: 'https://github.com/tedkaczynski-the-bot/protocol-risk-oracle',
      twitter: '@spoobsV1'
    }
  });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🔮 Protocol Risk Oracle v0.3.0`);
  console.log(`   Port: ${PORT}`);
  console.log(`   x402: ${x402Config.enabled ? `enabled ($${x402Config.pricePerAnalysis} USDC)` : 'disabled'}`);
  console.log(`\n   Endpoints:`);
  console.log(`   • Demo:   http://localhost:${PORT}/api/demo`);
  console.log(`   • Quote:  http://localhost:${PORT}/api/x402/quote`);
  console.log(`   • Agent:  http://localhost:${PORT}/agent.json`);
  console.log(`   • Skill:  http://localhost:${PORT}/skill.md`);
});

export { analyzeProtocol };
