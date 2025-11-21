import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import EventSourcedProcess from './EventSourcedProcess';
import EventzFinanceTracker from './ressources/EventzFinanceTracker';
import DroitsPeriodPage from './droits/DroitsPeriodPage';
import CommeGit from './CommeGit';
import EventzTodoList from './EventzTodoList';
import PlanCalculPage from './planCalcul/PlanCalculPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <nav style={{ padding: '16px', background: '#f0f0f0' }}>
          <Link to="/" style={{ marginRight: '16px' }}>Process</Link>
          <Link to="/droits" style={{ marginRight: '16px' }}>Droits</Link>
          <Link to="/finance" style={{ marginRight: '16px' }}>Finance Tracker</Link>
          <Link to="/plan-calcul" style={{ marginRight: '16px' }}>Plan de Calcul</Link>
          <Link to="/git">Comme Git</Link> {/* ✅ new link */}
          <Link to="/todos" style={{ marginRight: '16px' }}>Todo List</Link>
        </nav>

        <Routes>
          <Route path="/" element={<EventSourcedProcess />} />
          <Route path="/finance" element={<EventzFinanceTracker />} />
          <Route path="/droits" element={<DroitsPeriodPage />} />
          <Route path="/plan-calcul" element={<PlanCalculPage />} />
          <Route path="/git" element={<CommeGit />} />
          <Route path="/todos" element={<EventzTodoList />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
