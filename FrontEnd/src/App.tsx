//import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.scss'
import AuthPage from './components/AuthPage'


function DummyDashboard() {
  return <h1>Welcome to the Expense Tracker!</h1>;
}

function App() {
  

  return (
    <BrowserRouter>
      <Routes>
          <Route path="/" element={<AuthPage />} /> 
          <Route path="/dashboard" element={<DummyDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
