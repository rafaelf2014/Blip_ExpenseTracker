import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SubmitEventHandler } from 'react';
import { Receipt } from 'lucide-react'; // Added the logo icon!

export default function AuthPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIslogin] = useState(false); // Defaulting to Register based on your code, though you might want true here usually!
  const navigate = useNavigate();

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    const endpoint = isLogin ? 'api/login' : 'api/register';

    const response = await fetch(`http://localhost:5000/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok) {
      if (isLogin) {
          // Only login gives back the user object in your current backend setup!
          localStorage.setItem('username', username);
          localStorage.setItem('userId', data.user.id);
          navigate('/dashboard'); 
      } else {
          alert(data.message + " You can now login.");
          setIslogin(true); // Switch to login screen automatically after registering!
          setPassword(''); // Clear password for safety
      }
    } else {
      alert("Error: " + data.error);
    }
  };

  return (
    // Full screen dark background
    <div style={{ minHeight: '100vh', width: '100vw', backgroundColor: '#0B1221', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      
      {/* The Login Card */}
      <div style={{ backgroundColor: '#151E2D', padding: '40px', borderRadius: '16px', border: '1px solid #2A3441', width: '100%', maxWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', textAlign: 'center' }}>
        
        {/* The Brand Logo (Matching the Sidebar!) */}
        <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #06B6D4, #0891B2)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', boxShadow: '0 4px 15px rgba(6, 182, 212, 0.3)' }}>
          <Receipt size={36} color="white" />
        </div>

        <h2 style={{ margin: '0 0 8px 0', color: 'white', fontSize: '24px' }}>
          {isLogin ? "Welcome Back" : "Create an Account"}
        </h2>
        <p style={{ margin: '0 0 30px 0', color: '#94A3B8', fontSize: '15px' }}>
          {isLogin ? "Enter your details to access your dashboard." : "Sign up to start tracking your expenses."}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input 
            type="text" 
            placeholder="Username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required
            style={{ padding: '14px 16px', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '10px', color: 'white', fontSize: '16px', outline: 'none' }}
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required
            style={{ padding: '14px 16px', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '10px', color: 'white', fontSize: '16px', outline: 'none' }}
          />
          
          <button type="submit" style={{ padding: '14px', backgroundColor: '#06B6D4', color: 'white', fontWeight: 'bold', fontSize: '16px', border: 'none', borderRadius: '10px', cursor: 'pointer', marginTop: '10px', transition: 'background-color 0.2s' }}>
            {isLogin ? "Login" : "Register"}
          </button>
        </form>

        <p style={{ marginTop: '30px', color: '#94A3B8', fontSize: '14px' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "} 
          <button
            type="button"
            onClick={() => setIslogin(!isLogin)}
            style={{ background: 'none', border: 'none', color: '#06B6D4', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', padding: 0 }}
          >
            {isLogin ? "Register here" : "Login here"}
          </button>
        </p>

      </div>
    </div>
  );
}