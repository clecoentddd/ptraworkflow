
import React from 'react';
import ProcessFlowStatusBar from '../sharedProjections/ProcessFlowStatusBar';
import '../planCalcul/PlanCalculPage.css';
import { useReconciliationValidation } from './useReconciliationValidation';



export default function ReconciliationPage() {
  const {
    reconciliation,
    calculationId,
    changeId,
    paymentPlanId,
    alreadyValidated,
    validate
  } = useReconciliationValidation();

  return (
    <div className="plandecalcul-page-container" style={{ maxWidth: 1100, margin: '40px auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
      <ProcessFlowStatusBar />
      <div style={{ margin: '8px 0 16px 0', padding: '8px', background: '#f7f7f7', borderRadius: 6 }}>
        <b>Dernier PaymentPlanId :</b>
        <span style={{ marginLeft: 8 }}>{paymentPlanId || <span style={{ color: '#888' }}>Aucun plan de paiement</span>}</span>
        <div style={{ marginTop: 12 }}>
          <button
            className="btn btn-primary"
            onClick={validate}
            disabled={alreadyValidated || !calculationId || !changeId || !paymentPlanId}
          >
            Valider Rapprochement
          </button>
          {alreadyValidated && (
            <span style={{ color: '#388e3c', marginLeft: 12 }}>
              ✔️ Rapprochement déjà validé pour ce jeu d'identifiants.
            </span>
          )}
        </div>
      </div>
      <div className="plan-calcul-main-section">
        <h3 style={{ marginBottom: 12 }}>Rapprochement Calcul / Paiement</h3>
        <table className="plan-calcul-table">
          <thead>
            <tr>
              <th>Mois</th>
              <th>Montant calculé</th>
              <th>Montant payé</th>
              <th>Delta</th>
              <th>CalculationId</th>
              <th>ChangeId</th>
            </tr>
          </thead>
          <tbody>
            {reconciliation.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: '#888' }}>Aucun calcul ou paiement à rapprocher.</td></tr>
            )}
            {reconciliation.map(row => (
              <tr key={row.month}>
                <td>{row.month}</td>
                <td>{row.calculatedAmount}</td>
                <td>{row.amountPaid}</td>
                <td style={{ color: row.delta === 0 ? '#388e3c' : '#d32f2f', fontWeight: 600 }}>{row.delta}</td>
                <td>{row.calculationId}</td>
                <td>{row.changeId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
