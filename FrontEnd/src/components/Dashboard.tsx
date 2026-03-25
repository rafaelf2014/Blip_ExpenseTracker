import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Sidebar } from './Sidebar';
import { ExpenseModal } from './ExpenseModal';
import { ExpenseTable, type Expense } from './ExpenseTable'; 
import { FilterControls } from './FilterControl';
import { SummaryBoxes } from './SummaryBoxes';

export default function Dashboard() {
  const navigate = useNavigate();
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
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('username');
    navigate('/');
  };

  const fetchExpenses = async (id : string) => {
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
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', backgroundColor: '#0B1221', color: 'white', fontFamily: 'sans-serif' }}>
      <Sidebar />
      <div style={{ flex: '1', padding: '40px', flexDirection: 'column', display: 'flex' }}>
        <div style={{ width: '100%', maxWidth: '1600px', boxSizing: 'border-box', margin: '0 auto', padding: '40px', display: 'flex', flexDirection: 'column' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>Blip Expense Tracker</h2>
              <p style={{ margin: '5px 0 0 0', color: '#64748B', fontSize: '14px' }}>View and manage all your transactions</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ color: '#64748B', fontSize: '14px' }}>Welcome, <strong style={{ color: 'white' }}>{username}</strong>!</span>
              <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid #2A3441', color: '#94A3B8', borderRadius: '6px', cursor: 'pointer' }}>Logout</button>
            </div>
          </header>

          <main style={{ textAlign: 'center' }}>
            <SummaryBoxes totalSpent={totalSpent} transactionCount={transactionCount} />
            
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
            
            <ExpenseTable expenses={filteredExpenses} />
          </main>
        </div>
      </div>
    </div>
  );
}