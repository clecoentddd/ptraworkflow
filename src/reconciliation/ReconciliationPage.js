import React, { useState } from 'react';
import EventStream from '../components/EventStream';
import ProcessFlowStatusBar from '../sharedProjections/ProcessFlowStatusBar';
import '../planCalcul/PlanCalculPage.css';
import { useReconciliationValidation } from './useReconciliationValidation';
import { getStepState } from '../workflowProjections';
import { readWorkflowEventLog } from '../workflowEventLog';
import { getDeltaPerMonth } from './reconciliationProjection';

// Filter DecisionValidee events for event stream
const allEvents = readWorkflowEventLog();
const decisionEvents = allEvents.filter(e => e.event === 'DecisionValidee');

export default function ReconciliationPage() {
  const {
    reconciliation,
    calculationId,
    changeId,
    paymentPlanId,
    droitsPeriod,
    validate,
    eventLog
  } = useReconciliationValidation();

  // Disable button if DecisionValidee event exists for current changeId and calculationId
  const alreadyValidated = eventLog.some(e =>
    e.event === 'DecisionValidee' &&
    e.changeId === changeId &&
    e.planDeCalculId === calculationId
  );

  // Get workflowId from latest event with calculationId/changeId, fallback to latest workflowId
  let workflowId = eventLog.find(e => e.calculationId === calculationId && e.changeId === changeId)?.workflowId;
  if (!workflowId) {
    workflowId = [...eventLog].reverse().find(e => e.workflowId)?.workflowId;
  }
  // Get step 6 state
  const step6State = workflowId ? getStepState(eventLog, workflowId, 6).state : 'ToDo';

  // Raw projection state (use reconciliation array for consistency)
  const [showRaw, setShowRaw] = useState(false);
  const rawProjection = reconciliation;

  return (
    <>
      <div className="workflow-main-container">
        <ProcessFlowStatusBar />
        <div className="event-stream-section" style={{ position: 'relative' }}>
          <div style={{ margin: '8px 0 16px 0', padding: '8px', background: '#f7f7f7', borderRadius: 6 }}>
            <div><b>Dernier PaymentPlanId :</b> <span style={{ marginLeft: 8 }}>{reconciliation.paymentPlanId || <span style={{ color: '#888' }}>Aucun plan de paiement</span>}</span></div>
            <div><b>PlanDeCalculId :</b> <span style={{ marginLeft: 8 }}>{reconciliation.planDeCalculId || <span style={{ color: '#888' }}>Aucun</span>}</span></div>
            <div><b>ChangeId :</b> <span style={{ marginLeft: 8 }}>{reconciliation.changeId || <span style={{ color: '#888' }}>Aucun</span>}</span></div>
            <div><b>Période de droits :</b> <span style={{ marginLeft: 8 }}>{reconciliation.droitsPeriod ? `${reconciliation.droitsPeriod.startMonth} à ${reconciliation.droitsPeriod.endMonth}` : <span style={{ color: '#888' }}>Aucune</span>}</span></div>
            <div style={{ marginTop: 12 }}>
              <button
                className="btn btn-primary"
                onClick={validate}
                disabled={alreadyValidated || step6State !== 'Ouverte' || !calculationId || !changeId}
              >
                Valider Reconciliation
              </button>
              <button
                className="projection-btn"
                onClick={() => setShowRaw(r => !r)}
              >
                {showRaw ? 'Fermer' : 'Afficher Projection'}
              </button>
              {alreadyValidated && (
                <span style={{ color: '#388e3c', marginLeft: 12 }}>
                  ✔️ Reconciliation déjà validé pour ce jeu d'identifiants.
                </span>
              )}
            </div>
            {showRaw && (
              <div className="projection-popup">
                <button className="projection-close-btn" onClick={() => setShowRaw(false)}>Fermer</button>
                <strong>Projection (raw):</strong>
                <pre style={{ fontSize: 13, margin: 0, background: '#222', color: '#fff', padding: 16, borderRadius: 8 }}>
                  {JSON.stringify(rawProjection, null, 2)}
                </pre>
              </div>
            )}
          </div>
          <div className="plan-calcul-main-section">
            <h3 style={{ marginBottom: 12 }}>Reconciliation Calcul / Paiement</h3>
            <table className="plan-calcul-table">
              <thead>
                <tr>
                  <th>Mois</th>
                  <th>Montant calculé</th>
                  <th>Montant payé</th>
                  <th>À payer / À rembourser</th>
                </tr>
              </thead>
              <tbody>
                {(!reconciliation.payload || reconciliation.payload.length === 0) && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: '#888' }}>Aucun calcul ou paiement à rapprocher.</td></tr>
                )}
                {reconciliation.payload && reconciliation.payload.map(row => (
                  <tr key={row.month}>
                    <td>{row.month}</td>
                    <td>{Number(row.calculatedAmount).toFixed(2)}</td>
                    <td>{Number(row.amountPaid).toFixed(2)}</td>
                    <td>{Number(row.toPayOrReimburse).toFixed(2)}</td>
                  </tr>
                ))}
                {/* Summary row: Total calculé and paid */}
                {reconciliation.payload && reconciliation.payload.length > 0 && (
                  <tr style={{ fontWeight: 'bold', background: '#f5f5f5' }}>
                    <td>Total calculé</td>
                    <td>{reconciliation.payload.reduce((sum, r) => sum + r.calculatedAmount, 0).toFixed(2)} €</td>
                    <td>{reconciliation.payload.reduce((sum, r) => sum + r.amountPaid, 0).toFixed(2)} €</td>
                    <td></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <EventStream
          events={decisionEvents}
          showTitle={true}
          maxHeight={320}
          filter={null}
        />
      </div>
    </>
  );
}
