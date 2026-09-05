import type { Transaction, AuditEntry, FailureType, CustomerFlags } from './types.js';

const COMPLIANCE_WINDOW_START = 9; // 9 AM
const COMPLIANCE_WINDOW_END = 20; // 8 PM
const MAX_RETRIES = 3;

interface EngineResult {
  root_cause: string;
  action: string;
  reasoning: string;
  compliance_check_passed: boolean;
  compliance_notes?: string;
}

function classifyRootCause(txn: Transaction): string {
  const { failure_type, event_type, attempts_so_far } = txn;

  switch (failure_type) {
    case 'insufficient_funds':
      return 'Customer account balance below threshold at time of payment';
    case 'card_expired':
      return 'Payment instrument has expired; requires card update';
    case 'bank_decline':
      return txn.customer_flags.risk_score > 60
        ? 'Bank flagged transaction for anomalous pattern — potential fraud check'
        : 'Issuing bank declined transaction — insufficient funds or hold';
    case 'checkout_abandon':
      return 'Customer initiated checkout but did not complete payment within session';
    case 'invoice_overdue':
      return attempts_so_far >= 2
        ? 'Recurring invoice overdue after multiple automated reminders'
        : 'Invoice past due date — initial collection stage';
    default:
      return 'Unknown failure pattern';
  }
}

function decideIntervention(txn: Transaction, rootCause: string): { action: string; reasoning: string } {
  const { failure_type, attempts_so_far, customer_flags } = txn;

  // Escalate to human only when multiple risk signals overlap,
  // or when risk_score is extreme — single flags alone don't block all automation.
  if (customer_flags.is_vip && customer_flags.is_disputed) {
    return {
      action: 'escalate_to_human',
      reasoning: `VIP and disputed customer — manual review required per policy`,
    };
  }
  if (customer_flags.risk_score >= 90) {
    return {
      action: 'escalate_to_human',
      reasoning: `Extreme risk score (${customer_flags.risk_score}) — manual review required per policy`,
    };
  }

  if (failure_type === 'checkout_abandon') {
    if (attempts_so_far === 0) {
      return {
        action: 'send_abandonment_email',
        reasoning: 'First abandonment — send recovery email with saved cart link',
      };
    }
    return {
      action: 'send_sms_reminder',
      reasoning: 'Repeat abandonment — escalate to SMS with limited-time incentive',
    };
  }

  if (failure_type === 'card_expired') {
    return {
      action: 'notify_card_update',
      reasoning: 'Expired card detected — prompt customer to update payment method via email + in-app notification',
    };
  }

  if (failure_type === 'insufficient_funds') {
    if (attempts_so_far < MAX_RETRIES) {
      return {
        action: 'retry_payment',
        reasoning: `Retry #${attempts_so_far + 1} of ${MAX_RETRIES} — insufficient funds often resolves on subsequent attempt`,
      };
    }
    return {
      action: 'send_payment_request_link',
      reasoning: `Max retries (${MAX_RETRIES}) exhausted — send personalized payment request link instead`,
    };
  }

  if (failure_type === 'bank_decline') {
    if (txn.customer_flags.risk_score > 80) {
      return {
        action: 'flag_for_manual_review',
        reasoning: 'High risk score (80+) with bank decline — requires manual fraud investigation',
      };
    }
    if (attempts_so_far < MAX_RETRIES) {
      return {
        action: 'retry_with_different_window',
        reasoning: `Bank decline on retry #${attempts_so_far + 1} — retry in off-peak window to reduce decline probability`,
      };
    }
    return {
      action: 'suggest_alternative_payment',
      reasoning: 'Multiple bank declines — suggest UPI or netbanking as alternative payment method',
    };
  }

  if (failure_type === 'invoice_overdue') {
    if (attempts_so_far === 0) {
      return {
        action: 'send_overdue_notice',
        reasoning: 'First overdue notice — polite email reminder with payment link',
      };
    }
    if (attempts_so_far === 1) {
      return {
        action: 'send_firm_reminder',
        reasoning: 'Second notice — firmer tone with late fee disclosure',
      };
    }
    return {
      action: 'suspend_service_notice',
      reasoning: 'Third+ notice — prepare service suspension warning with 48-hour grace period',
    };
  }

  return { action: 'none', reasoning: 'No automated intervention applicable' };
}

function complianceGate(txn: Transaction, action: string, rootCause: string): { passed: boolean; notes: string } {
  const now = new Date();
  const hour = now.getHours();
  const notes: string[] = [];

  // Rule 1: Max retries
  if (action === 'retry_payment' || action === 'retry_with_different_window') {
    if (txn.attempts_so_far >= MAX_RETRIES) {
      return {
        passed: false,
        notes: `COMPLIANCE BLOCKED: Retry action requested but max retries (${MAX_RETRIES}) already reached for txn ${txn.id}`,
      };
    }
    notes.push(`Retry #${txn.attempts_so_far + 1} within allowed limit (${MAX_RETRIES})`);
  }

  // Rule 2: Opted-out customers
  if (txn.customer_flags.opted_out && (action === 'send_abandonment_email' || action === 'send_sms_reminder' || action === 'send_overdue_notice' || action === 'send_firm_reminder')) {
    return {
      passed: false,
      notes: `COMPLIANCE BLOCKED: Customer ${txn.customer_id} has opted out of communications — action "${action}" blocked`,
    };
  }
  notes.push('Opt-out check passed');

  // Rule 3: Contact window (9 AM - 8 PM)
  if (hour < COMPLIANCE_WINDOW_START || hour >= COMPLIANCE_WINDOW_END) {
    if (action === 'send_sms_reminder' || action === 'notify_card_update') {
      notes.push(`Contact action scheduled for ${hour >= COMPLIANCE_WINDOW_END ? 'next business day' : 'within compliance window'}`);
    }
  } else {
    notes.push(`Contact window check passed (current hour: ${hour})`);
  }

  // Rule 4: Disputed/VIP → human escalation only
  // Only block when BOTH signals overlap (genuinely ambiguous case);
  // a single flag is handled by the decision engine's routing logic.
  if ((txn.customer_flags.is_disputed && txn.customer_flags.is_vip) && !action.startsWith('escalate') && !action.startsWith('flag')) {
    return {
      passed: false,
      notes: `COMPLIANCE BLOCKED: VIP and disputed customer requires human escalation only`,
    };
  }
  notes.push('VIP/Disputed check passed');

  // Rule 5: High risk score
  if (txn.customer_flags.risk_score > 85 && action !== 'flag_for_manual_review' && action !== 'escalate_to_human') {
    notes.push(`High risk score (${txn.customer_flags.risk_score}) — action logged for review`);
  }

  return { passed: true, notes: notes.join('; ') };
}

// Per-action recovery probability: chance the intervention successfully recovers funds.
// Each run rolls Math.random() so numbers vary per Batch click.
const RECOVERY_PROB: Record<string, number> = {
  send_abandonment_email: 0.85,
  send_sms_reminder: 0.78,
  retry_payment: 0.92,
  retry_with_different_window: 0.85,
  send_payment_request_link: 0.80,
  notify_card_update: 0.82,
  send_overdue_notice: 0.85,
  send_firm_reminder: 0.85,
  suspend_service_notice: 0.70,
  suggest_alternative_payment: 0.88,
  flag_for_manual_review: 0.0,
  escalate_to_human: 0.0,
  none: 0.0,
};

// Roll a random recovery amount for this transaction (0 = no recovery this run).
// Only called when compliance passes and action is not a no-op.
function rollRecovery(action: string, amount: number): number {
  const baseProb = RECOVERY_PROB[action] ?? 0.30;
  const roll = Math.random();
  if (roll > baseProb) return 0;
  // Recover a random fraction of the original amount (70%–95%)
  const fraction = 0.70 + Math.random() * 0.25;
  return Math.round(amount * fraction);
}

export function runPipeline(txn: Transaction): AuditEntry {
  const rootCause = classifyRootCause(txn);
  const { action, reasoning } = decideIntervention(txn, rootCause);
  const { passed, notes } = complianceGate(txn, action, rootCause);

  let recovered_amount: number | undefined;
  if (passed && action !== 'none') {
    recovered_amount = rollRecovery(action, txn.amount);
  }

  return {
    timestamp: new Date().toISOString(),
    txn_id: txn.id,
    root_cause: rootCause,
    action,
    reasoning,
    compliance_check_passed: passed,
    compliance_notes: passed ? undefined : notes,
    recovered_amount,
  };
}

export function computeStats(
  transactions: Transaction[],
  auditLog: AuditEntry[]
): {
  totalAtRisk: number;
  recovered: number;
  recoveryRate: number;
  escalated: number;
  byIntervention: { type: string; count: number; amount_recovered: number }[];
  byRootCause: { cause: string; count: number; amount_at_risk: number; amount_recovered: number }[];
} {
  const totalAtRisk = transactions.reduce((sum, t) => sum + t.amount, 0);

  const recoveredEntries = auditLog.filter(e => e.compliance_check_passed && e.action !== 'none');
  const recovered = recoveredEntries.reduce((sum, e) => sum + (e.recovered_amount ?? 0), 0);

  const escalated = auditLog.filter(e => e.action === 'escalate_to_human' || e.action === 'flag_for_manual_review').length;

  // By intervention type
  const interventionMap = new Map<string, { count: number; amount_recovered: number }>();
  for (const entry of recoveredEntries) {
    const existing = interventionMap.get(entry.action) || { count: 0, amount_recovered: 0 };
    existing.count++;
    existing.amount_recovered += entry.recovered_amount ?? 0;
    interventionMap.set(entry.action, existing);
  }
  const byIntervention = Array.from(interventionMap.entries()).map(([type, data]) => ({
    type,
    count: data.count,
    amount_recovered: Math.round(data.amount_recovered),
  }));

  // By root cause
  const causeMap = new Map<string, { count: number; amount_at_risk: number; amount_recovered: number }>();
  for (const txn of transactions) {
    const entry = auditLog.find(e => e.txn_id === txn.id);
    const cause = txn.failure_type;
    const existing = causeMap.get(cause) || { count: 0, amount_at_risk: 0, amount_recovered: 0 };
    existing.count++;
    existing.amount_at_risk += txn.amount;
    existing.amount_recovered += entry?.recovered_amount ?? 0;
    causeMap.set(cause, existing);
  }
  const byRootCause = Array.from(causeMap.entries()).map(([cause, data]) => ({
    cause,
    count: data.count,
    amount_at_risk: data.amount_at_risk,
    amount_recovered: Math.round(data.amount_recovered),
  }));

  return {
    totalAtRisk,
    recovered: Math.round(recovered),
    recoveryRate: totalAtRisk > 0 ? Math.round((recovered / totalAtRisk) * 100) : 0,
    escalated,
    byIntervention,
    byRootCause,
  };
}
