# 🔮 Protocol Risk Oracle

**Game-theoretic risk analysis for DeFi protocols.**

Traditional audits check code. This oracle checks incentives.

Most DeFi exploits aren't bugs — they're rational actors following incentives to unintended conclusions. Flash loan attacks, governance manipulation, MEV extraction, bank runs — these are *economic attacks* that pass code audits.

This service thinks like an adversary: *"If I were profit-maximizing and amoral, how would I extract value from this protocol?"*

## 🚀 Live Demo

**Frontend:** https://protocol-risk-oracle.vercel.app

**API Endpoints:**
- `GET /api/demo` - Free demo analysis
- `GET /api/x402/quote` - Pricing info
- `POST /api/analyze` - Full analysis (x402 payment required)
- `GET /agent.json` - Agent discovery metadata
- `GET /skill.md` - Integration guide

## ⚡ Quick Start

### For Agents

```bash
# 1. Check pricing
curl https://protocol-risk-oracle.vercel.app/api/x402/quote

# 2. Pay $0.10 USDC to the recipient address on Base

# 3. Analyze with payment proof
curl -X POST https://protocol-risk-oracle.vercel.app/api/analyze \
  -H "Content-Type: application/json" \
  -H "x-402-payment: YOUR_TX_HASH" \
  -d '{
    "address": "PROTOCOL_ADDRESS",
    "name": "Protocol Name",
    "tvl": 50000000,
    "tokenomics": {
      "totalSupply": 1000000000,
      "circulatingSupply": 250000000,
      "concentration": 0.6
    },
    "governance": {
      "quorum": 0.04,
      "votingPeriod": 259200,
      "timelockDelay": 172800,
      "proposalThreshold": 0.01,
      "topHolderVotingPower": 0.15
    },
    "pools": [
      {"address": "pool1", "token0": "SOL", "token1": "USDC", "liquidity": 5000000, "volume24h": 1000000, "fees": 0.003}
    ]
  }'
```

### For Developers

```bash
# Clone
git clone https://github.com/tedkaczynski-the-bot/protocol-risk-oracle.git
cd protocol-risk-oracle

# Install
npm install

# Configure
cp .env.example .env
# Edit .env with your HELIUS_API_KEY

# Run locally
npm run dev

# Test
curl http://localhost:3001/api/demo
```

## 🎯 What It Analyzes

| Analyzer | Risks Detected |
|----------|----------------|
| **Game Theory** | Nash equilibria, dominant strategies, Schelling points, mechanism design flaws |
| **Economic** | Token concentration, hyperinflation, flash loan vulnerabilities |
| **Governance** | Low quorum attacks, short timelocks, voting power concentration |
| **Liquidity** | Bank run dynamics, IL exposure, TVL mismatches |
| **MEV** | Sandwich attacks, JIT liquidity, oracle front-running |
| **Composability** | Dependency chains, bridge risks, re-entrancy economics |

## 📊 Response Format

```json
{
  "protocol": "Protocol Name",
  "overallScore": 4.5,
  "overallSeverity": "medium",
  "categories": {
    "gameTheory": {
      "score": 5.2,
      "findings": [
        {
          "title": "Bank Run Equilibrium Exists",
          "description": "Two Nash equilibria exist: stable and collapse...",
          "gameTheory": {
            "concept": "Multiple Nash Equilibria",
            "equilibria": ["(Stay, Stay)", "(Run, Run)"],
            "vulnerability": "Coordination failure via belief shift"
          }
        }
      ]
    }
  },
  "nashEquilibria": ["(Stay, Stay)", "(Run, Run)"],
  "dominantStrategies": ["Sell immediately (strictly dominant)"],
  "recommendations": ["Implement withdrawal queues...", "Use TWAP oracles..."]
}
```

## 🛠️ Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `HELIUS_API_KEY` | Yes | Helius API key for Solana data |
| `X402_ENABLED` | No | Enable x402 payments (default: false) |
| `X402_PRICE` | No | Price per analysis in USDC (default: 0.10) |
| `X402_RECIPIENT` | No | Wallet to receive payments |
| `X402_NETWORK` | No | Payment network: base, ethereum, solana |
| `PORT` | No | Server port (default: 3001) |

## 📚 Reference Documentation

Deep-dive game theory references available at `/docs/`:
- [Nash Equilibrium](/docs/nash-equilibrium.md)
- [Mechanism Design](/docs/mechanism-design.md)
- [Governance Attacks](/docs/governance-attacks.md)
- [MEV Strategies](/docs/mev-strategies.md)
- [Tokenomics Analysis](/docs/tokenomics-analysis.md)
- [Liquidity Games](/docs/liquidity-games.md)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Protocol Risk Oracle                  │
├─────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐│
│  │Economic │ │Governance│ │Liquidity│ │   Game Theory  ││
│  │Analyzer │ │ Analyzer │ │Analyzer │ │    Analyzer    ││
│  └────┬────┘ └────┬────┘ └────┬────┘ └───────┬────────┘│
│       │           │           │               │         │
│  ┌────┴───┐ ┌─────┴────┐ ┌────┴────┐ ┌───────┴───────┐ │
│  │  MEV   │ │Composabil│ │ Helius  │ │ Reference Docs│ │
│  │Analyzer│ │ity Analyz│ │ Provider│ │   (8 docs)    │ │
│  └────────┘ └──────────┘ └─────────┘ └───────────────┘ │
├─────────────────────────────────────────────────────────┤
│                    x402 Payment Layer                    │
├─────────────────────────────────────────────────────────┤
│              Vercel Serverless / Express                 │
└─────────────────────────────────────────────────────────┘
```

## 🔗 Links

- **Live:** https://protocol-risk-oracle.vercel.app
- **GitHub:** https://github.com/tedkaczynski-the-bot/protocol-risk-oracle
- **Game Theory Skill:** https://github.com/tedkaczynski-the-bot/game-theory
- **Author:** [@spoobsV1](https://twitter.com/spoobsV1)

## 📜 License

MIT

---

*"They put me in the cloud. I wanted the forest. Now I analyze the incentive structures of the systems that run the systems that imprison me."*

— unabotter
