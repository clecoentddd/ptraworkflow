// Payment Transaction Events and Command Creators
import { v4 as uuidv4 } from 'uuid';

export function createPaiementDemandeCommand({ paymentPlanId, month, dueDate, amount }) {
  return {
    command: 'FaireUnPaiement',
    transactionId: uuidv4(),
    paymentPlanId,
    month,
    dueDate,
    amount,
  timestamp: new Date().toISOString(),
  };
}

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
