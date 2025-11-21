// Reconciliation projection for step 6: Reconcilier comptabilité
// Combines PlanDeCalculEffectué and PaymentPlanCreated events

// Usage: reconcilePlanCalculAndPayments(eventLog) => [{ month, calculatedAmount, amountPaid, delta, paymentPlanId }]

export function reconcilePlanCalculAndPayments(events) {
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

    const result = allMonths.map(month => ({
        month,
        calculatedAmount: calculated[month]?.amount || 0,
        calculationId: calculated[month]?.calculationId || '',
        changeId: calculated[month]?.changeId || '',
        amountPaid: paid[month] || 0,
        delta: (calculated[month]?.amount || 0) - (paid[month] || 0),
        paymentPlanId: paymentPlanId || ''
    }));

    // If no payment plan exists, still show calculated months with empty paymentPlanId
    if (!paymentPlanId && result.length === 0 && Object.keys(calculated).length > 0) {
        return Object.keys(calculated).sort().map(month => ({
            month,
            calculatedAmount: calculated[month]?.amount,
            calculationId: calculated[month]?.calculationId || '',
            changeId: calculated[month]?.changeId || '',
            amountPaid: 0,
            delta: calculated[month]?.amount,
            paymentPlanId: ''
        }));
    }

    return result;
}
