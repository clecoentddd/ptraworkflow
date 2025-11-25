// Payment Transaction Slice for EventZ
// Handles payment actions and events (PaiementDemandé, PaiementEffectué)

import { v4 as uuidv4 } from 'uuid';



// Event: PaiementDemandé
export function createPaiementDemandeEvent({ transactionId, paymentPlanId, month, dueDate, amount }) {
  return {
    event: 'PaiementDemandé',
    transactionId,
    paymentPlanId,
    month,
    dueDate,
    amount,
    timestamp: new Date().toISOString(),
  };
}

// Event: PaiementEffectué
export function createPaiementEffectueEvent({ transactionId, paymentPlanId, month, amount }) {
  return {
    event: 'PaiementEffectué',
    transactionId,
    paymentPlanId,
    month,
    amount,
    timestamp: new Date().toISOString(),
  };
}
