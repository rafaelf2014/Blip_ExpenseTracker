import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './App.scss'
import AuthPage from './components/AuthPage'
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import { CustomToaster } from './components/CustomToaster';
import { CurrencyProvider } from './Context/CurrencyContext';
import { DateProvider } from './Context/DateContext';
import { AiChatBot } from './components/AiChatBot';
import './Context/i18n';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!localStorage.getItem('userId')) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <CurrencyProvider>
        <DateProvider>
          <CustomToaster />
          <Routes>
            <Route path="/" element={<AuthPage />} />
            <Route path="/dashboard"    element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
            <Route path="/analytics"    element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/settings"     element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          </Routes>
          <AiChatBot />
        </DateProvider>
      </CurrencyProvider>
    </BrowserRouter>
  );
}

export default App
