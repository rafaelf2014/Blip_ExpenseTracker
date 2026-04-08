import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { ExpenseModal } from '../components/ExpenseModal';
import { EditExpenseModal } from '../components/EditExpenseModal';
import { ExpenseTable, type Expense } from '../components/ExpenseTable';
import { FilterControls } from '../components/FilterControl';
import { SummaryBoxes } from '../components/SummaryBoxes';
import '../styles/Dashboard.scss';
import { AiExpenseBar } from '../components/AiExpenseBar';
import { initializeLLM } from '../components/llmService';
import { useTranslation } from 'react-i18next';


export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState('');

  const [showForm, setShowForm] = useState(false);

  const [categories, setCategories] = useState<string[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<string[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

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
    void initializeLLM(); // O carregamento fica em background
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

  // New Save Handler
  const handleUpdateExpense = async (id: string, updatedData: any) => {
    await fetch(`http://localhost:5000/api/expenses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData)
    });
    setEditingExpense(null);
    fetchExpenses(userId);
  };

  // New Delete Handler
  const handleDeleteExpense = async (id: string) => {
    await fetch(`http://localhost:5000/api/expenses/${id}`, {
      method: 'DELETE'
    });
    setEditingExpense(null);
    fetchExpenses(userId);
  };



  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === '' || expense.category === filterCategory;
    const matchesType = filterType === '' || expense.type === filterType;

    const amount = Number(expense.amount);
    const matchesMin = filterMin === '' || amount >= Number(filterMin);
    const matchesMax = filterMax === '' || amount <= Number(filterMax);

    let matchesTime = true;
    if (filterTime !== '') {
      const expenseDate = new Date(expense.date);
      const today = new Date();
      if (filterTime === 'week') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(today.getDate() - 7);
        matchesTime = expenseDate >= oneWeekAgo;
      } else if (filterTime === 'month') {
        matchesTime = expenseDate.getMonth() === today.getMonth() && expenseDate.getFullYear() === today.getFullYear();
      } else if (filterTime === 'year') {
        matchesTime = expenseDate.getFullYear() === today.getFullYear();
      }
    }
    return matchesSearch && matchesCategory && matchesType && matchesMin && matchesMax && matchesTime;
  });

  const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const transactionCount = expenses.length;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-content-wrapper">
        <div className="dashboard-container">
          <header className="dashboard-header">
            <div className="header-title">
              <h2>{t('header_dashboard.title')}</h2>
              <p>{t('header_dashboard.subtitle')}</p>
            </div>
            <div className='header-user-section'>
              <span className='welcome-text'>{t('header_dashboard.welcome')} <strong>{username}</strong>!</span>
              <button onClick={handleLogout} className='logout-btn'>
                {t('header_dashboard.logout')}
              </button>
            </div>
          </header>

          <main className='dashboard-main'>
            <SummaryBoxes totalSpent={totalSpent} transactionCount={transactionCount} />

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