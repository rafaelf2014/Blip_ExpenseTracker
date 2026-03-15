import express from 'express';
import cors from 'cors';
import { db } from './db.ts'; // Imports your LowDB database connection

// 1. Initialize the Express server
const app = express();

// 2. Set up permissions and data parsing
app.use(cors()); // Allows React to talk to this server
app.use(express.json()); // Tells the server how to read JSON data sent from React

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

app.get('/api/expenses', (req, res) => {
  if (db.data && db.data.expenses) {
    res.json(db.data.expenses);
  } else {
    res.status(404).json({ error: "No expenses found" });
  }
});

// 4. Start the server on port 5000
app.listen(5000, () => {
  console.log('✅ Backend server is running on http://localhost:5000');
});