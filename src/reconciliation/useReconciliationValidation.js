// useReconciliationValidation.js
// React hook for reconciliation validation logic
import { useState, useMemo } from 'react';
import { readWorkflowEventLog, appendWorkflowEvents } from '../workflowEventLog';
import { getDeltaPerMonth, isDecisionValidated } from './reconciliationProjection';
import { createDecisionValideeEvent } from './reconciliationEvents';

export function useReconciliationValidation() {
  const [eventLog, setEventLog] = useState(() => readWorkflowEventLog());
  const {
    deltaPerMonth,
    calculationId,
    changeId,
    paymentPlanId
  } = useMemo(() => getDeltaPerMonth(eventLog), [eventLog]);
  const alreadyValidated = useMemo(() => isDecisionValidated(eventLog), [eventLog]);

  function validate() {
    // All business logic is in the projection
    if (alreadyValidated) return false;
    if (!calculationId || !changeId || !paymentPlanId) return false;
    const event = createDecisionValideeEvent({
      changeId,
      planDeCalculId: calculationId,
      paymentPlanId,
      deltaPerMonth
    });
  appendWorkflowEvents(event);
  return true;
  }

  // Build a reconciliation array for the table UI
  const reconciliation = Object.keys(deltaPerMonth || {}).map(month => ({
    month,
    calculatedAmount: 0, // Not tracked in deltaPerMonth, can be added if needed
    amountPaid: 0, // Not tracked in deltaPerMonth, can be added if needed
    delta: deltaPerMonth[month],
    calculationId,
    changeId
  }));

  return {
    reconciliation,
    deltaPerMonth,
    calculationId,
    changeId,
    paymentPlanId,
    alreadyValidated,
    validate,
    eventLog,
  };
}
