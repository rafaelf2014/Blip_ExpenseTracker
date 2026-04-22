import express from 'express';
import cors from 'cors';
import userRoutes from './routes/user.routes.ts';
import expenseRoutes from './routes/expense.routes.ts';

const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' })); // raised for base64 profile pictures

// Routes beginning with /api will be handled by the respective route handlers
app.use(userRoutes);
app.use(expenseRoutes);

// Start the server on port 5000
app.listen(5000, () => {
  console.log('✅ Backend server is running on http://localhost:5000');
});