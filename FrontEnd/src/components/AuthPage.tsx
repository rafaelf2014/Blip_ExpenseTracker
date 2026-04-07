import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SubmitEventHandler } from 'react';
import { Receipt } from 'lucide-react';
import '../styles/AuthPage.scss';
import toast from 'react-hot-toast';

export default function AuthPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIslogin] = useState(false);
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
        localStorage.setItem('username', username);
        localStorage.setItem('userId', data.user.id);
        navigate('/dashboard');
      } else {
        toast.success(data.message + " You can now login.");
        setIslogin(true);
        setPassword('');
      }
    } else {
      toast.error("Error: " + data.error);
    }
  };

  return (
    <div className="auth-page-container">

      <div className="auth-card">

        <div className="auth-logo">
          <Receipt size={36} color="white" />
        </div>

        <h2 className="auth-title">
          {isLogin ? "Welcome Back" : "Create an Account"}
        </h2>
        <p className="auth-subtitle">
          {isLogin ? "Enter your details to access your dashboard." : "Sign up to start tracking your expenses."}
        </p>

        <form onSubmit={handleSubmit} className='auth-form'>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="auth-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="auth-input"
          />

          <button type="submit" className="auth-submit-btn">
            {isLogin ? "Login" : "Register"}
          </button>
        </form>

        <p className="auth-toggle-text">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => setIslogin(!isLogin)}
            className="auth-toggle-btn"
          >
            {isLogin ? "Register here" : "Login here"}
          </button>
        </p>

      </div>
    </div>
  );
}