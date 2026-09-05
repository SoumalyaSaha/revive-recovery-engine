import { useState, useEffect } from 'react';
import { api, type Stats } from '../api';
import ScrollScrubVideo from './ScrollScrubVideo';

export default function OverviewTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [runMessage, setRunMessage] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (e) {
      console.error('Failed to load stats', e);
    }
  }

  async function handleRunBatch() {
    setLoading(true);
    setRunMessage('');
    try {
      await api.runBatch();
      // Re-fetch fresh stats so KPI cards reflect the new pipeline results
      const data = await api.getStats();
      setStats(data);
      setRunMessage('Batch complete');
    } catch (e) {
      console.error('Batch run failed', e);
      setRunMessage('Error running batch');
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  return (
    <div>
      {/* Scroll-scrubbed video hero */}
      <ScrollScrubVideo src="/coin-fall.mp4" />

      {/* KPI Cards */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold" style={{ color: '#f8fafc' }}>Dashboard</h2>
            <p className="text-sm font-mono mt-1" style={{ color: '#64748b' }}>
              {runMessage && <span style={{ color: 'var(--teal)' }}>{runMessage}</span>}
              {!runMessage && 'Click "Run Batch" to execute the recovery pipeline'}
            </p>
          </div>
          <button
            className="btn-primary flex items-center gap-2"
            onClick={handleRunBatch}
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                  <path d="M14 8A6 6 0 0 0 8 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Running...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Run Batch
              </>
            )}
          </button>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats ? (
            <>
              <KpiCard
                label="Total At Risk"
                value={formatCurrency(stats.totalAtRisk)}
                subtitle="₹ across all failed txns"
                icon="risk"
              />
              <KpiCard
                label="Recovered"
                value={formatCurrency(stats.recovered)}
                subtitle={`${stats.recoveryRate}% recovery rate`}
                icon="recovered"
              />
              <KpiCard
                label="Recovery Rate"
                value={`${stats.recoveryRate}%`}
                subtitle={`of ${stats.totalAtRisk > 0 ? formatCurrency(stats.totalAtRisk) : '₹0'} at risk`}
                icon="rate"
              />
              <KpiCard
                label="Escalated"
                value={String(stats.escalated)}
                subtitle="to human review"
                icon="escalated"
              />
            </>
          ) : (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl p-5 border"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
              >
                <div
                  className="h-3 w-20 rounded mb-3"
                  style={{ background: 'var(--border)' }}
                />
                <div
                  className="h-7 w-28 rounded mb-2"
                  style={{ background: 'var(--border)' }}
                />
                <div
                  className="h-2 w-16 rounded"
                  style={{ background: 'var(--border)' }}
                />
              </div>
            ))
          )}
        </div>

        {/* Recovery by Intervention */}
        <div
          className="rounded-xl border p-6"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-base" style={{ color: '#f8fafc' }}>
                Recovery by Intervention
              </h3>
              <p className="text-sm font-mono mt-0.5" style={{ color: '#64748b' }}>
                Breakdown across automated recovery actions
              </p>
            </div>
          </div>

          {stats?.byIntervention.length ? (
            <div className="space-y-3">
              {stats.byIntervention.map((item, i) => {
                const maxAmount = Math.max(...stats.byIntervention.map(x => x.amount_recovered));
                const pct = maxAmount > 0 ? (item.amount_recovered / maxAmount) * 100 : 0;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className="font-mono text-sm"
                        style={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}
                      >
                        {item.type.replace(/_/g, ' ')}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm" style={{ color: '#64748b' }}>
                          {item.count} txns
                        </span>
                        <span className="font-mono font-semibold text-sm" style={{ color: 'var(--teal)' }}>
                          {formatCurrency(item.amount_recovered)}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full progress-bar-bg">
                      <div
                        className="h-full rounded-full progress-bar-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              className="text-center py-10 rounded-lg border"
              style={{ borderStyle: 'dashed', borderColor: 'var(--border)' }}
            >
              <p className="font-mono text-sm" style={{ color: '#64748b' }}>
                No data yet — click "Run Batch" to execute the recovery pipeline
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  subtitle,
  icon,
}: {
  label: string;
  value: string;
  subtitle: string;
  icon: 'risk' | 'recovered' | 'rate' | 'escalated';
}) {
  const iconColors = {
    risk: '#f59e0b',
    recovered: 'var(--teal)',
    rate: 'var(--teal)',
    escalated: '#f43f5e',
  };
  const bgColor = {
    risk: 'rgba(245, 158, 11, 0.1)',
    recovered: 'rgba(13, 242, 201, 0.1)',
    rate: 'rgba(13, 242, 201, 0.1)',
    escalated: 'rgba(244, 63, 94, 0.1)',
  }[icon];

  return (
    <div
      className="metric-card rounded-xl border p-5 cursor-default"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-label font-mono" style={{ color: '#64748b', textTransform: 'uppercase' }}>
          {label}
        </span>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: bgColor }}
        >
          {icon === 'risk' && (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v6M7 10v1M3.5 3.5l1 1M9.5 3.5l-1 1M1 7h2M11 7h2M3.5 10.5l1-1M9.5 10.5l-1-1" stroke={iconColors[icon]} strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          )}
          {icon === 'recovered' && (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7l3.5 3.5L12 4" stroke={iconColors[icon]} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {icon === 'rate' && (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 10l3-4 2 2 3-5" stroke={iconColors[icon]} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 2h2v2" stroke={iconColors[icon]} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {icon === 'escalated' && (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v6M4 8l3 3 3-3M3 12h8" stroke={iconColors[icon]} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>
      <div
        className="font-mono font-bold"
        style={{ fontSize: '22px', color: iconColors[icon], letterSpacing: '-0.02em' }}
      >
        {value}
      </div>
      <p className="text-xs mt-1" style={{ color: '#64748b' }}>{subtitle}</p>
    </div>
  );
}
