import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Sidebar } from './Sidebar';
import { ExpenseModal } from './ExpenseModal';
import { ExpenseTable, type Expense } from './ExpenseTable'; 

export default function Dashboard() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState('');

  const [showForm, setShowForm] = useState(false);

  const [categories, setCategories] = useState<string[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<string[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

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


  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw' }}>
      <Sidebar />
      <div style={{ flex: '1', padding: '40px', flexDirection: 'column', display: 'flex', gap: '30px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
          <h2>Blip Expense Tracker</h2>
          <div>
            <span style={{ marginLeft: '15px', marginRight: '15px', fontWeight: 'bold' }}>Welcome, {username}!</span>
            <button onClick={handleLogout} style={{ padding: '5px 15px', cursor: 'pointer' }}>Logout</button>
          </div>
        </header>

        <main style={{ marginTop: '30px', textAlign: 'center' }}>
          <button
            onClick={() => setShowForm(true)}
            style={{ padding: '10px 20px', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Add New Expense
          </button>

          {showForm && (
            <ExpenseModal
              userId={userId}
              categories={categories}
              expenseTypes={expenseTypes}
              onClose={() => setShowForm(false)}
              onExpenseAdded={() => fetchExpenses(userId)}
            />
          )} 
          <ExpenseTable expenses={expenses} />
        </main>
      </div>
    </div>
  );
}