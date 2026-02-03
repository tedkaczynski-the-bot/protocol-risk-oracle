#!/usr/bin/env ts-node
import { EconomicAnalyzer } from './analyzers/economic';
import { GovernanceAnalyzer } from './analyzers/governance';
import { MEVAnalyzer } from './analyzers/mev';
import { LiquidityAnalyzer } from './analyzers/liquidity';
import { HeliusProvider } from './data/helius';
import { ProtocolData, ProtocolRiskReport, RiskCategory } from './types/risk';

const economicAnalyzer = new EconomicAnalyzer();
const governanceAnalyzer = new GovernanceAnalyzer();
const mevAnalyzer = new MEVAnalyzer();
const liquidityAnalyzer = new LiquidityAnalyzer();
const helius = new HeliusProvider();

function printSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    critical: '\x1b[31m', // red
    high: '\x1b[33m',     // yellow
    medium: '\x1b[36m',   // cyan
    low: '\x1b[32m'       // green
  };
  return colors[severity] || '\x1b[0m';
}

function printReport(report: ProtocolRiskReport) {
  const reset = '\x1b[0m';
  const bold = '\x1b[1m';
  
  console.log('\n' + '='.repeat(60));
  console.log(`${bold}PROTOCOL RISK REPORT: ${report.protocol}${reset}`);
  console.log('='.repeat(60));
  console.log(`Address: ${report.address}`);
  console.log(`Timestamp: ${new Date(report.timestamp).toISOString()}`);
  console.log();
  
  const severityColor = printSeverityColor(report.overallSeverity);
  console.log(`${bold}Overall Risk Score: ${severityColor}${report.overallScore}/10 (${report.overallSeverity.toUpperCase()})${reset}`);
  console.log();
  
  console.log(`${bold}SUMMARY${reset}`);
  console.log(report.summary);
  console.log();

  if (report.recommendations.length > 0) {
    console.log(`${bold}TOP RECOMMENDATIONS${reset}`);
    report.recommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`);
    });
    console.log();
  }

  console.log(`${bold}CATEGORY BREAKDOWN${reset}`);
  for (const [key, category] of Object.entries(report.categories)) {
    const cat = category as RiskCategory;
    const catColor = printSeverityColor(cat.severity);
    console.log(`\n  ${bold}${cat.name}${reset}: ${catColor}${cat.score.toFixed(1)}/10 (${cat.severity})${reset}`);
    
    if (cat.findings.length > 0) {
      for (const finding of cat.findings) {
        console.log(`    • ${finding.title}`);
        if (finding.attackVector) {
          console.log(`      Attack: ${finding.attackVector.slice(0, 100)}...`);
        }
      }
    }
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
}

async function analyzeToken(mintAddress: string) {
  console.log(`\nFetching data for token: ${mintAddress}...`);
  
  // Fetch real data from Helius
  const tokenInfo = await helius.getTokenInfo(mintAddress);
  const holders = await helius.getTopTokenHolders(mintAddress, 20);
  
  if (!tokenInfo) {
    console.log('Could not fetch token info. Using demo data...');
    return runDemo();
  }

  const gini = holders.length > 0 ? helius.calculateGiniCoefficient(holders) : 0.5;
  const topHolderPct = holders.length > 0 ? holders[0].percentage / 100 : 0;

  const protocolData: ProtocolData = {
    address: mintAddress,
    name: tokenInfo.name,
    tokenomics: {
      totalSupply: tokenInfo.supply,
      circulatingSupply: tokenInfo.supply * 0.5, // Estimate
      concentration: gini
    },
    governance: {
      quorum: 0.05,
      votingPeriod: 3 * 24 * 3600,
      timelockDelay: 24 * 3600,
      proposalThreshold: 0.01,
      topHolderVotingPower: topHolderPct
    },
    pools: [] // Would need Jupiter/Raydium integration for real pool data
  };

  const report = generateReport(protocolData);
  printReport(report);
}

function generateReport(data: ProtocolData): ProtocolRiskReport {
  const economic = economicAnalyzer.analyze(data);
  const governance = governanceAnalyzer.analyze(data);
  const mev = mevAnalyzer.analyze(data);
  const liquidity = liquidityAnalyzer.analyze(data);
  const composability = { name: 'Composability Risk', score: 0, severity: 'low' as const, findings: [] };

  const categories = { economic, governance, liquidity, composability, mev };
  
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
    recommendations: criticalFindings.slice(0, 3).map(f => f.mitigation || f.title).filter(Boolean)
  };
}

function runDemo() {
  console.log('\nRunning demo analysis on sample risky protocol...\n');
  
  const sampleProtocol: ProtocolData = {
    address: 'DemoProtocol111111111111111111111111111111111',
    name: 'Risky DeFi Protocol (Demo)',
    tvl: 50000000,
    tokenomics: {
      totalSupply: 1000000000,
      circulatingSupply: 250000000,
      emissionRate: 100000,
      concentration: 0.75
    },
    governance: {
      quorum: 0.03,
      votingPeriod: 3 * 24 * 3600,
      timelockDelay: 12 * 3600,
      proposalThreshold: 0.01,
      topHolderVotingPower: 0.45
    },
    pools: [
      { address: 'pool1', token0: 'SOL', token1: 'DEMO', liquidity: 50000, volume24h: 45000, fees: 0.003 },
      { address: 'pool2', token0: 'USDC', token1: 'DEMO', liquidity: 200000, volume24h: 150000, fees: 0.001 }
    ]
  };

  const report = generateReport(sampleProtocol);
  printReport(report);
}

// Main
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--demo') {
  runDemo();
} else if (args[0] === '--help') {
  console.log(`
Protocol Risk Oracle CLI

Usage:
  npx ts-node src/cli.ts [options]

Options:
  --demo              Run demo analysis on sample protocol
  --token <address>   Analyze a specific Solana token
  --help              Show this help message

Examples:
  npx ts-node src/cli.ts --demo
  npx ts-node src/cli.ts --token EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
  
Environment:
  HELIUS_API_KEY      Required for real token analysis
`);
} else if (args[0] === '--token' && args[1]) {
  analyzeToken(args[1]).catch(console.error);
} else {
  console.log('Unknown command. Use --help for usage.');
}
