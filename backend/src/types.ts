export interface Transaction {
  id: string;
  customer_id: string;
  amount: number;
  failure_type: FailureType;
  event_type: EventType;
  attempts_so_far: number;
  customer_flags: CustomerFlags;
  timestamp: string;
}

export type FailureType =
  | 'insufficient_funds'
  | 'card_expired'
  | 'bank_decline'
  | 'checkout_abandon'
  | 'invoice_overdue';

export type EventType =
  | 'payment_failed'
  | 'subscription_retry'
  | 'invoice_reminder'
  | 'checkout_abandoned';

export interface CustomerFlags {
  opted_out: boolean;
  is_vip: boolean;
  is_disputed: boolean;
  risk_score: number; // 0-100
}

export interface AuditEntry {
  timestamp: string;
  txn_id: string;
  root_cause: string;
  action: string;
  reasoning: string;
  compliance_check_passed: boolean;
  compliance_notes?: string;
  recovered_amount?: number;
}

export interface RecoveryStats {
  total_at_risk: number;
  recovered: number;
  recovery_rate: number;
  escalated: number;
  by_intervention: InterventionBreakdown;
  by_root_cause: RootCauseBreakdown;
}

export interface InterventionBreakdown {
  type: string;
  count: number;
  amount_recovered: number;
}

export interface RootCauseBreakdown {
  cause: string;
  count: number;
  amount_at_risk: number;
  amount_recovered: number;
}
