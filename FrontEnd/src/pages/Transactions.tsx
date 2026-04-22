import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { ExpenseModal } from '../components/ExpenseModal';
import { EditExpenseModal } from '../components/EditExpenseModal';
import { ExpenseTable } from '../components/ExpenseTable';
import { FilterControls } from '../components/FilterControl';
import { SummaryCard } from '../components/SummaryBoxes';
import '../styles/Transactions.scss';
import { AiExpenseBar } from '../components/AiExpenseBar';
import { Receipt, TrendingUp, Wallet, DollarSign } from 'lucide-react';
import { useCurrency } from '../Context/CurrencyContext';
import type { Expense, RegularTransaction } from '../types';
import { getWeekStart, toLocalDateStr, calcIncome } from '../utils/finance';

function calculateActualIncome(regularTransactions: RegularTransaction[], filterTime: string): number {
  const today = new Date();
  let start: Date;

  if (filterTime === 'week')       start = getWeekStart(today);
  else if (filterTime === 'month') start = new Date(today.getFullYear(), today.getMonth(), 1);
  else if (filterTime === 'year')  start = new Date(today.getFullYear(), 0, 1);
  else                             start = new Date(0);

  return calcIncome(regularTransactions, start, today);
}

export default function Transactions() {
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();

  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<string[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // User financial settings
  const [currentBalance, setCurrentBalance] = useState(0);
  const [regularTransactions, setRegularTransactions] = useState<RegularTransaction[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterTime, setFilterTime] = useState('');
  const [filterMin, setFilterMin] = useState('');
  const [filterMax, setFilterMax] = useState('');

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const storedUserId = localStorage.getItem('userId');

    if (!storedUsername || !storedUserId) {
      navigate('/');
    } else {
      setUsername(storedUsername);
      setUserId(storedUserId);
      fetchExpenses(storedUserId);

      fetch('http://localhost:5000/api/expense-config')
        .then(res => res.json())
        .then(data => {
          setCategories(data.categories);
          setExpenseTypes(data.expenseTypes);
        });

      fetch(`http://localhost:5000/api/users/${storedUserId}/settings`)
        .then(res => res.json())
        .then(data => {
          setCurrentBalance(data.currentBalance ?? 0);
          setRegularTransactions(data.regularTransactions ?? []);
        })
        .catch(console.error);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('username');
    navigate('/');
  };

  const fetchExpenses = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/expenses/${id}`);
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const handleUpdateExpense = async (id: string, updatedData: Omit<Expense, 'id'>) => {
    await fetch(`http://localhost:5000/api/expenses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData)
    });
    setEditingExpense(null);
    fetchExpenses(userId);
  };

  const handleDeleteExpense = async (id: string) => {
    await fetch(`http://localhost:5000/api/expenses/${id}`, { method: 'DELETE' });
    setEditingExpense(null);
    fetchExpenses(userId);
  };

  // ── Filtering ────────────────────────────────────────────────────────────────

  const applyTimeFilter = (expense: Expense): boolean => {
    if (filterTime === '') return true;
    const today = new Date();
    const expStr = toLocalDateStr(new Date(expense.date));
    if (filterTime === 'week') {
      return expStr >= toLocalDateStr(getWeekStart(today)) && expStr <= toLocalDateStr(today);
    }
    if (filterTime === 'month') {
      const d = new Date(expense.date);
      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    }
    if (filterTime === 'year') {
      return new Date(expense.date).getFullYear() === today.getFullYear();
    }
    return true;
  };

  // Fully filtered list — used for the table
  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === '' || expense.category === filterCategory;
    const matchesType = filterType === '' || expense.type === filterType;
    const amount = Number(expense.amount);
    const matchesMin = filterMin === '' || amount >= Number(filterMin);
    const matchesMax = filterMax === '' || amount <= Number(filterMax);
    return matchesSearch && matchesCategory && matchesType && matchesMin && matchesMax && applyTimeFilter(expense);
  });

  // Time-only filtered list — used for summary cards (unaffected by search/category/amount filters)
  const timeFilteredExpenses = expenses.filter(applyTimeFilter);

  // ── Summary calculations ─────────────────────────────────────────────────────

  const periodLabel = filterTime === 'week' ? 'Weekly' : filterTime === 'month' ? 'Monthly' : filterTime === 'year' ? 'Yearly' : '';

  const displayedSpent  = timeFilteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const displayedIncome = calculateActualIncome(regularTransactions, filterTime);
  // Net flow = income received in period − expenses in period, always.
  const netBalance = displayedIncome - displayedSpent;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-content-wrapper">
        <div className="dashboard-container">
          <header className="dashboard-header">
            <div className="header-title">
              <h2>Transactions</h2>
              <p>View and manage all your transactions</p>
            </div>
            <div className='header-user-section'>
              <span className='welcome-text'>Welcome, <strong>{username}</strong>!</span>
              <button onClick={handleLogout} className='logout-btn'>Logout</button>
            </div>
          </header>

          <div className="summary-boxes-container">
            <SummaryCard
              title="Transactions"
              value={`${filteredExpenses.length}`}
              icon={Receipt}
              type="expense"
            />
            <SummaryCard
              title={periodLabel ? `${periodLabel} Spent` : 'Total Spent'}
              value={formatCurrency(displayedSpent)}
              icon={Wallet}
              type="balance"
            />
            <SummaryCard
              title={periodLabel ? `${periodLabel} Income` : 'Total Income'}
              value={formatCurrency(displayedIncome)}
              icon={TrendingUp}
              type="income"
            />
            <SummaryCard
              title={periodLabel ? `${periodLabel} Net Flow` : 'Total Net Flow'}
              value={formatCurrency(netBalance)}
              icon={DollarSign}
              type={netBalance >= 0 ? 'income' : 'expense'}
            />
          </div>

          <main className='dashboard-main'>
            <AiExpenseBar
              userId={userId}
              categories={categories}
              expenseTypes={expenseTypes}
              onExpenseAdded={() => fetchExpenses(userId)}
            />

            <FilterControls
              searchTerm={searchTerm} setSearchTerm={setSearchTerm}
              showFilters={showFilters} setShowFilters={setShowFilters}
              filterCategory={filterCategory} setFilterCategory={setFilterCategory}
              filterType={filterType} setFilterType={setFilterType}
              filterTime={filterTime} setFilterTime={setFilterTime}
              filterMin={filterMin} setFilterMin={setFilterMin}
              filterMax={filterMax} setFilterMax={setFilterMax}
              categories={categories} expenseTypes={expenseTypes}
              onAddNew={() => setShowForm(true)}
            />

            {showForm && (
              <ExpenseModal
                userId={userId} categories={categories} expenseTypes={expenseTypes}
                onClose={() => setShowForm(false)} onExpenseAdded={() => fetchExpenses(userId)}
              />
            )}
            {editingExpense && (
              <EditExpenseModal
                expense={editingExpense}
                categories={categories}
                expenseTypes={expenseTypes}
                onClose={() => setEditingExpense(null)}
                onSave={handleUpdateExpense}
                onDelete={handleDeleteExpense}
              />
            )}

            <ExpenseTable expenses={filteredExpenses} onEditClick={setEditingExpense} />
          </main>
        </div>
      </div>
    </div>
  );
}
