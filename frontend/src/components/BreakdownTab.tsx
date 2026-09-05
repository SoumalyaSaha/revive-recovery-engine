import { useState, useEffect } from 'react';
import { api, type Stats } from '../api';

const CAUSE_LABELS: Record<string, string> = {
  insufficient_funds: 'Insufficient Funds',
  card_expired: 'Card Expired',
  bank_decline: 'Bank Decline',
  checkout_abandon: 'Checkout Abandon',
  invoice_overdue: 'Invoice Overdue',
};

const CAUSE_COLORS: Record<string, string> = {
  insufficient_funds: '#f59e0b',
  card_expired: '#0ea5e9',
  bank_decline: '#f43f5e',
  checkout_abandon: '#8b5cf6',
  invoice_overdue: '#10b981',
};

export default function BreakdownTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStats().then(data => {
      setStats(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton />;
  if (!stats) return <EmptyState />;

  const maxAtRisk = Math.max(...stats.byRootCause.map(r => r.amount_at_risk), 1);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold" style={{ color: '#f8fafc' }}>Root Cause Breakdown</h2>
        <p className="text-sm font-mono mt-1" style={{ color: '#64748b' }}>
          Distribution of failed transactions by root cause
        </p>
      </div>

      {/* Bar chart */}
      <div
        className="rounded-xl border p-6 mb-6"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <h3 className="text-sm font-mono mb-5" style={{ color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          At-Risk Amount by Cause
        </h3>
        <div className="space-y-4">
          {stats.byRootCause.map(item => {
            const pct = (item.amount_at_risk / maxAtRisk) * 100;
            const color = CAUSE_COLORS[item.cause] || '#64748b';
            return (
              <div key={item.cause}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-mono" style={{ color }}>
                    {CAUSE_LABELS[item.cause] || item.cause}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono" style={{ color: '#64748b' }}>
                      {item.count} txns
                    </span>
                    <span className="text-sm font-mono font-semibold" style={{ color: '#f8fafc' }}>
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(item.amount_at_risk)}
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full progress-bar-bg">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: color, opacity: 0.85 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cause cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.byRootCause.map(item => {
          const color = CAUSE_COLORS[item.cause] || '#64748b';
          const recoveredPct = item.amount_at_risk > 0
            ? Math.round((item.amount_recovered / item.amount_at_risk) * 100)
            : 0;
          const dropped = item.amount_at_risk - item.amount_recovered;

          return (
            <div
              key={item.cause}
              className="rounded-xl border p-5 metric-card"
              style={{ background: 'var(--surface)', borderColor: `${color}33` }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="font-semibold text-sm" style={{ color }}>{CAUSE_LABELS[item.cause] || item.cause}</span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <div className="text-label font-mono" style={{ color: '#64748b' }}>TXNS</div>
                  <div className="font-mono font-bold text-metric-sm" style={{ color: '#f8fafc' }}>{item.count}</div>
                </div>
                <div>
                  <div className="text-label font-mono" style={{ color: '#64748b' }}>AT RISK</div>
                  <div className="font-mono font-bold text-metric-sm" style={{ color: '#f8fafc' }}>
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(item.amount_at_risk)}
                  </div>
                </div>
                <div>
                  <div className="text-label font-mono" style={{ color: '#64748b' }}>RECOVERED</div>
                  <div className="font-mono font-bold text-metric-sm" style={{ color }}>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(item.amount_recovered)}</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <span className="text-xs font-mono" style={{ color: '#64748b' }}>
                  Recovery rate
                </span>
                <span className="font-mono text-sm font-semibold" style={{ color }}>
                  {recoveredPct}%
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs font-mono" style={{ color: '#64748b' }}>
                  Dropped
                </span>
                <span className="font-mono text-xs" style={{ color: '#f43f5e' }}>
                  {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(dropped)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="h-6 w-48 rounded mb-6" style={{ background: 'var(--border)' }} />
      <div
        className="rounded-xl border p-6 mb-6"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="mb-4">
            <div className="flex justify-between mb-1.5">
              <div className="h-3 w-24 rounded" style={{ background: 'var(--border)' }} />
              <div className="h-3 w-16 rounded" style={{ background: 'var(--border)' }} />
            </div>
            <div className="h-2 rounded-full" style={{ background: 'var(--border)' }} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border p-5"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full" style={{ background: 'var(--border)' }} />
              <div className="h-3 w-28 rounded" style={{ background: 'var(--border)' }} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j}>
                  <div className="h-2 w-12 rounded mb-1" style={{ background: 'var(--border)' }} />
                  <div className="h-4 w-16 rounded" style={{ background: 'var(--border)' }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-20 text-center">
      <p className="font-mono text-sm" style={{ color: '#64748b' }}>
        No data available. Run the batch from the Overview tab first.
      </p>
    </div>
  );
}
