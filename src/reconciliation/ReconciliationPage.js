import React, { useState } from 'react';
import ProcessFlowStatusBar from '../sharedProjections/ProcessFlowStatusBar';
import '../planCalcul/PlanCalculPage.css';
import { useReconciliationValidation } from './useReconciliationValidation';
import { getStepState } from '../workflowProjections';
import { readWorkflowEventLog } from '../workflowEventLog';
import { getDeltaPerMonth } from './reconciliationProjection';

export default function ReconciliationPage() {
  const {
    reconciliation,
    calculationId,
    changeId,
    paymentPlanId,
    alreadyValidated,
    validate,
    eventLog
  } = useReconciliationValidation();

  // Get workflowId from latest event with calculationId/changeId
  const workflowId = eventLog.find(e => e.calculationId === calculationId && e.changeId === changeId)?.workflowId;
  // Get step 6 state
  const step6State = workflowId ? getStepState(eventLog, workflowId, 6).state : 'ToDo';

  // Raw projection state
  const [showRaw, setShowRaw] = useState(false);
  const rawProjection = getDeltaPerMonth(readWorkflowEventLog());

  return (
    <div className="plandecalcul-page-container" style={{ maxWidth: 1100, margin: '40px auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
      <ProcessFlowStatusBar />
      <div style={{ margin: '8px 0 16px 0', padding: '8px', background: '#f7f7f7', borderRadius: 6 }}>
        <div><b>Dernier PaymentPlanId :</b> <span style={{ marginLeft: 8 }}>{paymentPlanId || <span style={{ color: '#888' }}>Aucun plan de paiement</span>}</span></div>
        <div><b>CalculationId :</b> <span style={{ marginLeft: 8 }}>{calculationId || <span style={{ color: '#888' }}>Aucun</span>}</span></div>
        <div><b>ChangeId :</b> <span style={{ marginLeft: 8 }}>{changeId || <span style={{ color: '#888' }}>Aucun</span>}</span></div>
        <div style={{ marginTop: 12 }}>
          <button
            className="btn btn-primary"
            onClick={validate}
            disabled={alreadyValidated || step6State !== 'Ouverte' || !calculationId || !changeId || !paymentPlanId}
          >
            Valider Rapprochement
          </button>
          <button
            className="btn btn-secondary"
            style={{ marginLeft: 12 }}
            onClick={() => setShowRaw(r => !r)}
          >
            {showRaw ? 'Masquer projection brute' : 'Afficher projection brute'}
          </button>
          {alreadyValidated && (
            <span style={{ color: '#388e3c', marginLeft: 12 }}>
              ✔️ Rapprochement déjà validé pour ce jeu d'identifiants.
            </span>
          )}
        </div>
        {showRaw && (
          <pre style={{ marginTop: 16, background: '#222', color: '#fff', padding: 12, borderRadius: 6, fontSize: 13 }}>
            {JSON.stringify(rawProjection, null, 2)}
          </pre>
        )}
      </div>
      <div className="plan-calcul-main-section">
        <h3 style={{ marginBottom: 12 }}>Rapprochement Calcul / Paiement</h3>
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
            {reconciliation.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center', color: '#888' }}>Aucun calcul ou paiement à rapprocher.</td></tr>
            )}
            {reconciliation.map(row => (
              <tr key={row.month}>
                <td>{row.month}</td>
                <td>{row.calculatedAmount}</td>
                <td>{row.amountPaid}</td>
                <td>{row.toPayOrReimburse}</td>
              </tr>
            ))}
            {/* Summary row: Total calculé and paid */}
            {reconciliation.length > 0 && (
              <tr style={{ fontWeight: 'bold', background: '#f5f5f5' }}>
                <td>Total calculé</td>
                <td>{reconciliation.reduce((sum, r) => sum + r.calculatedAmount, 0).toFixed(2)} €</td>
                <td>{reconciliation.reduce((sum, r) => sum + r.amountPaid, 0).toFixed(2)} €</td>
                <td></td>
              </tr>
            )}
            {/* Last calculation row for current changeId */}
            {reconciliation.length > 0 && (
              <tr style={{ background: '#e0f7fa' }}>
                <td colSpan={4}>
                  Dernier calcul enregistré<br />
                  changeId: {reconciliation[0].changeId} &nbsp; {reconciliation[reconciliation.length-1].calculatedAmount} € &nbsp; {reconciliation[reconciliation.length-1].amountPaid} €
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
