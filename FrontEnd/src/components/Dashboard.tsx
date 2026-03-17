import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';


export default function Dashboard() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');
  const [date, setDate] = useState('');

  const [categories, setCategories] = useState<string[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<string[]>([]);

  // This runs exactly once when the Dashboard first opens
  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const storedUserId = localStorage.getItem('userId');

    if (!storedUsername || !storedUserId) {
      // Security check: If they aren't logged in, kick them out to the Auth page!
      navigate('/');
    } else {
      // If they are logged in, set their name so we can display it
      setUsername(storedUsername);
      setUserId(storedUserId);
    

      fetch('http://localhost:5000/api/expense-config')
        .then(res => res.json())
        .then(data => {
          setCategories(data.categories);
          setExpenseTypes(data.expenseTypes);
          if (data.categories.length > 0) setCategory(data.categories[0]);
          if (data.expenseTypes.length > 0) setType(data.expenseTypes[0]);
        });
    }
  }, [navigate]);


  // Handle logging out
  const handleLogout = () => {
    localStorage.removeItem('username'); // Clear the memory
    navigate('/'); // Send them back to login
  };

  const handleAddExpense = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const response = await fetch('http://localhost:5000/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({userId, description, amount, category, type, date})
    });

    if (response.ok) {
      alert('Expense added successfully!');
      setDescription('');
      setAmount('');
      setShowForm(false);
    } else {
      alert('Failed to add expense. Please try again.');
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
            onClick={() => setShowForm(!showForm)}
            style={{ padding: '10px 20px', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            {showForm ? 'Cancel' : 'Add New Expense'}
          </button>

          {showForm && (
            <form onSubmit={handleAddExpense} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
              <input
                type="number"
                placeholder="Amount"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
              <select value={category} onChange={(e) => setCategory(e.target.value)} required>
                {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <select value={type} onChange={(e) => setType(e.target.value)} required>
                {expenseTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Save Expense
              </button>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}