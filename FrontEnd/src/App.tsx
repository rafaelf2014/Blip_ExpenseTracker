import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.scss'
import AuthPage from './components/AuthPage'
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import { CustomToaster } from './components/CustomToaster';
import { CurrencyProvider } from './Context/CurrencyContext';
import { DateProvider } from './Context/DateContext';
import './Context/i18n';

function App() {
  return (
    <BrowserRouter>
      <CurrencyProvider>
        <DateProvider>
          <CustomToaster />
          <Routes>
            <Route path="/" element={<AuthPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </DateProvider>
      </CurrencyProvider>
    </BrowserRouter>
  );
}

export default App
