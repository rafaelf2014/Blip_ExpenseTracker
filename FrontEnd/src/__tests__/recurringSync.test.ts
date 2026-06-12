import { describe, it, expect } from 'vitest';

// The backend's recurring-sync materializes occurrences from a template up to
// today, skipping any that already exist OR were deliberately deleted. The two
// pure helpers below mirror that backend logic (BackEnd/src/recurring.ts) so the
// algorithm is covered here under the frontend's working test runner.

type RecurringLike = { id: string; frequency: 'weekly' | 'monthly' | 'yearly'; date: string };

function occurrenceDates(rt: RecurringLike, today: Date): string[] {
    const start = new Date(rt.date); start.setHours(0, 0, 0, 0);
    const end = new Date(today);     end.setHours(0, 0, 0, 0);
    if (start > end) return [];
    const fmt = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dates: string[] = [];
    const cursor = new Date(start);
    if (rt.frequency === 'weekly') {
        while (cursor <= end) { dates.push(fmt(cursor)); cursor.setDate(cursor.getDate() + 7); }
    } else if (rt.frequency === 'monthly') {
        const day = start.getDate();
        let y = start.getFullYear();
        let m = start.getMonth();
        let occ = new Date(y, m, Math.min(day, new Date(y, m + 1, 0).getDate()));
        while (occ <= end) {
            dates.push(fmt(occ));
            m += 1;
            if (m > 11) { m = 0; y += 1; }
            occ = new Date(y, m, Math.min(day, new Date(y, m + 1, 0).getDate()));
        }
    } else if (rt.frequency === 'yearly') {
        while (cursor <= end) { dates.push(fmt(cursor)); cursor.setFullYear(cursor.getFullYear() + 1); }
    }
    return dates;
}

function newOccurrences(t: RecurringLike, today: Date, existing: Set<string>, skipped: Set<string>): string[] {
    return occurrenceDates(t, today).filter(d => {
        const key = `${t.id}|${d}`;
        return !existing.has(key) && !skipped.has(key);
    });
}

const tpl = (o: Partial<RecurringLike> = {}): RecurringLike => ({ id: 'tpl1', frequency: 'monthly', date: '2026-01-15', ...o });

describe('occurrenceDates', () => {
    it('monthly: one date per month up to today (inclusive)', () => {
        expect(occurrenceDates(tpl({ date: '2026-01-10' }), new Date(2026, 3, 20)))
            .toEqual(['2026-01-10', '2026-02-10', '2026-03-10', '2026-04-10']);
    });
    it('weekly: every 7 days', () => {
        expect(occurrenceDates(tpl({ frequency: 'weekly', date: '2026-06-01' }), new Date(2026, 5, 22)))
            .toEqual(['2026-06-01', '2026-06-08', '2026-06-15', '2026-06-22']);
    });
    it('yearly: one per year', () => {
        expect(occurrenceDates(tpl({ frequency: 'yearly', date: '2024-02-10' }), new Date(2026, 5, 1)))
            .toEqual(['2024-02-10', '2025-02-10', '2026-02-10']);
    });
    it('handles the 31st across short months without drift or looping', () => {
        const dates = occurrenceDates(tpl({ date: '2026-01-31' }), new Date(2026, 2, 31));
        // Jan 31, Feb clamps to the 28th, Mar returns to the 31st.
        expect(dates).toEqual(['2026-01-31', '2026-02-28', '2026-03-31']);
    });
    it('empty when the template starts after today', () => {
        expect(occurrenceDates(tpl({ date: '2027-01-01' }), new Date(2026, 5, 1))).toEqual([]);
    });
});

describe('sync dedup + skip logic', () => {
    const today = new Date(2026, 3, 20); // Apr 20 -> Jan,Feb,Mar,Apr occurrences

    it('fresh sync generates all occurrences', () => {
        expect(newOccurrences(tpl(), today, new Set(), new Set())).toHaveLength(4);
    });
    it('is idempotent — existing occurrences are not regenerated', () => {
        const existing = new Set(['tpl1|2026-01-15', 'tpl1|2026-02-15', 'tpl1|2026-03-15', 'tpl1|2026-04-15']);
        expect(newOccurrences(tpl(), today, existing, new Set())).toHaveLength(0);
    });
    it('a deleted occurrence (skip list) is never regenerated', () => {
        const result = newOccurrences(tpl(), today, new Set(), new Set(['tpl1|2026-03-15']));
        expect(result).toHaveLength(3);
        expect(result).not.toContain('2026-03-15');
    });
    it('applies existing + skip filters together', () => {
        const existing = new Set(['tpl1|2026-01-15']);
        const skipped  = new Set(['tpl1|2026-02-15']);
        expect(newOccurrences(tpl(), today, existing, skipped)).toEqual(['2026-03-15', '2026-04-15']);
    });
});
