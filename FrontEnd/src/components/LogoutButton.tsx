import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/LogoutButton.scss';

/** Compact logout button for page headers — clears the session and returns to login. */
export function LogoutButton() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    navigate('/');
  };

  return (
    <button className="logout-btn" onClick={handleLogout}>
      <LogOut size={16} />
      <span>{t('transactions.logout')}</span>
    </button>
  );
}
