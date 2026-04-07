import { Router } from "express";
import { db } from "../db.ts";
const router = Router();

// Configure Expense Route
router.get('/api/expense-config', (req, res) => {

    res.json({
        categories: db.data.categories,
        expenseTypes: db.data.expenseTypes
    });
});

// Create Expense Route
router.post('/api/expenses', async (req, res): Promise<any> => {
    const { userId, description, amount, category, type, date } = req.body;

    const user = db.data.users.find((u) => u.id === userId);
    if (!user) {
        return res.status(400).json({ error: "Invalid user ID" });
    }

    const newExpense = {
        id: Date.now().toString(),
        userId: userId,
        description: description,
        amount: Number(amount),
        category: category,
        type: type,
        date: new Date(date).toISOString()
    };

    db.data.expenses.push(newExpense);
    await db.write();
    res.status(201).json({ message: "Expense added successfully!" });
});

// Get User Expenses Route
router.get('/api/expenses/:userId', (req, res) => {
    const { userId } = req.params;
    const userExpenses = db.data.expenses.filter((exp: any) => exp.userId === userId);
    return res.status(200).json(userExpenses);
});

// Update Expense Route
router.put('/api/expenses/:id', async (req, res): Promise<any> => {
    const { id } = req.params;
    const index = db.data.expenses.findIndex((e: any) => e.id === id);

    if (index !== -1) {
        db.data.expenses[index] = { ...db.data.expenses[index], ...req.body };
        await db.write();
        return res.json({ message: "Expense updated!" });
    }
    return res.status(404).json({ error: "Expense not found" });
});

// Delete Expense Route
router.delete('/api/expenses/:id', async (req, res): Promise<any> => {
    const { id } = req.params;
    db.data.expenses = db.data.expenses.filter((e: any) => e.id !== id);
    await db.write();
    return res.json({ message: "Expense deleted!" });
});

export default router;