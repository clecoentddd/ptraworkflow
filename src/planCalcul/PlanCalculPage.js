import EventStream from '../components/EventStream';
import { PLAN_DE_CALCUL_EFFECTUE_EVENT } from './event';
import React, { useState } from 'react';
import { readWorkflowEventLog, appendWorkflowEvents } from '../workflowEventLog';
import { getWorkflowStepsCached } from '../workflowProjections';
import getDatesDuDroit from '../ressources/projections/getAllDroitsPeriods';
import computeEntries, { QueryRessourceEntries } from '../ressources/projections/computeEntries';
import { getLastCalculation } from './planCalculProjection';
import { createCalculation } from './planCalculSlice';
import { createPlanDeCalculEffectueEvent } from './event';
import ProcessFlowStatusBar from '../sharedProjections/ProcessFlowStatusBar';
import '../layout.css';
import './planDeCalcul.css';

// Get validated finance entries for the current changeId, grouped by month
function getFinanceProjectionForChangeId(events, eventLog, changeId, startMonth, endMonth) {
  console.log('[getFinanceProjectionForChangeId] args:', { events, eventLog, changeId, startMonth, endMonth });
  const entriesByMonth = computeEntries(events, eventLog);
  // Get all months in the period
  const months = [];
  let [sy, sm] = startMonth.split('-').map(Number);
  const [ey, em] = endMonth.split('-').map(Number);
  while (sy < ey || (sy === ey && sm <= em)) {
    months.push(`${sy.toString().padStart(4, '0')}-${sm.toString().padStart(2, '0')}`);
    sm++;
    if (sm > 12) { sm = 1; sy++; }
  }
  // For each entry, keep all valid entries (added, not deleted) for the period, regardless of changeId
  const filteredByMonth = {};
  for (const month of months) {
    const entries = entriesByMonth[month] || [];
    if (entries.length > 0) {
      filteredByMonth[month] = entries;
    }
  }
  console.log('[getFinanceProjectionForChangeId] months:', months);
  console.log('[getFinanceProjectionForChangeId] filteredByMonth:', filteredByMonth);
  return { months, filteredByMonth };
}

export default function PlanCalculPage() {
  const [queryResult, setQueryResult] = useState(null);

  // Debug: log event log and droits periods
  const eventLog = readWorkflowEventLog();
  const allDroitsPeriods = getDatesDuDroit(eventLog);
  console.log('[PlanCalculPage] eventLog:', eventLog);
  console.log('[PlanCalculPage] allDroitsPeriods:', allDroitsPeriods);

  function handleQuery() {
    if (queryResult) {
      setQueryResult(null);
      return;
    }
    if (!latestDroitsPeriod) {
      setQueryResult('No droits period');
      return;
    }
    // Call the new query
    console.log('[PlanCalculPage] handleQuery: startMonth, endMonth', latestDroitsPeriod.startMonth, latestDroitsPeriod.endMonth);
    const byMonth = QueryRessourceEntries(latestDroitsPeriod.startMonth, latestDroitsPeriod.endMonth);
    console.log('[PlanCalculPage] QueryRessourceEntries result:', byMonth);
    setQueryResult(byMonth);
  }
  const steps = getWorkflowStepsCached('main-workflow');
  const changeId = (() => {
    const last = [...eventLog].reverse().find(e => e.changeId);
    return last ? last.changeId : null;
  })();
  // Only allow calculation if step 5 is Ouverte
  const canCalculate = changeId && steps[5]?.state === 'Ouverte';
  // Get latest droits period
  const latestDroitsPeriod = allDroitsPeriods.length > 0 ? allDroitsPeriods[allDroitsPeriods.length - 1] : null;
  console.log('[PlanCalculPage] changeId:', changeId);
  console.log('[PlanCalculPage] latestDroitsPeriod:', latestDroitsPeriod);
  // Get last calculation for this changeId
  const lastCalc = getLastCalculation(eventLog, changeId);
  const [message, setMessage] = useState('');
  // Get validated finance entries for this changeId and period
  const { months, filteredByMonth } = latestDroitsPeriod && changeId
    ? getFinanceProjectionForChangeId(eventLog, eventLog, changeId, latestDroitsPeriod.startMonth, latestDroitsPeriod.endMonth)
    : { months: [], filteredByMonth: {} };
  // For each entry (row), build a map of entryId to entry
  const entryMap = new Map();
  for (const month of months) {
    for (const entry of (queryResult ? queryResult[month] : []) || []) {
      if (!entryMap.has(entry.entryId)) {
        entryMap.set(entry.entryId, { ...entry });
      }
    }
  }
  const uniqueEntries = Array.from(entryMap.values());

  function handleCalculate() {
    if (!canCalculate || !latestDroitsPeriod) return;
    // For each month, sum all validated entries (income - expenses) for this changeId
    // Calculate raw amounts per month
    const rawRessources = months.map(month => {
  const entries = filteredByMonth[month] || [];
      let totalIncome = 0;
      let totalExpense = 0;
      for (const e of entries) {
        if (e.type === 'income') totalIncome += Number(e.amount);
        if (e.type === 'expense') totalExpense += Number(e.amount);
      }
      return { month, amount: totalIncome - totalExpense };
    });
    // Calculate 10% amounts per month
    const calcRessources = rawRessources.map(r => ({ month: r.month, amount: Math.round(r.amount * 0.1 * 100) / 100 }));
    const calcEvent = createCalculation({
      changeId,
      startMonth: latestDroitsPeriod.startMonth,
      endMonth: latestDroitsPeriod.endMonth,
      ressources: calcRessources
    });
    // PlanDeCalculEffectué event should use calculated (10%) amounts
    const planDeCalculEvent = createPlanDeCalculEffectueEvent({
      changeId,
      calculationId: calcEvent.calculationId,
      startMonth: latestDroitsPeriod.startMonth,
      endMonth: latestDroitsPeriod.endMonth,
      ressources: calcRessources
    });
    appendWorkflowEvents([calcEvent, planDeCalculEvent]);
    setMessage('Calculation done!');
  }

  return (
    <div className="workflow-main-container">
      {/* Process Flow (now on top, no card) */}
      <ProcessFlowStatusBar />

      {/* Plan de Calcul Container */}
      <div className="event-stream-section" style={{ position: 'relative' }}>
        {/* Display latest calculation period */}
        <div className="plan-de-calcul-period">
          <b>Période de calcul courante :</b>
          {latestDroitsPeriod ? (
            <span style={{ marginLeft: 8 }}>
              {latestDroitsPeriod.startMonth} &rarr; {latestDroitsPeriod.endMonth} {latestDroitsPeriod.ts ? <span style={{ color: '#888', fontSize: 12 }}>({latestDroitsPeriod.ts.slice(0, 10)})</span> : null}
            </span>
          ) : (
            <span style={{ marginLeft: 8 }}>Aucune période définie.</span>
          )}
        </div>

        <div className="plan-de-calcul-actions">
          <button
            onClick={handleCalculate}
            disabled={!canCalculate}
            className={canCalculate ? 'plan-de-calcul-calc-btn' : 'plan-de-calcul-calc-btn disabled'}
          >
            Lancer le calcul mensuel (10%)
          </button>
          <button
            className="projection-btn"
            onClick={handleQuery}
          >
            {queryResult ? 'Fermer Projection' : 'Afficher Projection'}
          </button>
          {message && <span className="plan-de-calcul-message">{message}</span>}
        </div>
        {queryResult && (
          <div className="projection-popup">
            <button className="projection-close-btn" onClick={handleQuery}>
              Fermer
            </button>
            <strong>Projection (raw):</strong>
            <pre style={{ fontSize: 13, margin: 0, background: '#222', color: '#fff', padding: 16, borderRadius: 8 }}>
              {typeof queryResult === 'string' ? queryResult : JSON.stringify(queryResult, null, 2)}
            </pre>
          </div>
        )}
        {months.length > 0 && (
          <div className="plan-de-calcul-table-section">
            <h3 className="plan-de-calcul-table-title">Synthèse mensuelle</h3>
            <table className="workflow-table">
              <thead>
                <tr>
                  <th className="plan-de-calcul-table-label-col"> </th>
                  {months.map(month => {
                    const [yyyy, mm] = month.split('-');
                    return <th key={month}>{mm}-{yyyy.slice(2)}</th>;
                  })}
                </tr>
              </thead>
              <tbody>
                <tr className="plan-de-calcul-table-total-row">
                  <td>Total Ressources/Dépenses</td>
                  {months.map(month => {
                    let total = 0;
                    const entries = filteredByMonth[month] || [];
                    for (const e of entries) {
                      if (e.type === 'income') total += Number(e.amount);
                      if (e.type === 'expense') total -= Number(e.amount);
                    }
                    return <td key={month} className="plan-de-calcul-table-total-cell">{Number(total).toFixed(2)} €</td>;
                  })}
                </tr>
                {uniqueEntries.map((row, idx) => {
                  const label = row.label || row.code;
                  return (
                    <tr key={row.entryId} className={row.type === 'income' ? 'income-row' : 'expense-row'}>
                      <td className="plan-de-calcul-table-entry-label">{label} <span className="plan-de-calcul-table-entry-type">({row.type})</span></td>
                      {months.map(month => {
                        // Show entry amount only if this entry is present in filteredByMonth for this month
                        const entry = (filteredByMonth[month] || []).find(e => e.entryId === row.entryId);
                        return <td key={month}>{entry ? entry.amount : ''}</td>;
                      })}
                    </tr>
                  );
                })}
                {lastCalc && (
                  <tr className="plan-de-calcul-last-calc-row">
                    <td>
                      Dernier calcul enregistré<br />
                      <span className="plan-de-calcul-last-calc-id">calculationId: {lastCalc.calculationId}</span>
                    </td>
                    {months.map(month => {
                      // Use the calculated 10% value from PlanDeCalculEffectué event
                      const planDeCalculEvent = eventLog.filter(e => e.event === 'PlanDeCalculEffectué' && e.changeId === lastCalc.changeId).slice(-1)[0];
                      let value = '';
                      if (planDeCalculEvent && planDeCalculEvent.payload && planDeCalculEvent.payload.ressources) {
                        const found = planDeCalculEvent.payload.ressources.find(row => row.month === month);
                        value = found ? `${Number(found.amount).toFixed(2)} €` : '';
                      }
                      return <td key={month}>{value}</td>;
                    })}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Event Stream Container for Plan de Calcul */}
      <EventStream
        events={eventLog.filter(e => e.event === PLAN_DE_CALCUL_EFFECTUE_EVENT)}
        maxHeight={260}
      />
    </div>
  );
}
