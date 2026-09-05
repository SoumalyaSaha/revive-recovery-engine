import type { Transaction, FailureType, EventType, CustomerFlags } from './types.js';

const failureTypes: FailureType[] = [
  'insufficient_funds',
  'card_expired',
  'bank_decline',
  'checkout_abandon',
  'invoice_overdue',
];

const eventTypes: EventType[] = [
  'payment_failed',
  'subscription_retry',
  'invoice_reminder',
  'checkout_abandoned',
];

const firstNames = ['Arjun', 'Priya', 'Rohan', 'Ananya', 'Vikram', 'Meera', 'Aditya', 'Kavya', 'Nikhil', 'Shreya', 'Aarav', 'Diya', 'Kabir', 'Ishita', 'Raghav', 'Pooja', 'Siddharth', 'Nandini', 'Vivek', 'Tanya'];
const lastNames = ['Sharma', 'Patel', 'Verma', 'Singh', 'Gupta', 'Reddy', 'Nair', 'Joshi', 'Mishra', 'Kapoor'];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateFlags(): CustomerFlags {
  return {
    opted_out: Math.random() < 0.08,
    is_vip: Math.random() < 0.12,
    is_disputed: Math.random() < 0.06,
    risk_score: randomInt(5, 95),
  };
}

function generateTransactions(count: number): Transaction[] {
  const transactions: Transaction[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const failureType = randomChoice(failureTypes);
    const eventType = randomChoice(eventTypes);
    const flags = generateFlags();
    const amount = failureType === 'invoice_overdue'
      ? randomInt(5000, 500000)
      : randomInt(200, 75000);

    const hoursAgo = randomInt(1, 720); // up to 30 days ago
    const timestamp = new Date(now - hoursAgo * 3600000).toISOString();

    transactions.push({
      id: `TXN-${String(100000 + i).padStart(6, '0')}`,
      customer_id: `CUST-${String(randomInt(1, 200)).padStart(4, '0')}`,
      amount,
      failure_type: failureType,
      event_type: eventType,
      attempts_so_far: failureType === 'checkout_abandon' ? 0 : randomInt(0, 5),
      customer_flags: flags,
      timestamp,
    });
  }

  return transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export const INITIAL_TRANSACTIONS = generateTransactions(75);

export function generateMockStats(transactions: Transaction[]): { totalAtRisk: number; recovered: number; escalated: number } {
  const totalAtRisk = transactions.reduce((sum, t) => sum + t.amount, 0);
  // Simulate ~42% recovery rate based on the mock data distribution
  const recoveryRate = 0.42;
  const recovered = Math.round(totalAtRisk * recoveryRate);
  const escalated = transactions.filter(t => t.customer_flags.is_vip || t.customer_flags.is_disputed).length;
  return { totalAtRisk, recovered, escalated };
}
