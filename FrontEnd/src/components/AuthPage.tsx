import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SubmitEventHandler } from 'react';

export default function AuthPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIslogin] = useState(false);
  const navigate = useNavigate();

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault(); // Stops the page from refreshing

    const endpoint = isLogin ? 'api/login' : 'api/register';

    // Send the data to our Node.js backend!
    const response = await fetch(`http://localhost:5000/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok) {
      alert(data.message);
      localStorage.setItem('username', username);
      // Send them to the main app
      navigate('/dashboard'); 
    } else {
      alert("Error: " + data.error);
    }
  };

  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h2>{isLogin ? "Login in to" : "Register for"} Blip Expense Tracker</h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: '300px', margin: '0 auto', gap: '10px' }}>
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
        <button type="submit">{isLogin ? "Login" : "Register"}</button>
      </form>

      <p style={{ marginTop: '20px' }}>
        {isLogin ? "Don't have an account?" : "Already have an account?"} 
        <button
            type="button"
            onClick={() => setIslogin(!isLogin)}
            style={{background: 'none', border: 'none', color: 'blue', cursor: 'pointer', textDecoration: 'underline', marginLeft: '5px'}}>
          {isLogin ? "Register here" : "Login here"}
        </button>
      </p>
    </div>
  );
}