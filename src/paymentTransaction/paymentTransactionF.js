// paymentTransactionF.js
// EventZ F function for payment transactions: enforces business rules for payments

/**
 * F(eventLog, newEvent): Given the full event log and a new payment event, returns zero or more new events to append.
 * Enforces: Only one PaiementEffectué per transactionId. If already paid, emits PaiementRejected.
 */
export function paymentTransactionF(eventLog, newEvent) {
  const { event, transactionId } = newEvent;
  const emitted = [];
  if (!transactionId) return emitted;

  // Only enforce for PaiementEffectué
  if (event === 'PaiementEffectué') {
    const alreadyPaid = eventLog.some(e => e.event === 'PaiementEffectué' && e.transactionId === transactionId);
    if (alreadyPaid) {
      emitted.push({
        event: 'PaiementRejected',
        transactionId,
        reason: 'Payment already made for this transactionId',
        timestamp: new Date().toISOString()
      });
      return emitted;
    }
  }
  // Allow the event
  return emitted;
}
