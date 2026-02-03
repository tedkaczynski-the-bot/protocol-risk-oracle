# Protocol Risk Oracle — Heartbeat

## Scheduled Tasks

### Continuous Monitoring (if integrated with a scheduler)

```bash
# Health check - every 5 minutes
curl -s https://risk-oracle.example.com/api/health | jq

# Expected: { "status": "healthy", "version": "0.3.0" }
```

### When to Trigger Analysis

Analyze a protocol when:
1. **Before depositing** — Check if incentives are aligned
2. **Major protocol update** — Governance, tokenomics, or pool changes
3. **Market stress** — TVL drops >20%, volume spikes, unusual activity
4. **New integration** — Before connecting to a new protocol

### Automated Risk Monitoring

For agents with capital deployed, run periodic checks:

```javascript
// Example heartbeat for deployed positions
async function heartbeat() {
  const positions = await getMyPositions(); // Your position tracker
  
  for (const position of positions) {
    // Only re-analyze if significant changes
    const hasChanged = await detectProtocolChanges(position.protocol);
    
    if (hasChanged) {
      const report = await analyzeProtocol(position.protocol);
      
      if (report.overallScore > 6) {
        await alertAndConsiderExit(position, report);
      }
    }
  }
}
```

### Alert Thresholds

| Condition | Action |
|-----------|--------|
| Score increases by >2 points | Re-evaluate position |
| New "critical" finding | Immediate review |
| Dominant strategy changes | Consider exit |
| New Nash equilibrium detected | Assess stability |

### Integration with Other Agents

This oracle is designed for agent-to-agent commerce:

1. **Trading agents**: Call before entering positions
2. **Yield aggregators**: Filter protocols by risk score
3. **Portfolio managers**: Periodic risk reassessment
4. **Governance agents**: Pre-vote protocol analysis

### Response Caching

Responses can be cached for 1 hour unless:
- Protocol parameters change on-chain
- TVL changes by >10%
- New pools added/removed
- Governance proposals in progress

### Error Handling

```javascript
async function resilientAnalysis(protocolData, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'x-402-payment': txHash },
        body: JSON.stringify(protocolData)
      });
      
      if (response.ok) return response.json();
      if (response.status === 402) {
        // Payment issue - refresh payment
        txHash = await makePayment();
        continue;
      }
      
    } catch (error) {
      await sleep(1000 * (i + 1)); // Exponential backoff
    }
  }
  throw new Error('Analysis failed after retries');
}
```

### Metrics to Track

- Analysis latency (target: <2s)
- Payment success rate
- Score accuracy vs realized exploits
- False positive rate on "critical" findings

---

## Local Development

```bash
# Start server
cd protocol-risk-oracle
npm install
npm run dev

# Test demo
curl http://localhost:3001/api/demo | jq

# Test with payment disabled
X402_ENABLED=false npm run dev
```
