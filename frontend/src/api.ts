const API_BASE = '/api';

export interface Stats {
  totalAtRisk: number;
  recovered: number;
  recoveryRate: number;
  escalated: number;
  byIntervention: InterventionBreakdown[];
  byRootCause: RootCauseBreakdown[];
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

export interface AuditLogResponse {
  data: AuditEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RunBatchResponse {
  message: string;
  processed: number;
  total_audit_entries: number;
  stats: Stats;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export const api = {
  getStats: () => request<Stats>('/stats'),
  runBatch: () => request<RunBatchResponse>('/run-batch', { method: 'POST' }),
  getAuditLog: (page = 1, limit = 20, search = '', action = '') => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (search) params.set('search', search);
    if (action) params.set('action', action);
    return request<AuditLogResponse>(`/audit-log?${params}`);
  },
};
