import { Router } from "express";
import { db } from "../db.ts";

const router = Router();

// Register Route
router.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    const existingUser = db.data.users.find((u) => u.username === username);
    if (existingUser) {
        return res.status(400).json({ error: "Username already taken" });
    }

    const newUser = {
        id: Date.now().toString(),
        username: username,
        password: password
    };

    db.data.users.push(newUser);
    await db.write();
    res.status(201).json({ message: "User registered successfully!" });
});

// Login Route
router.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    const user = db.data.users.find((u) => u.username === username && u.password === password);
    if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
    }
    return res.status(200).json({
        message: "Login successful!",
        user: {
            id: user.id,
            username: user.username
        }
    });
});

// Update Username Route
router.put('/api/users/update', async (req, res) => {
    const { oldUsername, newUsername } = req.body;

    //1. Find the user by their current username
    const user = db.data.users.find((u: any) => u.username === oldUsername);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    //2. Check if the new username is already taken by another user
    const nameExists = db.data.users.find((u: any) => u.username === newUsername);
    if (nameExists && oldUsername !== newUsername) {
        return res.status(400).json({ error: "Username already taken" });
    }
    //3. Update the user's username 
    user.username = newUsername;
    //4. Update all expenses associated with the old username to reflect the new username
    db.data.expenses.forEach((expense: any) => {
        if (expense.userId === oldUsername) {
            expense.userId = newUsername;
        }
    });

    await db.write();

    return res.status(200).json({ message: "Username updated successfully!" });
});

// Update Password Route
router.put('/api/users/update-password', async (req, res) => {
    const { username, currentPassword, newPassword } = req.body;

    // 1. Find the user
    const user = db.data.users.find((u) => u.username === username);

    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    // 2. Security check: Verify the current password
    if (user.password !== currentPassword) {
        return res.status(401).json({ error: "Current password is incorrect" });
    }

    // 3. Update and save
    user.password = newPassword;
    await db.write();

    res.json({ message: "Password updated successfully! 🔒" });
});

export default router;