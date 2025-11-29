import React, { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import EventSourcedProcess from './EventSourcedProcess';
import EventzFinanceTracker from './ressources/EventzFinanceTracker';
import PaymentPlanPage from './paymentPlan/PaymentPlanPage';
import DroitsPeriodPage from './droits/DroitsPeriodPage';
import CommeGit from './CommeGit';
import TodoWorkflow from './TodoWorkflow/TodoWorkflow';
import PlanCalculPage from './planCalcul/PlanCalculPage';
import ReconciliationPage from './reconciliation/ReconciliationPage';
import './App.css';
import { AuthButtons } from './auth/AuthButtons';
import { projectRessourceMutation } from './sharedProjections/mutationHistoryProjection';
import TodoMutationRessources from './todoMutationRessources/TodoMutationRessources';

function App() {
  const { isAuthenticated, user, isLoading, getAccessTokenSilently } = useAuth0();

  // Debug: log projection output (replace eventLog with real data as needed)
  const eventLog = [];
  const projection = projectRessourceMutation(eventLog);
  console.log('RessourceMutation Projection:', projection);
  const openMutationChangeId = projection.openMutationChangeId;

  useEffect(() => {
    console.log('[Auth0] isAuthenticated:', isAuthenticated);
    console.log('[Auth0] user:', user);
    console.log('[Auth0] isLoading:', isLoading);
    if (!isAuthenticated && !isLoading) {
      getAccessTokenSilently()
        .then(token => {
          console.log('[Auth0] Silent authentication token:', token);
        })
        .catch(err => {
          console.log('[Auth0] Silent authentication failed:', err);
        });
    }
  }, [isAuthenticated, isLoading, user, getAccessTokenSilently]);

  const RessourcesMutationWorkflow = require('./CréerMutationDeRessources/RessourcesMutationWorkflow').default;
  const MutationDeRessources = require('./MutationDeRessources').default;
  return (
    <Router>
      <div className="App">
        <nav style={{ padding: '16px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Link to="/" style={{ marginRight: '16px' }}>Process</Link>
            <Link to="/mutationDeRessources" style={{ marginRight: '16px' }}>Mutation de Ressources</Link>
            <Link to="/droits" style={{ marginRight: '16px' }}>Droits</Link>
            <Link to="/finance" style={{ marginRight: '16px' }}>Ressources</Link>
            <Link to="/plan-calcul" style={{ marginRight: '16px' }}>Plan de Calcul</Link>
            <Link to="/reconciliation" style={{ marginRight: '16px' }}>Décision</Link>
            <Link to="/payment-plan" style={{ marginRight: '16px' }}>Payment Plan</Link>
            <Link to="/git">Comme Git</Link>
          </div>
          <AuthButtons />
        </nav>

        <Routes>
          <Route path="/" element={<EventSourcedProcess />} />
          <Route path="/mutationDeRessources" element={<MutationDeRessources />} />
          <Route path="/finance" element={<EventzFinanceTracker />} />
          <Route path="/droits" element={<DroitsPeriodPage />} />
          <Route path="/plan-calcul" element={<PlanCalculPage />} />
          <Route path="/git" element={<CommeGit />} />
          <Route path="/todos" element={<TodoWorkflow />} />
          <Route path="/reconciliation" element={<ReconciliationPage />} />
          <Route path="/payment-plan" element={<PaymentPlanPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
