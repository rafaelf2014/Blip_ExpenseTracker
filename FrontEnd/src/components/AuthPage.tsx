import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); // Stops the page from refreshing

    // Send the data to our Node.js backend!
    const response = await fetch('http://localhost:5000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (response.ok) {
      alert("Registration successful!");
      // Send them to the main app
      navigate('/dashboard'); 
    } else {
      const data = await response.json();
      alert("Error: " + data.error);
    }
  };

  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h2>Register for Blip Expense Tracker</h2>
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', width: '300px', margin: '0 auto', gap: '10px' }}>
        <input 
          type="text" 
          placeholder="Username" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
          required
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required
        />
        <button type="submit">Register</button>
      </form>
    </div>
  );
}