"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GovernanceAnalyzer = void 0;
/**
 * Governance Risk Analyzer
 *
 * Identifies governance attack vectors:
 * - Vote buying and bribery economics
 * - Quorum manipulation
 * - Timelock bypass scenarios
 * - Proposal spam attacks
 * - Voter apathy exploitation
 */
class GovernanceAnalyzer {
    analyze(protocol) {
        const findings = [];
        let totalScore = 0;
        if (!protocol.governance) {
            return {
                name: 'Governance Risk',
                score: 0,
                severity: 'low',
                findings: [{
                        title: 'No Governance Data Available',
                        description: 'Unable to analyze governance structure. Manual review recommended.',
                        confidence: 0.3
                    }]
            };
        }
        const gov = protocol.governance;
        // Check quorum vulnerability
        if (gov.quorum < 0.04) { // Less than 4%
            findings.push({
                title: 'Critically Low Quorum Threshold',
                description: `Quorum of ${(gov.quorum * 100).toFixed(1)}% allows proposals to pass with minimal participation.`,
                attackVector: 'Attacker can pass malicious proposals during low-activity periods. Flash loan governance attacks become viable.',
                mitigation: 'Implement minimum participation thresholds, time-weighted voting, or conviction voting.',
                confidence: 0.9
            });
            totalScore += 8;
        }
        else if (gov.quorum < 0.1) {
            findings.push({
                title: 'Low Quorum Threshold',
                description: `Quorum of ${(gov.quorum * 100).toFixed(1)}% may be achievable by coordinated minority.`,
                attackVector: 'Well-funded attacker could accumulate enough tokens to single-handedly meet quorum.',
                confidence: 0.7
            });
            totalScore += 4;
        }
        // Check timelock
        if (gov.timelockDelay < 24 * 3600) { // Less than 24 hours
            findings.push({
                title: 'Short Timelock Delay',
                description: `Timelock of ${Math.floor(gov.timelockDelay / 3600)} hours gives users limited time to exit before malicious proposals execute.`,
                attackVector: 'Users may not have time to withdraw funds before a passed malicious proposal takes effect.',
                mitigation: 'Extend timelock to 48-72 hours minimum. Consider rage-quit mechanisms.',
                confidence: 0.85
            });
            totalScore += 6;
        }
        // Check voting power concentration
        if (gov.topHolderVotingPower > 0.5) {
            findings.push({
                title: 'Majority Voting Power Concentration',
                description: `Top holder(s) control ${(gov.topHolderVotingPower * 100).toFixed(0)}% of voting power.`,
                attackVector: 'Single entity can pass any proposal unilaterally. Governance is effectively centralized.',
                mitigation: 'Implement quadratic voting, delegation caps, or veto mechanisms for minority protection.',
                confidence: 0.95
            });
            totalScore += 9;
        }
        else if (gov.topHolderVotingPower > 0.33) {
            findings.push({
                title: 'High Voting Power Concentration',
                description: `Top holder(s) control ${(gov.topHolderVotingPower * 100).toFixed(0)}% of voting power — enough to block proposals.`,
                attackVector: 'Minority veto power can be used to extract rent or block beneficial upgrades.',
                confidence: 0.8
            });
            totalScore += 5;
        }
        // Check proposal threshold
        if (gov.proposalThreshold > 0.05) {
            findings.push({
                title: 'High Proposal Threshold',
                description: `Proposal threshold of ${(gov.proposalThreshold * 100).toFixed(1)}% excludes most token holders from proposing.`,
                attackVector: 'Governance capture: only large holders can propose, leading to plutocratic outcomes.',
                mitigation: 'Lower threshold or implement delegated proposal rights.',
                confidence: 0.6
            });
            totalScore += 3;
        }
        const avgScore = findings.length > 0 ? totalScore / findings.length : 0;
        return {
            name: 'Governance Risk',
            score: Math.min(10, avgScore),
            severity: this.scoreSeverity(avgScore),
            findings
        };
    }
    scoreSeverity(score) {
        if (score >= 8)
            return 'critical';
        if (score >= 6)
            return 'high';
        if (score >= 3)
            return 'medium';
        return 'low';
    }
}
exports.GovernanceAnalyzer = GovernanceAnalyzer;
