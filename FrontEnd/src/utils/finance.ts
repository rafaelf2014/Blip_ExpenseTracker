import type { RegularTransaction } from '../types';

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
    let cursor = new Date(start.getFullYear(), start.getMonth(), day);
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
