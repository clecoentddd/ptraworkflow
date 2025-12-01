import React, { useState } from 'react';
import { readWorkflowEventLog } from '../workflowEventLog';
import { getStepState } from '../workflowProjections';
import { useReconciliationValidation } from './useReconciliationValidation';
import ProcessFlowStatusBar from '../StandardProcessFlow/ProcessFlowStatusBar';
import EventStream from '../sharedComponents/EventStream/EventStream';

export default function ReconciliationPage() {
  // Filter DecisionValidee events for event stream
  const allEvents = readWorkflowEventLog();
  const decisionEvents = allEvents.filter(e => e.event === 'DecisionValidee');

  const [refresh, setRefresh] = useState(0);
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

  // Wrap validate to force refresh
  function handleValidate() {
    validate();
    setTimeout(() => setRefresh(r => r + 1), 100);
  }

  return (
    <>
      <div className="workflow-main-container">
        <ProcessFlowStatusBar />
        <div className="event-stream-section" style={{ position: 'relative' }}>
          <div style={{ margin: '8px 0 16px 0', padding: '8px', background: '#f7f7f7', borderRadius: 6 }}>
            <div style={{ marginBottom: '8px' }}><b>ChangeId :</b> <span style={{ marginLeft: 8 }}>{reconciliation.changeId || <span style={{ color: '#888' }}>Aucun</span>}</span></div>
            <div style={{ marginBottom: '8px' }}><b>Période de droits :</b> <span style={{ marginLeft: 8 }}>{reconciliation.droitsPeriod ? `${reconciliation.droitsPeriod.startMonth} à ${reconciliation.droitsPeriod.endMonth}` : <span style={{ color: '#888' }}>Aucune</span>}</span></div>
            <div style={{ marginBottom: '8px' }}><b>PlanDeCalculId :</b> <span style={{ marginLeft: 8 }}>{reconciliation.planDeCalculId || <span style={{ color: '#888' }}>Aucun</span>}</span></div>
            <div style={{ marginBottom: '8px' }}><b>Dernier PaymentPlanId :</b> <span style={{ marginLeft: 8 }}>{reconciliation.paymentPlanId || <span style={{ color: '#888' }}>Aucun plan de paiement</span>}</span></div>
            <div style={{ marginTop: 12 }}>
              <button
                className="btn btn-primary"
                onClick={handleValidate}
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
            <table className="plan-calcul-table" style={{ borderCollapse: 'collapse', width: '100%', marginTop: 12 }}>
              <thead>
                <tr style={{ background: '#e9ecef' }}>
                  <th style={{ textAlign: 'left', padding: '8px 12px', minWidth: 90 }}>Mois</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', minWidth: 120 }}>Montant calculé</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', minWidth: 120 }}>Montant payé</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', minWidth: 120 }}>À payer / À rembourser</th>
                </tr>
              </thead>
              <tbody>
                {(!reconciliation.payload || reconciliation.payload.length === 0) && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: '#888', padding: '8px 12px' }}>Aucun calcul ou paiement à rapprocher.</td></tr>
                )}
                {reconciliation.payload && reconciliation.payload.map(row => (
                  <tr key={row.month}>
                    <td style={{ padding: '8px 12px', background: '#f7f7f7', fontWeight: 500 }}>{row.month}</td>
                    <td style={{ textAlign: 'right', padding: '8px 12px' }}>{Number(row.calculatedAmount).toFixed(2)}</td>
                    <td style={{ textAlign: 'right', padding: '8px 12px' }}>{Number(row.amountPaid).toFixed(2)}</td>
                    <td style={{ textAlign: 'right', padding: '8px 12px' }}>{Number(row.toPayOrReimburse).toFixed(2)}</td>
                  </tr>
                ))}
                {/* Summary row: Total calculé and paid */}
                {reconciliation.payload && reconciliation.payload.length > 0 && (
                  <tr style={{ fontWeight: 'bold', background: '#f5f5f5' }}>
                    <td style={{ padding: '8px 12px' }}>Total</td>
                    <td style={{ textAlign: 'right', padding: '8px 12px' }}>{reconciliation.payload.reduce((sum, r) => sum + r.calculatedAmount, 0).toFixed(2)} €</td>
                    <td style={{ textAlign: 'right', padding: '8px 12px' }}>{reconciliation.payload.reduce((sum, r) => sum + r.amountPaid, 0).toFixed(2)} €</td>
                    <td style={{ textAlign: 'right', padding: '8px 12px' }}>{reconciliation.payload.reduce((sum, r) => sum + r.toPayOrReimburse, 0).toFixed(2)} €</td>
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
