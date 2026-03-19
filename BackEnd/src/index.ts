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