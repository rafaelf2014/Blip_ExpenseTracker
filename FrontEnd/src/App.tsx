//import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.scss'
import AuthPage from './components/AuthPage'
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Settings from './pages/Settings';
import { CustomToaster } from './components/CustomToaster';
import { CurrencyProvider } from './Context/CurrencyContext';
import { DateProvider } from './Context/DateContext';
import './Context/i18n.ts';
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
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </DateProvider>
      </CurrencyProvider>
    </BrowserRouter>
  );
}

export default App
