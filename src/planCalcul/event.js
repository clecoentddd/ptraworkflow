// Canonical event format for plan de calcul events
// Used for event-sourced workflow and event stream display

// Calculation event

// DDD: PlanDeCalculEffectuéEvent
export const PLAN_DE_CALCUL_EFFECTUE_EVENT = 'PlanDeCalculEffectué';

export function createPlanDeCalculEffectueEvent({ changeId, calculationId, startMonth, endMonth, ressources, ts }) {
  return {
    event: PLAN_DE_CALCUL_EFFECTUE_EVENT,
    changeId,
    calculationId,
    payload: {
      startMonth,
      endMonth,
      ressources, // [{ month, amount }]
    },
  timestamp: ts || new Date().toISOString(),
  };
}

// Example event:
// {
//   event: 'PlanDeCalculEffectué',
//   changeId: 'uuid',
//   payload: {
//     startMonth: '2025-01',
//     endMonth: '2025-12',
//     ressources: [ { month: '2025-01', amount: 1000 }, ... ]
//   },
//   ts: '2025-11-21T12:34:56.789Z'
// }
