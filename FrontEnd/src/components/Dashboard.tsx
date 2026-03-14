import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');

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
  }, [navigate]);

  // Handle logging out
  const handleLogout = () => {
    localStorage.removeItem('username'); // Clear the memory
    navigate('/'); // Send them back to login
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        <h2>Blip Expense Tracker</h2>
        <div>
          <span style={{ marginRight: '15px', fontWeight: 'bold' }}>Welcome, {username}!</span>
          <button onClick={handleLogout} style={{ padding: '5px 15px', cursor: 'pointer' }}>Logout</button>
        </div>
      </header>

      <main style={{ marginTop: '30px', textAlign: 'center' }}>
        <h3>Your Expenses</h3>
        <p style={{ color: 'gray' }}>Your expense list and form will go here...</p>
      </main>
    </div>
  );
}