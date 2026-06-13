import type { Expense, RegularTransaction, Budget } from '../types';

// Valores com sinal: positivo = gasto, negativo = rendimento.

// Total gasto: só soma os valores positivos.
export function sumSpent(expenses: Expense[]): number {
  return expenses.reduce((s, e) => s + Math.max(0, Number(e.amount)), 0);
}

// Total recebido: o valor absoluto dos negativos.
export function sumIncome(expenses: Expense[]): number {
  return expenses.reduce((s, e) => s + Math.max(0, -Number(e.amount)), 0);
}

// Saldo líquido: rendimento menos gastos.
export function sumNet(expenses: Expense[]): number {
  return expenses.reduce((s, e) => s - Number(e.amount), 0);
}

// Saldo corrente: saldo inicial mais o líquido de tudo.
export function computeBalance(startingBalance: number, expenses: Expense[]): number {
  return startingBalance + sumNet(expenses);
}

// Usa a data local para não saltar de dia à meia-noite por causa do fuso.
export function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Segunda-feira da semana.
export function getWeekStart(d: Date): Date {
  const daysFromMonday = (d.getDay() + 6) % 7; // Seg=0, ... Dom=6
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - daysFromMonday);
}

export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Devolve "0" quando não há valor anterior para comparar.
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
    // Avança por índice de mês e limita o dia ao tamanho do mês, para que um dia
    // 29-31 não derive (Fevereiro) nem entre em loop. lastDay = new Date(y,m+1,0).
    const day = startDate.getDate();
    let y = start.getFullYear();
    let m = start.getMonth();
    let count = 0;
    let occ = new Date(y, m, Math.min(day, new Date(y, m + 1, 0).getDate()));
    while (occ <= end) {
      if (occ >= startDate && occ >= start) count++;
      m += 1;
      if (m > 11) { m = 0; y += 1; }
      occ = new Date(y, m, Math.min(day, new Date(y, m + 1, 0).getDate()));
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

export type ExpenseFilters = {
  searchTerm: string;
  filterCategory: string;
  filterType: string;
  filterTime: string;
  filterMin: string;
  filterMax: string;
};

// Junta pesquisa + categoria + tipo + intervalo de valor + tempo num só filtro.
export function makeExpenseFilter(f: ExpenseFilters): (e: Expense) => boolean {
  const timeFilter = makeTimeFilter(f.filterTime);
  const search     = f.searchTerm.toLowerCase();
  return (e: Expense) => {
    const amount = Number(e.amount);
    return (
      e.description.toLowerCase().includes(search) &&
      (f.filterCategory === '' || e.category === f.filterCategory) &&
      (f.filterType === ''     || e.type === f.filterType) &&
      (f.filterMin === ''      || amount >= Number(f.filterMin)) &&
      (f.filterMax === ''      || amount <= Number(f.filterMax)) &&
      timeFilter(e)
    );
  };
}

export type MonthlyMetrics = {
  monthSpent: number;
  monthIncome: number;
  // % dos orçamentos mensais já gastos; null se não houver orçamentos.
  budgetUtilization: number | null;
  // % do rendimento poupado; null se não houver rendimento.
  savingsRate: number | null;
};

// Métricas do mês (gasto, rendimento, orçamento, poupança) num só sítio,
// partilhadas pelo histórico e pelos quick stats.
export function computeMonthlyMetrics(
  monthExpenses: Expense[],
  budgets: Budget[],
): MonthlyMetrics {
  const monthSpent  = sumSpent(monthExpenses);
  const monthIncome = sumIncome(monthExpenses);

  // Os orçamentos só contam gastos, por isso somamos os positivos por categoria.
  const monthlyBudgets   = budgets.filter(b => b.period === 'monthly');
  const totalBudgetLimit = monthlyBudgets.reduce((s, b) => s + b.limit, 0);
  const budgetSpent      = monthlyBudgets.reduce((s, b) =>
    s + sumSpent(monthExpenses.filter(e => e.category === b.category)), 0);

  const budgetUtilization = totalBudgetLimit > 0 ? Math.round(budgetSpent / totalBudgetLimit * 100) : null;
  const savingsRate       = monthIncome > 0 ? Math.round((monthIncome - monthSpent) / monthIncome * 100) : null;

  return { monthSpent, monthIncome, budgetUtilization, savingsRate };
}
