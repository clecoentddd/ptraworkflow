// Returns { deltaPerMonth, calculationId, changeId, paymentPlanId }
export function getDeltaPerMonth(events) {
  const calculated = {};
  const paid = {};
  let paymentPlanId = null;
  let calculationId = null;
  let changeId = null;

  for (const e of events) {
    if (e.event === "PlanDeCalculEffectué") {
      calculationId = e.calculationId || '';
      changeId = e.changeId || '';
      for (const res of e.payload.ressources) {
        calculated[res.month] = res.amount;
      }
    }
    if (e.event === "PaymentPlanCreated") {
      paymentPlanId = e.paymentPlanId;
      for (const pay of e.payload.payments) {
        paid[pay.month] = pay.amountPaid;
      }
    }
  }
  const allMonths = Array.from(new Set([...Object.keys(calculated), ...Object.keys(paid)])).sort();
  const deltaPerMonth = {};
  allMonths.forEach(month => {
    deltaPerMonth[month] = (calculated[month] || 0) - (paid[month] || 0);
  });
  return {
    deltaPerMonth,
    calculationId,
    changeId,
    paymentPlanId
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
