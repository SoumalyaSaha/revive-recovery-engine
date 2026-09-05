import express from 'express';
import cors from 'cors';
import { INITIAL_TRANSACTIONS } from './mock-data.js';
import { runPipeline, computeStats } from './engine.js';
import type { Transaction, AuditEntry } from './types.js';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// In-memory state
let transactions: Transaction[] = [...INITIAL_TRANSACTIONS];
let auditLog: AuditEntry[] = [];
let lastBatchStats: ReturnType<typeof computeStats> | null = null;
let batchRunCount = 0;

// GET /api/stats
app.get('/api/stats', (req, res) => {
  console.log(`[GET /api/stats] lastBatchStats=${lastBatchStats ? 'SET (recovered='+lastBatchStats.recovered+')' : 'NULL'}`);
  if (!lastBatchStats) {
    // Initial stats from raw transactions (no pipeline run yet)
    const totalAtRisk = transactions.reduce((sum, t) => sum + t.amount, 0);
    const stats = {
      totalAtRisk,
      recovered: 0,
      recoveryRate: 0,
      escalated: 0,
      byIntervention: [],
      byRootCause: transactions.reduce((acc, t) => {
        const existing = acc.find((a: { cause: string }) => a.cause === t.failure_type);
        if (existing) {
          existing.count++;
          existing.amount_at_risk += t.amount;
        } else {
          acc.push({ cause: t.failure_type, count: 1, amount_at_risk: t.amount, amount_recovered: 0 });
        }
        return acc;
      }, [] as any),
    };
    console.log(`[GET /api/stats] initial stats:`, JSON.stringify(stats));
    res.json(stats);
    return;
  }
  res.json(lastBatchStats);
});

// POST /api/run-batch
app.post('/api/run-batch', (req, res) => {
  const pendingTransactions = transactions.filter(t => !auditLog.find(a => a.txn_id === t.id));
  console.log(`[run-batch #${batchRunCount + 1}] pending=${pendingTransactions.length}, auditLogBefore=${auditLog.length}`);

  if (pendingTransactions.length === 0) {
    // Re-run all
    auditLog = [];
    console.log('[run-batch] cleared auditLog, re-running all', transactions.length, 'transactions');
    for (const txn of transactions) {
      const entry = runPipeline(txn);
      console.log(`  [pipeline] txn=${txn.id} action=${entry.action} recovered=${entry.recovered_amount ?? 'none'}`);
      auditLog.push(entry);
    }
  } else {
    console.log('[run-batch] processing', pendingTransactions.length, 'pending transactions');
    for (const txn of pendingTransactions) {
      const entry = runPipeline(txn);
      console.log(`  [pipeline] txn=${txn.id} action=${entry.action} recovered=${entry.recovered_amount ?? 'none'}`);
      auditLog.push(entry);
    }
  }

  batchRunCount++;
  lastBatchStats = computeStats(transactions, auditLog);
  console.log(`[run-batch] lastBatchStats: recovered=${lastBatchStats.recovered}, escalated=${lastBatchStats.escalated}, entries=${auditLog.length}`);

  res.json({
    message: `Batch #${batchRunCount} completed`,
    processed: pendingTransactions.length === 0 ? transactions.length : pendingTransactions.length,
    total_audit_entries: auditLog.length,
    stats: lastBatchStats,
  });
});

// GET /api/audit-log
app.get('/api/audit-log', (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = (req.query.search as string) || '';
  const actionFilter = req.query.action as string || '';

  let filtered = auditLog;

  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(e =>
      e.txn_id.toLowerCase().includes(s) ||
      e.root_cause.toLowerCase().includes(s) ||
      e.action.toLowerCase().includes(s)
    );
  }

  if (actionFilter) {
    filtered = filtered.filter(e => e.action === actionFilter);
  }

  const total = filtered.length;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  res.json({
    data: paginated,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// GET /api/transactions (for debugging)
app.get('/api/transactions', (req, res) => {
  res.json(transactions);
});

app.listen(PORT, () => {
  console.log(`Revive backend running on http://localhost:${PORT}`);
});
