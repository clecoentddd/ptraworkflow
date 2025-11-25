// handlePay.js
// Handles payment transaction logic for PaymentPlanPage
import { getPaymentTransactions } from './paymentTransactionProjection';
import { createPaiementEffectueEvent } from './paymentTransactionSlice';

/**
 * Handles payment for a given month and amount.
 * @param {Object} params
 * @param {Object} params.user - Auth user object
 * @param {Object} params.paymentPlan - Payment plan object
 * @param {Array} params.eventLog - Workflow event log
 * @param {Function} params.appendWorkflowEvents - Function to append events
 * @param {Function} params.setPopup - Popup setter
 * @param {Function} params.setRefresh - Refresh setter
 * @param {String} month - Month string (YYYY-MM)
 * @param {Number} amount - Payment amount
 */
export function handlePay({ user, paymentPlan, eventLog, appendWorkflowEvents, setPopup, setRefresh }, month, amount) {
  const userEmail = user?.email || user?.name || 'anonymous';

  // Always read the latest event log
  const latestEventLog = typeof window !== 'undefined' && window.readWorkflowEventLog ? window.readWorkflowEventLog() : eventLog;
  console.log('[handlePay] user:', user);
  console.log('[handlePay] paymentPlan:', paymentPlan);
  console.log('[handlePay] latestEventLog:', latestEventLog);
  const paymentEntry = paymentPlan.payments.find(p => p.month === month);
  console.log('[handlePay] paymentEntry:', paymentEntry);
  if (!paymentEntry) return;
  const transactionId = paymentEntry.transactionId;

  // Find all transactions for this payment plan and month
  const transactionsForMonth = getPaymentTransactions(latestEventLog).filter(
    t => t.month === month && t.paymentPlanId === paymentPlan.paymentPlanId
  );
  console.log('[handlePay] transactionsForMonth:', transactionsForMonth);
  const paidTx = transactionsForMonth.find(t => t.status === 'Effectué' || t.status === 'Remboursé');
  console.log('[handlePay] paidTx:', paidTx);

  if (paidTx) {
    console.log('[handlePay] Already paid, showing red popup');
    setTimeout(() => setPopup({
      message: `Déjà Effectué: Transaction ${transactionId} le ${paidTx.timestamp?.slice(0, 10)} à ${paidTx.timestamp?.slice(11, 19)}`,
      color: '#d32f2f'
    }), 0);
    return; // Prevent further execution, so only red popup is shown
  }

  // Helper: get last day of month
  function getLastDayOfMonth(monthStr) {
    const [yyyy, mm] = monthStr.split('-').map(Number);
    return new Date(yyyy, mm, 0); // last day of month
  }

  const dueDate = getLastDayOfMonth(month).toISOString();
  const isReimbursement = amount < 0;

  // Only emit PaiementEffectué event
  const effectueEvent = createPaiementEffectueEvent({
    transactionId,
    paymentPlanId: paymentPlan.paymentPlanId,
    month,
    amount: isReimbursement ? amount : amount,
    userEmail
  });

  const appended = appendWorkflowEvents(effectueEvent);
  console.log('[handlePay] appended:', appended);
  // If payment was rejected, show red popup
  const rejectedEvent = appended.find(e => e.event === 'PaiementRejected' && e.transactionId === transactionId);
  if (rejectedEvent) {
    // Find the original PaiementEffectué event for this transactionId
    const latestEventLog = typeof window !== 'undefined' && window.readWorkflowEventLog ? window.readWorkflowEventLog() : eventLog;
    const originalPayment = latestEventLog.find(e => e.event === 'PaiementEffectué' && e.transactionId === transactionId);
    setTimeout(() => setPopup({
      message: `Déjà Effectué: Transaction ${transactionId} le ${originalPayment?.timestamp?.slice(0, 10)} à ${originalPayment?.timestamp?.slice(11, 19)}`,
      color: '#d32f2f'
    }), 0);
    return;
  }
  // Only show green popup if a new payment event was appended
  const confirmedEvent = appended.find(e => e.event === 'PaiementEffectué' && e.transactionId === transactionId);
  if (confirmedEvent) {
    setTimeout(() => setPopup({
      message: `Paiement Effectué pour transactionId ${transactionId} le ${confirmedEvent?.timestamp?.slice(0, 10)} à ${confirmedEvent?.timestamp?.slice(11, 19)}`,
      color: '#43a047'
    }), 0);
    setTimeout(() => setRefresh(r => r + 1), 100);
  }
}
