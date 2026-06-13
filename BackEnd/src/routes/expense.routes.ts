import { Router } from "express";
import { db, type Expense } from "../db.ts";
import { occurrenceDates } from "../recurring.ts";

const router = Router();

// Transforma os recorrentes em linhas reais. É idempotente: cria as ocorrências
// que faltam (por sourceId + data) e os rendimentos ficam com valor NEGATIVO e
// isIncome: true.
router.post('/api/expenses/sync-recurring/:userId', async (req, res): Promise<any> => {
    const { userId } = req.params;
    const user = db.data.users.find((u) => u.id === userId);
    if (!user) return res.status(400).json({ error: "Invalid user ID" });

    const templates = user.regularTransactions ?? [];
    const templateIds = new Set(templates.map(t => t.id));
    const today = new Date();

    // 1. Se um recorrente foi apagado, ficamos com as linhas que ele já gerou (para
    //    manter o histórico e o saldo) mas largamo-las: tiramos o sourceId, viram
    //    transações normais e deixam de gerar novas ocorrências.
    let detached = 0;
    for (const e of db.data.expenses) {
        if (e.userId === userId && e.sourceId && !templateIds.has(e.sourceId)) {
            delete e.sourceId;
            e.type = e.isIncome ? 'Income' : 'One-time';
            detached++;
        }
    }
    // Limpa os skips de recorrentes que já não existem.
    user.recurringSkips = (user.recurringSkips ?? []).filter(s => templateIds.has(s.sourceId));

    // Ocorrências que o utilizador apagou de propósito — nunca regenerar.
    const skipped = new Set(user.recurringSkips.map(s => `${s.sourceId}|${s.date}`));

    // 2. Indexa as linhas já geradas por `${sourceId}|${date}` para não duplicar.
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

    // Editar uma linha recorrente fixa essa ocorrência: guardamos um skip na data
    // original para o sync a tratar como já resolvida e não a voltar a gerar.
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

    // Se a linha veio de um recorrente, guardamos a remoção para o sync não a
    // voltar a criar (tipo "saltar a renda deste mês").
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
