// Minimal shape needed for occurrence math — kept local so this module has zero
// dependency on db.ts (which does file I/O on import), making it cleanly testable.
export type RecurringLike = {
    frequency: 'weekly' | 'monthly' | 'yearly';
    date: string; // ISO date of the first occurrence
};

/**
 * Returns every occurrence date (YYYY-MM-DD) of a recurring template from its
 * start date up to and including `today`. Pure — no DB access, so it's unit-testable.
 */
export function occurrenceDates(rt: RecurringLike, today: Date): string[] {
    const start = new Date(rt.date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setHours(0, 0, 0, 0);
    if (start > end) return [];

    const fmt = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const dates: string[] = [];
    const cursor = new Date(start);

    if (rt.frequency === 'weekly') {
        while (cursor <= end) { dates.push(fmt(cursor)); cursor.setDate(cursor.getDate() + 7); }
    } else if (rt.frequency === 'monthly') {
        // Step by absolute month index so short months (Feb) can't cause drift or
        // an infinite loop. Clamp the day to the month's length (e.g. the 31st
        // becomes Feb 28/29). `new Date(y, m+1, 0)` is the last day of month m.
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
