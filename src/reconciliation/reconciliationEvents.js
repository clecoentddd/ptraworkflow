// reconciliationEvents.js
// Event creator for reconciliation validation (step 6)
import { v4 as uuidv4 } from 'uuid';


// Accepts the full reconciliation object and includes toPayOrReimburse per month
export function createDecisionValideeEvent({ changeId, planDeCalculId, paymentPlanId, droitsPeriod, payload }) {
  return {
    event: 'DecisionValidee',
    decisionId: uuidv4(),
    changeId,
    planDeCalculId,
    paymentPlanId,
    droitsPeriod,
    payload, // full array with toPayOrReimburse per month
  timestamp: new Date().toISOString()
  };
}
