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
      };
    }
    if (e.event === 'PaiementEffectué' && transactions[e.transactionId]) {
      transactions[e.transactionId].status = 'Effectué';
      transactions[e.transactionId].history.push(e);
    }
  }
  // Return as array
  return Object.values(transactions);
}
