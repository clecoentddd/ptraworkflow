// Payment Transaction Slice for EventZ
// Handles payment actions and events (PaiementDemandé, PaiementEffectué)

import { v4 as uuidv4 } from 'uuid';

// Command: FaireUnPaiement
export function createPaiementDemandeCommand({ paymentPlanId, month, dueDate, amount }) {
  return {
    command: 'FaireUnPaiement',
    transactionId: uuidv4(),
    paymentPlanId,
    month,
    dueDate,
    amount,
    ts: new Date().toISOString(),
  };
}

// Event: PaiementDemandé
export function createPaiementDemandeEvent({ transactionId, paymentPlanId, month, dueDate, amount }) {
  return {
    event: 'PaiementDemandé',
    transactionId,
    paymentPlanId,
    month,
    dueDate,
    amount,
    ts: new Date().toISOString(),
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
    ts: new Date().toISOString(),
  };
}
