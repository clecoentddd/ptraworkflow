// Slice: Calculation events for Plan de Calcul
// Emits CalculationCreated events with monthly results
import { v4 as uuidv4 } from 'uuid';

// Create a calculation event for a given changeId, droits period, and ressources
export function createCalculation({ changeId, startMonth, endMonth, ressources }) {
  // Calculate monthly amounts (10% of each resource amount)
  const months = getMonthRange(startMonth, endMonth);
  const calculationId = uuidv4();
  const monthly = months.map(month => {
    const res = ressources.find(r => r.month === month);
    const base = res ? res.amount : 0;
    return { month, amount: Math.round(base * 0.1 * 100) / 100 };
  });
  return {
    event: 'CalculationCreated',
    changeId,
    calculationId,
    startMonth,
    endMonth,
    monthly,
    ts: new Date().toISOString(),
  };
}

// Helper: get all months between start and end (inclusive)
function getMonthRange(start, end) {
  const result = [];
  let [sy, sm] = start.split('-').map(Number);
  const [ey, em] = end.split('-').map(Number);
  while (sy < ey || (sy === ey && sm <= em)) {
    result.push(`${sy.toString().padStart(4, '0')}-${sm.toString().padStart(2, '0')}`);
    sm++;
    if (sm > 12) { sm = 1; sy++; }
  }
  return result;
}
