// Payment Transaction Projection for EventZ
// Computes transaction status/history from events

export function getPaymentTransactions(eventLog) {
  // Map of transactionId to transaction object
  const transactions = {};
  for (const e of eventLog) {
    if (e.event === 'PaiementDemandé') {
      transactions[e.transactionId] = {
        transactionId: e.transactionId,
        paymentPlanId: e.paymentPlanId,
        month: e.month,
        dueDate: e.dueDate,
        amount: e.amount,
        status: 'Demandé',
        history: [e],
        reimbursed: false,
        paid: false,
      };
    }
    if (e.event === 'PaiementEffectué' && transactions[e.transactionId]) {
      // If amount < 0, treat as reimbursement
      if (e.amount < 0) {
        transactions[e.transactionId].status = 'Remboursé';
        transactions[e.transactionId].reimbursed = true;
      } else {
        transactions[e.transactionId].status = 'Effectué';
        transactions[e.transactionId].paid = true;
      }
      transactions[e.transactionId].history.push(e);
    }
  }
  // Reject duplicate transactions: only allow one 'Effectué' or 'Remboursé' per transactionId
  return Object.values(transactions).filter(t => !(t.paid && t.reimbursed));
}
