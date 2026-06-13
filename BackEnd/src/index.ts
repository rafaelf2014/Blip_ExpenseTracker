import express from 'express';
import cors from 'cors';
import userRoutes from './routes/user.routes.ts';
import expenseRoutes from './routes/expense.routes.ts';

const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' })); // subimos o limite por causa das fotos em base64

// As rotas /api ficam a cargo destes handlers
app.use(userRoutes);
app.use(expenseRoutes);

// Arranca o servidor na porta 5000
app.listen(5000, () => {
  console.log('✅ Backend server is running on http://localhost:5000');
});