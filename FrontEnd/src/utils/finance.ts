import type { Expense, RegularTransaction, Budget } from '../types';

// usa componentes locais para evitar desvios de fuso horário à meia-noite
export function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// segunda-feira da semana actual
export function getWeekStart(d: Date): Date {
  const daysFromMonday = (d.getDay() + 6) % 7; // Seg=0, ... Dom=6
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - daysFromMonday);
}

export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

// retorna "0" quando não há dado anterior para comparar
export function pctOrZero(curr: number, prev: number | null | undefined): string {
  if (prev == null || prev === 0) return '0';
  return ((curr - prev) / Math.abs(prev) * 100).toFixed(1);
}

export function countOccurrences(rt: RegularTransaction, start: Date, end: Date): number {
  const startDate = new Date(rt.date);
  if (startDate > end) return 0;

  if (rt.frequency === 'yearly') {
    let count = 0;
    for (let y = start.getFullYear(); y <= end.getFullYear(); y++) {
      const occ = new Date(y, startDate.getMonth(), startDate.getDate());
      if (occ >= startDate && occ >= start && occ <= end) count++;
    }
    return count;
  }

  if (rt.frequency === 'monthly') {
    const day = startDate.getDate();
    const cursor = new Date(start.getFullYear(), start.getMonth(), day);
    if (cursor < start) cursor.setMonth(cursor.getMonth() + 1);
    let count = 0;
    while (cursor <= end) {
      if (cursor >= startDate) count++;
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return count;
  }

  if (rt.frequency === 'weekly') {
    const dow = startDate.getDay();
    const effectiveStart = new Date(Math.max(start.getTime(), startDate.getTime()));
    const cursor = new Date(effectiveStart);
    cursor.setDate(cursor.getDate() + (dow - cursor.getDay() + 7) % 7);
    let count = 0;
    while (cursor <= end) { count++; cursor.setDate(cursor.getDate() + 7); }
    return count;
  }

  return 0;
}

export function calcIncome(regularTransactions: RegularTransaction[], start: Date, end: Date): number {
  return regularTransactions
    .filter(rt => rt.isIncome)
    .reduce((sum, rt) => sum + countOccurrences(rt, start, end) * rt.amount, 0);
}


export function makeTimeFilter(filterTime: string): (e: Expense) => boolean {
  if (filterTime === '') return () => true;
  const today        = new Date();
  const todayStr     = toLocalDateStr(today);
  const weekStartStr = toLocalDateStr(getWeekStart(today));
  const thisMonth    = today.getMonth();
  const thisYear     = today.getFullYear();
  return (e: Expense) => {
    const expStr = toLocalDateStr(new Date(e.date));
    if (filterTime === 'week')  return expStr >= weekStartStr && expStr <= todayStr;
    if (filterTime === 'month') { const d = new Date(e.date); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; }
    if (filterTime === 'year')  return new Date(e.date).getFullYear() === thisYear;
    return true;
  };
}

export function filterByTime(expenses: Expense[], filterTime: string): Expense[] {
  return expenses.filter(makeTimeFilter(filterTime));
}

export type MonthlyMetrics = {
  monthSpent: number;
  monthIncome: number;
  /** % dos orçamentos mensais já gastos; null se não há orçamentos. */
  budgetUtilization: number | null;
  /** % do rendimento poupado; null se não há rendimento. */
  savingsRate: number | null;
};

/**
 * Métricas-chave de um mês: total gasto, rendimento, utilização de orçamento e
 * taxa de poupança. Centraliza a matemática partilhada pelo histórico e pelos quick stats.
 */
export function computeMonthlyMetrics(
  monthExpenses: Expense[],
  budgets: Budget[],
  regularTransactions: RegularTransaction[],
  start: Date,
  end: Date,
): MonthlyMetrics {
  const monthSpent  = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const monthIncome = calcIncome(regularTransactions, start, end);

  const monthlyBudgets   = budgets.filter(b => b.period === 'monthly');
  const totalBudgetLimit = monthlyBudgets.reduce((s, b) => s + b.limit, 0);
  const budgetSpent      = monthlyBudgets.reduce((s, b) =>
    s + monthExpenses.filter(e => e.category === b.category).reduce((c, e) => c + Number(e.amount), 0), 0);

  const budgetUtilization = totalBudgetLimit > 0 ? Math.round(budgetSpent / totalBudgetLimit * 100) : null;
  const savingsRate       = monthIncome > 0 ? Math.round((monthIncome - monthSpent) / monthIncome * 100) : null;

  return { monthSpent, monthIncome, budgetUtilization, savingsRate };
}
