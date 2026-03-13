//import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.scss'
import Transactions from './pages/Transactions'
import { Sidebar } from './components/Sidebar'
import { Link } from 'react-router-dom'
function App() {

  return (
    <BrowserRouter>
      <Link to="/transactions" style={{ margin: 40 }}>Transactions</Link>
      <div className='app-container'>
        <Routes>
          <Route path="/transactions" element={
            <div style={{ display: 'flex' }}>
              <Sidebar />
              <main style={{ flex: 1, padding: 40 }}><Transactions /></main>
            </div>} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
