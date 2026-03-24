import express from 'express';
import cors from 'cors';
import { db } from './db.ts';


const app = express();

app.use(cors());
app.use(express.json());

// Register Route
app.post('/api/register', async (req, res) => {
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

app.post('/api/login', async (req, res) => {
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

app.get('/api/expense-config', (req, res) => {
  res.json({
    categories: db.data.categories,
    expenseTypes: db.data.expenseTypes
  });
});

app.post('/api/expenses', async (req, res): Promise<any> => {
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

app.get('/api/expenses/:userId', (req, res) => {
  const { userId } = req.params;
  const userExpenses = db.data.expenses.filter((exp: any) => exp.userId === userId);
  return res.status(200).json(userExpenses);
});

app.put('/api/users/update', async (req, res) => {
  const { oldUsername, newUsername } = req.body;
  
  const user = db.data.users.find((u: any) => u.username === oldUsername);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  
  const nameExists = db.data.users.find((u: any) => u.username === newUsername);
  if (nameExists && oldUsername !== newUsername) {
    return res.status(400).json({ error: "Username already taken" });
  }
  
  user.username = newUsername;
  
  db.data.expenses.forEach((expense: any) => {
    if (expense.userId === oldUsername) {
        expense.userId = newUsername;
    }
  });

  await db.write();

  return res.status(200).json({ message: "Username updated successfully!" });
});

app.put('/api/users/update-password', async (req, res) => {
  const { username, currentPassword, newPassword } = req.body;

  // 1. Find the user
  const user = db.data.users.find((u: any) => u.username === username);

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

  return res.json({ message: "Password updated successfully! 🔒" });
});

app.put('/api/users/update', async (req, res) => {
  const { oldUsername, newUsername } = req.body;
  //1. Find the user by their current username
  const user = db.data.users.find((u) => u.username === oldUsername);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  //2. Check if the new username is already taken by another user
  const nameExists = db.data.users.find((u) => u.username === newUsername);
  if (nameExists && oldUsername !== newUsername) {
    return res.status(400).json({ error: "Username already taken" });
  }
  //3. Update the user's username and save the changes to the database
  user.username = newUsername;
  await db.write();

  res.status(200).json({ message: "Username updated successfully!" });
});

// Route to update user password
app.put('/api/users/update-password', async (req, res) => {
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


// 4. Start the server on port 5000
app.listen(5000, () => {
  console.log('✅ Backend server is running on http://localhost:5000');
});