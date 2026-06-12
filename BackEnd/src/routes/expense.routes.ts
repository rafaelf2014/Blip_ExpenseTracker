import { Router } from "express";
import { db, type Expense } from "../db.ts";
import { occurrenceDates } from "../recurring.ts";

const router = Router();

/**
 * Idempotently materializes recurring templates into real transaction rows.
 * - Creates any missing occurrence (matched by sourceId + date).
 * - Removes generated rows whose template no longer exists.
 * Income rows are stored with a NEGATIVE amount and isIncome: true.
 */
router.post('/api/expenses/sync-recurring/:userId', async (req, res): Promise<any> => {
    const { userId } = req.params;
    const user = db.data.users.find((u) => u.id === userId);
    if (!user) return res.status(400).json({ error: "Invalid user ID" });

    const templates = user.regularTransactions ?? [];
    const templateIds = new Set(templates.map(t => t.id));
    const today = new Date();

    // 1. When a template is removed, KEEP its already-generated rows (preserve history
    //    and balance) but detach them: clear sourceId so they become normal one-off
    //    transactions and no new occurrences are generated for that template.
    let detached = 0;
    for (const e of db.data.expenses) {
        if (e.userId === userId && e.sourceId && !templateIds.has(e.sourceId)) {
            delete e.sourceId;
            e.type = e.isIncome ? 'Income' : 'One-time';
            detached++;
        }
    }
    // Drop skips belonging to templates that no longer exist.
    user.recurringSkips = (user.recurringSkips ?? []).filter(s => templateIds.has(s.sourceId));

    // Occurrences the user deliberately deleted — never regenerate these.
    const skipped = new Set(user.recurringSkips.map(s => `${s.sourceId}|${s.date}`));

    // 2. Index existing generated rows by `${sourceId}|${date}` to avoid duplicates.
    const existing = new Set(
        db.data.expenses
            .filter(e => e.userId === userId && e.sourceId)
            .map(e => `${e.sourceId}|${e.date.slice(0, 10)}`)
    );

    let created = 0;
    for (const rt of templates) {
        for (const dateStr of occurrenceDates(rt, today)) {
            const key = `${rt.id}|${dateStr}`;
            if (existing.has(key) || skipped.has(key)) continue;
            existing.add(key);

            const signedAmount = rt.isIncome ? -Math.abs(rt.amount) : Math.abs(rt.amount);
            db.data.expenses.push({
                id: `${rt.id}-${dateStr}`,
                userId,
                description: rt.description,
                amount: signedAmount,
                category: rt.category,
                type: 'Recurring',
                date: new Date(dateStr).toISOString(),
                isIncome: rt.isIncome,
                sourceId: rt.id,
            });
            created++;
        }
    }

    await db.write();
    return res.json({ message: "Recurring transactions synced", created, detached });
});

router.get('/api/expense-config', (req, res) => {
    res.json({
        categories: db.data.categories,
        expenseTypes: db.data.expenseTypes
    });
});

router.post('/api/expenses', async (req, res): Promise<any> => {
    const { userId, description, amount, category, type, date } = req.body;

    const user = db.data.users.find((u) => u.id === userId);
    if (!user) {
        return res.status(400).json({ error: "Invalid user ID" });
    }

    const newExpense: Expense = {
        id: Date.now().toString(),
        userId,
        description,
        amount: Number(amount),
        category,
        type,
        date: new Date(date).toISOString()
    };

    db.data.expenses.push(newExpense);
    await db.write();
    res.status(201).json({ message: "Expense added successfully!" });
});

router.get('/api/expenses/:userId', (req, res) => {
    const { userId } = req.params;
    const userExpenses = db.data.expenses.filter((exp: Expense) => exp.userId === userId);
    return res.status(200).json(userExpenses);
});

router.put('/api/expenses/:id', async (req, res): Promise<any> => {
    const { id } = req.params;
    const index = db.data.expenses.findIndex((e: Expense) => e.id === id);

    if (index === -1) {
        return res.status(404).json({ error: "Expense not found" });
    }

    const original = db.data.expenses[index];

    // Editing a recurring-generated row pins that occurrence: record a skip for its
    // original date so sync treats it as user-handled and never regenerates it.
    if (original.sourceId) {
        const user = db.data.users.find((u) => u.id === original.userId);
        if (user) {
            const skipDate = original.date.slice(0, 10);
            user.recurringSkips ??= [];
            if (!user.recurringSkips.some(s => s.sourceId === original.sourceId && s.date === skipDate)) {
                user.recurringSkips.push({ sourceId: original.sourceId!, date: skipDate });
            }
        }
    }

    db.data.expenses[index] = { ...original, ...req.body };
    await db.write();
    return res.json({ message: "Expense updated!" });
});

router.delete('/api/expenses/:id', async (req, res): Promise<any> => {
    const { id } = req.params;
    const expense = db.data.expenses.find((e: Expense) => e.id === id);

    // If this row was generated by a recurring template, remember the deletion
    // so sync won't regenerate that occurrence ("skip this month's rent").
    if (expense?.sourceId) {
        const user = db.data.users.find((u) => u.id === expense.userId);
        if (user) {
            const skipDate = expense.date.slice(0, 10);
            user.recurringSkips ??= [];
            if (!user.recurringSkips.some(s => s.sourceId === expense.sourceId && s.date === skipDate)) {
                user.recurringSkips.push({ sourceId: expense.sourceId!, date: skipDate });
            }
        }
    }

    db.data.expenses = db.data.expenses.filter((e: Expense) => e.id !== id);
    await db.write();
    return res.json({ message: "Expense deleted!" });
});

export default router;
