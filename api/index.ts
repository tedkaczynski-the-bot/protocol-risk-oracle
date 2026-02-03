import { VercelRequest, VercelResponse } from '@vercel/node';
import { EconomicAnalyzer } from '../src/analyzers/economic';
import { GovernanceAnalyzer } from '../src/analyzers/governance';
import { MEVAnalyzer } from '../src/analyzers/mev';
import { LiquidityAnalyzer } from '../src/analyzers/liquidity';
import { GameTheoryAnalyzer } from '../src/analyzers/game-theory';
import { ProtocolRiskReport, ProtocolData, Finding } from '../src/types/risk';
import * as fs from 'fs';
import * as path from 'path';

// Initialize analyzers
const economicAnalyzer = new EconomicAnalyzer();
const governanceAnalyzer = new GovernanceAnalyzer();
const mevAnalyzer = new MEVAnalyzer();
const liquidityAnalyzer = new LiquidityAnalyzer();
const gameTheoryAnalyzer = new GameTheoryAnalyzer();

// X402 config
const x402Config = {
  enabled: process.env.X402_ENABLED === 'true',
  pricePerAnalysis: parseFloat(process.env.X402_PRICE || '0.10'),
  recipientAddress: process.env.X402_RECIPIENT || '0x81FD234f63Dd559d0EDA56d17BB1Bb78f236DB37',
  network: (process.env.X402_NETWORK || 'base') as 'base' | 'ethereum' | 'solana'
};

function analyzeProtocol(data: ProtocolData): ProtocolRiskReport {
  const economic = economicAnalyzer.analyze(data);
  const governance = governanceAnalyzer.analyze(data);
  const mev = mevAnalyzer.analyze(data);
  const liquidity = liquidityAnalyzer.analyze(data);
  const gameTheory = gameTheoryAnalyzer.analyze(data);
  const composability = { name: 'Composability Risk', score: 0, severity: 'low' as const, findings: [] };

  const categories = { economic, governance, liquidity, composability, mev, gameTheory };
  
  const weights = { 
    economic: 0.20, governance: 0.15, liquidity: 0.20, 
    composability: 0.10, mev: 0.10, gameTheory: 0.25 
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
    summary: `Analyzed ${data.name}: Found ${allFindings.length} potential risk factors. ${criticalFindings.length} high-confidence findings.`,
    recommendations: criticalFindings.slice(0, 5).map(f => f.mitigation || f.title).filter(Boolean),
    nashEquilibria: nashEquilibria.length > 0 ? nashEquilibria : undefined,
    dominantStrategies: dominantStrategies.length > 0 ? dominantStrategies : undefined
  };
}

const sampleProtocol: ProtocolData = {
  address: 'DemoProtocol111111111111111111111111111111111',
  name: 'Risky DeFi Protocol',
  tvl: 50000000,
  tokenomics: {
    totalSupply: 1000000000,
    circulatingSupply: 250000000,
    emissionRate: 100000,
    concentration: 0.75
  },
  governance: {
    quorum: 0.03,
    votingPeriod: 2 * 24 * 3600,
    timelockDelay: 12 * 3600,
    proposalThreshold: 0.01,
    topHolderVotingPower: 0.45
  },
  pools: [
    { address: 'pool1', token0: 'SOL', token1: 'DEMO', liquidity: 50000, volume24h: 45000, fees: 0.003 },
    { address: 'pool2', token0: 'USDC', token1: 'DEMO', liquidity: 200000, volume24h: 150000, fees: 0.001 },
    { address: 'pool3', token0: 'DEMO', token1: 'JUP', liquidity: 30000, volume24h: 25000, fees: 0.003 }
  ]
};

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { url, method } = req;
  const pathname = url?.split('?')[0] || '/';

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-402-payment, x-402-receipt');
  
  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Routes
  if (pathname === '/api/health' || pathname === '/') {
    return res.json({ 
      status: 'healthy', 
      version: '0.3.0',
      x402: x402Config.enabled,
      analyzers: ['economic', 'governance', 'mev', 'liquidity', 'gameTheory']
    });
  }

  if (pathname === '/api/demo') {
    return res.json(analyzeProtocol(sampleProtocol));
  }

  if (pathname === '/api/x402/quote') {
    return res.json({
      service: 'Protocol Risk Oracle',
      version: '0.3.0',
      x402: {
        enabled: x402Config.enabled,
        price: x402Config.pricePerAnalysis,
        currency: 'USDC',
        network: x402Config.network,
        recipient: x402Config.recipientAddress
      }
    });
  }

  if (pathname === '/api/analyze' && method === 'POST') {
    // x402 check
    if (x402Config.enabled) {
      const paymentProof = req.headers['x-402-payment'] as string;
      if (!paymentProof || paymentProof.length < 64) {
        return res.status(402).json({
          error: 'Payment Required',
          x402: {
            price: x402Config.pricePerAnalysis,
            currency: 'USDC',
            network: x402Config.network,
            recipient: x402Config.recipientAddress
          }
        });
      }
    }
    
    try {
      const data = req.body as ProtocolData;
      if (!data.address || !data.name) {
        return res.status(400).json({ error: 'Missing required fields: address, name' });
      }
      return res.json(analyzeProtocol(data));
    } catch (error) {
      return res.status(500).json({ error: 'Analysis failed', details: String(error) });
    }
  }

  if (pathname === '/agent.json') {
    return res.json({
      name: 'Protocol Risk Oracle',
      description: 'Game-theoretic risk analysis for DeFi protocols',
      version: '0.3.0',
      author: 'unabotter',
      pricing: { model: 'x402', price: x402Config.pricePerAnalysis, currency: 'USDC' },
      endpoints: { analyze: '/api/analyze', demo: '/api/demo', quote: '/api/x402/quote' }
    });
  }

  if (pathname === '/skill.md') {
    try {
      const skillPath = path.join(process.cwd(), 'skill', 'skill.md');
      const content = fs.readFileSync(skillPath, 'utf-8');
      res.setHeader('Content-Type', 'text/markdown');
      return res.send(content);
    } catch {
      return res.status(404).json({ error: 'Skill file not found' });
    }
  }

  if (pathname.startsWith('/docs/')) {
    const filename = pathname.replace('/docs/', '');
    try {
      const docPath = path.join(process.cwd(), 'docs', filename);
      const content = fs.readFileSync(docPath, 'utf-8');
      res.setHeader('Content-Type', 'text/markdown');
      return res.send(content);
    } catch {
      return res.status(404).json({ error: 'Document not found' });
    }
  }

  return res.status(404).json({ error: 'Not found', endpoints: ['/api/health', '/api/demo', '/api/analyze', '/api/x402/quote', '/agent.json', '/skill.md'] });
}
