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

  // Find the latest PlanDeCalculEffectué event for each changeId/month
  const calcEvents = eventLog.filter(e => e.event === "PlanDeCalculEffectué");
  const paymentEvents = eventLog.filter(e => e.event === "PaymentPlanCreated");
  const latestCalculated = {};
  const latestPaid = {};
  let calcId = null;
  let chgId = null;
  calcEvents.forEach(e => {
    calcId = e.calculationId || calcId;
    chgId = e.changeId || chgId;
    e.payload.ressources.forEach(res => {
      // Always use the latest calculation for each month
      latestCalculated[res.month] = res.amount / 10;
    });
  });
  paymentEvents.forEach(e => {
    e.payload.payments.forEach(pay => {
      latestPaid[pay.month] = pay.amountPaid / 10;
    });
  });
  const allMonths = Array.from(new Set([...Object.keys(latestCalculated), ...Object.keys(latestPaid)])).sort();
  const reconciliation = allMonths.map(month => ({
    month,
    calculatedAmount: latestCalculated[month] || 0, // This is the calculation, not the delta
    amountPaid: latestPaid[month] || 0,
    toPayOrReimburse: (latestCalculated[month] || 0) - (latestPaid[month] || 0),
    calculationId: calcId,
    changeId: chgId
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
