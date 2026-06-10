import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { SubmitEventHandler } from 'react';
import { Receipt } from 'lucide-react';
import '../styles/AuthPage.scss';
import toast from 'react-hot-toast';
import { API_BASE } from '../constants/api';

export default function AuthPage() {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIslogin] = useState(true);
  const navigate = useNavigate();

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    const endpoint = isLogin ? 'login' : 'register';

    const response = await fetch(`${API_BASE}/${endpoint}`, {
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
          {isLogin ? t('auth.welcome_back') : t('auth.create_account')}
        </h2>
        <p className="auth-subtitle">
          {isLogin ? t('auth.login_subtitle') : t('auth.register_subtitle')}
        </p>

        <form onSubmit={handleSubmit} className='auth-form'>
          <input
            type="text"
            placeholder={t('auth.username')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="auth-input"
          />
          <input
            type="password"
            placeholder={t('auth.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="auth-input"
          />

          <button type="submit" className="auth-submit-btn">
            {isLogin ? t('auth.login') : t('auth.register')}
          </button>
        </form>

        <p className="auth-toggle-text">
          {isLogin ? t('auth.no_account') : t('auth.have_account')}
          <button
            type="button"
            onClick={() => setIslogin(!isLogin)}
            className="auth-toggle-btn"
          >
            {isLogin ? t('auth.register_here') : t('auth.login_here')}
          </button>
        </p>

      </div>
    </div>
  );
}