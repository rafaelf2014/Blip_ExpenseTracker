import express from 'express';
import cors from 'cors';
import { db } from './db.ts'; // Imports your LowDB database connection

// 1. Initialize the Express server
const app = express();

// 2. Set up permissions and data parsing
app.use(cors()); // Allows React to talk to this server
app.use(express.json()); // Tells the server how to read JSON data sent from React

// 3. Create the Register Route
app.post('/api/register', async (req, res) => {
  // Grab the username and password that React sent us
  const { username, password } = req.body;

  // Check if the user already exists in db.json
  const existingUser = db.data.users.find((u) => u.username === username);
  if (existingUser) {
    // If they exist, send back a 400 Error
    return res.status(400).json({ error: "Username already taken" });
  }

  // Create the new user (Using the current time as a simple unique ID for now)
  const newUser = {
    id: Date.now().toString(),
    username: username,
    password: password 
  };

  // Add the user to the array and tell LowDB to save the file!
  db.data.users.push(newUser);
  await db.write();

  // Send a success message back to React
  res.status(201).json({ message: "User registered successfully!" });
});

// 4. Start the server on port 5000
app.listen(5000, () => {
  console.log('✅ Backend server is running on http://localhost:5000');
});