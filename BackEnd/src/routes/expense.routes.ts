import { Router } from "express";
import { db, type Expense } from "../db.ts";

const router = Router();

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

    db.data.expenses[index] = { ...db.data.expenses[index], ...req.body };
    await db.write();
    return res.json({ message: "Expense updated!" });
});

router.delete('/api/expenses/:id', async (req, res): Promise<any> => {
    const { id } = req.params;
    db.data.expenses = db.data.expenses.filter((e: Expense) => e.id !== id);
    await db.write();
    return res.json({ message: "Expense deleted!" });
});

export default router;
