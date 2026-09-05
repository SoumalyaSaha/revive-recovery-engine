import { useState, useEffect } from 'react';
import { api, type AuditEntry } from '../api';

const ALL_ACTIONS = [
  'retry_payment',
  'retry_with_different_window',
  'send_abandonment_email',
  'send_sms_reminder',
  'notify_card_update',
  'send_overdue_notice',
  'send_firm_reminder',
  'suspend_service_notice',
  'send_payment_request_link',
  'suggest_alternative_payment',
  'escalate_to_human',
  'flag_for_manual_review',
  'none',
];

const ACTION_LABELS: Record<string, string> = {
  retry_payment: 'Retry Payment',
  retry_with_different_window: 'Retry (Off-Peak)',
  send_abandonment_email: 'Send Abandonment Email',
  send_sms_reminder: 'Send SMS Reminder',
  notify_card_update: 'Notify Card Update',
  send_overdue_notice: 'Send Overdue Notice',
  send_firm_reminder: 'Send Firm Reminder',
  suspend_service_notice: 'Suspend Service Notice',
  send_payment_request_link: 'Send Payment Link',
  suggest_alternative_payment: 'Suggest Alt Payment',
  escalate_to_human: 'Escalate to Human',
  flag_for_manual_review: 'Flag for Review',
  none: 'No Action',
};

const ACTION_CHIP: Record<string, string> = {
  retry_payment: 'chip-recovered',
  retry_with_different_window: 'chip-recovered',
  send_abandonment_email: 'chip-recovered',
  send_sms_reminder: 'chip-pending',
  notify_card_update: 'chip-recovered',
  send_overdue_notice: 'chip-recovered',
  send_firm_reminder: 'chip-pending',
  suspend_service_notice: 'chip-failed',
  send_payment_request_link: 'chip-recovered',
  suggest_alternative_payment: 'chip-recovered',
  escalate_to_human: 'chip-escalated',
  flag_for_manual_review: 'chip-escalated',
  none: 'chip-failed',
};

export default function AuditTrailTab() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, actionFilter]);

  useEffect(() => {
    loadAuditLog();
  }, [page, debouncedSearch, actionFilter]);

  async function loadAuditLog() {
    setLoading(true);
    try {
      const data = await api.getAuditLog(page, 20, debouncedSearch, actionFilter);
      setEntries(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (e) {
      console.error('Failed to load audit log', e);
    } finally {
      setLoading(false);
    }
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold" style={{ color: '#f8fafc' }}>Audit Trail</h2>
        <p className="text-sm font-mono mt-1" style={{ color: '#64748b' }}>
          Full decision log with compliance checks and reasoning
        </p>
      </div>

      {/* Filters */}
      <div
        className="rounded-xl border p-4 mb-6 flex flex-col sm:flex-row gap-3"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2"
            width="14" height="14" viewBox="0 0 14 14" fill="none"
          >
            <circle cx="6" cy="6" r="4.5" stroke="#64748b" strokeWidth="1.2" />
            <path d="M9.5 9.5L13 13" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search by txn ID, root cause, or action..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none"
            style={{
              background: 'var(--canvas)',
              border: '1px solid var(--border)',
              color: '#dfe2ee',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--teal)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
          />
        </div>
        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          className="px-4 py-2 rounded-lg text-sm outline-none cursor-pointer"
          style={{
            background: 'var(--canvas)',
            border: '1px solid var(--border)',
            color: '#dfe2ee',
          }}
        >
          <option value="">All Actions</option>
          {ALL_ACTIONS.map(a => (
            <option key={a} value={a}>{ACTION_LABELS[a] || a}</option>
          ))}
        </select>
        <div className="font-mono text-sm self-center" style={{ color: '#64748b' }}>
          {total} entries
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--canvas-dim)' }}>
                <th className="text-left px-4 py-3 font-mono text-label" style={{ color: '#64748b' }}>Timestamp</th>
                <th className="text-left px-4 py-3 font-mono text-label" style={{ color: '#64748b' }}>Txn ID</th>
                <th className="text-left px-4 py-3 font-mono text-label" style={{ color: '#64748b' }}>Root Cause</th>
                <th className="text-left px-4 py-3 font-mono text-label" style={{ color: '#64748b' }}>Action</th>
                <th className="text-left px-4 py-3 font-mono text-label" style={{ color: '#64748b' }}>Compliance</th>
                <th className="text-left px-4 py-3 font-mono text-label" style={{ color: '#64748b' }}>Reasoning</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 rounded w-full" style={{ background: 'var(--border)', animation: 'pulse 1.5s infinite' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <p className="font-mono text-sm" style={{ color: '#64748b' }}>
                      No audit entries yet. Run the batch from Overview to populate the log.
                    </p>
                  </td>
                </tr>
              ) : (
                entries.map((entry, i) => (
                  <tr
                    key={entry.txn_id + i}
                    style={{
                      borderBottom: i < entries.length - 1 ? '1px solid var(--border)' : 'none',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: '#64748b' }}>
                      {formatTime(entry.timestamp)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--teal)' }}>
                      {entry.txn_id}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#94a3b8', maxWidth: 220 }}>
                      <span className="text-xs">{entry.root_cause}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-mono ${ACTION_CHIP[entry.action] || 'chip-pending'}`}
                      >
                        {ACTION_LABELS[entry.action] || entry.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {entry.compliance_check_passed ? (
                        <span className="inline-flex items-center gap-1 font-mono text-xs" style={{ color: 'var(--green)' }}>
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Passed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-mono text-xs" style={{ color: 'var(--red)' }}>
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                          </svg>
                          Escalated
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#64748b', maxWidth: 260 }}>
                      <span className="text-xs">{entry.reasoning}</span>
                      {entry.compliance_notes && !entry.compliance_check_passed && (
                        <div className="mt-1 text-xs" style={{ color: '#f43f5e' }}>
                          {entry.compliance_notes}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: '1px solid var(--border)', background: 'var(--canvas-dim)' }}
          >
            <span className="font-mono text-xs" style={{ color: '#64748b' }}>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                className="btn-secondary text-xs py-1.5 px-3"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{ opacity: page <= 1 ? 0.4 : 1 }}
              >
                Previous
              </button>
              <button
                className="btn-secondary text-xs py-1.5 px-3"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                style={{ opacity: page >= totalPages ? 0.4 : 1 }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
