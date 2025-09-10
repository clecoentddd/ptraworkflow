import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import EventSourcedProcess from './EventSourcedProcess';
import FinanceTracker from './FinanceTracker';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <nav style={{ padding: '16px', background: '#f0f0f0' }}>
          <Link to="/" style={{ marginRight: '16px' }}>Process</Link>
          <Link to="/finance">Finance Tracker</Link>
        </nav>

        <Routes>
          <Route path="/" element={<EventSourcedProcess />} />
          <Route path="/finance" element={<FinanceTracker />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
