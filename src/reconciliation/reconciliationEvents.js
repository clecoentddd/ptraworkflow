// reconciliationEvents.js
// Event creator for reconciliation validation (step 6)
import { v4 as uuidv4 } from 'uuid';

export function createDecisionValideeEvent({ changeId, planDeCalculId, paymentPlanId, deltaPerMonth, payments }) {
  return {
    event: 'DecisionValidee',
    decisionId: uuidv4(),
    changeId,
    planDeCalculId,
    paymentPlanId,
    payload: {
      deltaPerMonth,
      payments
    },
    ts: new Date().toISOString()
  };
}
