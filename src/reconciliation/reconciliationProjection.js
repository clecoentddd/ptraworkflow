// Returns { deltaPerMonth, calculationId, changeId, paymentPlanId }
export function getDeltaPerMonth(events) {
  // Find the latest PlanDeCalculEffectué event
  const latestCalcEvent = [...events].reverse().find(e => e.event === "PlanDeCalculEffectué");
  let calculationId = null;
  let changeId = null;
  const calculated = {};
  if (latestCalcEvent) {
    calculationId = latestCalcEvent.calculationId || '';
    changeId = latestCalcEvent.changeId || '';
    for (const res of latestCalcEvent.payload.ressources) {
      calculated[res.month] = res.amount;
    }
  }
  // Find the latest PaymentPlanCreated event
  const latestPaymentPlanEvent = [...events].reverse().find(e => e.event === "PaymentPlanCreated");
  let paymentPlanId = null;
  const paid = {};
  if (latestPaymentPlanEvent) {
    paymentPlanId = latestPaymentPlanEvent.paymentPlanId;
    for (const pay of latestPaymentPlanEvent.payload.payments) {
      paid[pay.month] = pay.amountPaid;
    }
  }
  const allMonths = Array.from(new Set([...Object.keys(calculated), ...Object.keys(paid)])).sort();
  return {
    calculated,
    paid,
    calculationId,
    changeId,
    paymentPlanId,
    allMonths
  };
}

// Returns true if a DecisionValidee event exists for the current ids
export function isDecisionValidated(events) {
  const { calculationId, changeId, paymentPlanId } = getDeltaPerMonth(events);
  return events.some(e =>
    e.event === 'DecisionValidee' &&
    e.planDeCalculId === calculationId &&
    e.changeId === changeId &&
    e.paymentPlanId === paymentPlanId
  );
}
// reconciliationProjection.js
// Projection for reconciliation: builds the reconciliation state from the event log

export function buildReconciliationProjection(events) {
  const calculated = {}; // { month: { amount, calculationId, changeId } }
  const paid = {};       // { month: amountPaid }
  let paymentPlanId = null;

  for (const e of events) {
    if (e.event === "PlanDeCalculEffectué") {
      for (const res of e.payload.ressources) {
        calculated[res.month] = {
          amount: res.amount,
          calculationId: e.calculationId || '',
          changeId: e.changeId || ''
        };
      }
    }
    if (e.event === "PaymentPlanCreated") {
      paymentPlanId = e.paymentPlanId;
      for (const pay of e.payload.payments) {
        paid[pay.month] = pay.amountPaid;
      }
    }
  }

  // Union of all months in either plan
  const allMonths = Array.from(new Set([...Object.keys(calculated), ...Object.keys(paid)])).sort();

  return {
    calculated,
    paid,
    paymentPlanId,
    allMonths
  };
}
