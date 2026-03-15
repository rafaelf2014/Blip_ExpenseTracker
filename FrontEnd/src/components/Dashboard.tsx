import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';

// Define the shape of an expense object for better type checking
interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // This runs exactly once when the Dashboard first opens
  useEffect(() => {
    const storedUsername = localStorage.getItem('username');

    if (!storedUsername) {
      // Security check: If they aren't logged in, kick them out to the Auth page!
      navigate('/');
    } else {
      // If they are logged in, set their name so we can display it
      setUsername(storedUsername);
    }

    fetch('http://localhost:5000/api/expenses')
      .then(res => res.json())
      .then(data => setExpenses(data));

  }, [navigate]);

  // Calculate total expenses for the month (if needed in the future)
  //const totalExpenses = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);

  // Handle logging out
  const handleLogout = () => {
    localStorage.removeItem('username'); // Clear the memory
    navigate('/'); // Send them back to login
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

        <section style={{ backgroundColor: '#1E293B', borderRadius: '16px', padding: '24px', border: '1px solid #334155' }}>
          <h3 style={{ margin: '0 0 20px 0' }}>Recent Transactions</h3>

          {expenses.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#94A3B8', borderBottom: '1px solid #334155' }}>
                  <th style={{ padding: '12px' }}>Description</th>
                  <th style={{ padding: '12px' }}>Category</th>
                  <th style={{ padding: '12px' }}>Amount</th>
                  <th style={{ padding: '12px' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp.id} style={{ borderBottom: '1px solid #0F172A' }}>
                    <td style={{ padding: '12px' }}>{exp.description}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ backgroundColor: '#334155', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem' }}>
                        {exp.category}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: '#EF4444', fontWeight: 'bold' }}>
                      € {Number(exp.amount).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px', color: '#94A3B8', fontSize: '0.9rem' }}>{exp.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: '#94A3B8' }}>There are no transactions to display...</p>
          )}
        </section>
      </div>
    </div>
  );
}