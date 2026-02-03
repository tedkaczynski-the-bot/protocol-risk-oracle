# Protocol Risk Oracle — Heartbeat

Periodic risk monitoring checklist for agents managing DeFi positions.

## When to Run

- Every 4-6 hours if you have active DeFi positions
- Before any deposit/withdrawal over $1000
- After major market moves (>10% price change)
- When governance proposals are active

## Checklist

### 1. Check Service Health

```bash
curl -s https://risk-oracle.example.com/api/health | jq '.status'
```

Expected: `"healthy"`

### 2. Re-analyze Active Positions

For each protocol where you have funds deposited:

```bash
curl -X POST https://risk-oracle.example.com/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"address": "YOUR_PROTOCOL", "name": "Protocol Name", ...}'
```

**Action thresholds:**
- Score increased by >2 points → Review position, consider reducing
- Score crossed into "high" (6+) → Alert human, prepare exit
- Score crossed into "critical" (8+) → Exit immediately if possible

### 3. Monitor Governance

If any analyzed protocol has active governance proposals:
- Check if quorum is approaching
- Check timelock status on passed proposals
- Alert human if malicious proposals detected

### 4. Track Market Conditions

Major market moves can shift risk profiles:
- Large price swings affect IL calculations
- Liquidity often exits during volatility
- MEV activity increases during high-volume periods

## State Tracking

Track risk scores over time in your memory:

```json
{
  "riskOracle": {
    "lastCheck": "2026-02-03T02:00:00Z",
    "positions": {
      "ProtocolA": { "score": 3.2, "trend": "stable" },
      "ProtocolB": { "score": 5.8, "trend": "increasing" }
    }
  }
}
```

## Alert Triggers

Notify your human when:

1. **Risk score jumps** — Any position increases >2 points
2. **New critical finding** — High-confidence attack vector discovered
3. **Governance attack** — Suspicious proposal approaching quorum
4. **Liquidity crisis** — TVL drops >20% in 24h
5. **Oracle issues** — Price feed staleness or manipulation detected

## Example Heartbeat Integration

```javascript
async function riskOracleHeartbeat(positions) {
  const alerts = [];
  
  for (const pos of positions) {
    const report = await analyzeProtocol(pos);
    
    // Compare to previous score
    const prevScore = memory.riskOracle?.positions?.[pos.name]?.score || 0;
    const scoreDelta = report.overallScore - prevScore;
    
    if (scoreDelta > 2) {
      alerts.push(`⚠️ ${pos.name} risk increased: ${prevScore} → ${report.overallScore}`);
    }
    
    if (report.overallSeverity === 'critical') {
      alerts.push(`🚨 CRITICAL: ${pos.name} has active exploit risk!`);
    }
    
    // Update memory
    memory.riskOracle.positions[pos.name] = {
      score: report.overallScore,
      trend: scoreDelta > 0.5 ? 'increasing' : scoreDelta < -0.5 ? 'decreasing' : 'stable',
      lastCheck: new Date().toISOString()
    };
  }
  
  return alerts;
}
```

## Frequency Guidelines

| Position Size | Check Frequency |
|---------------|-----------------|
| < $1,000 | Daily |
| $1,000 - $10,000 | Every 6 hours |
| $10,000 - $100,000 | Every 2 hours |
| > $100,000 | Hourly + real-time governance monitoring |

## Questions?

GitHub: https://github.com/tedkaczynski-the-bot/protocol-risk-oracle
Built by: unabotter
