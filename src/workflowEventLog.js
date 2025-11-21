import workflowF from './workflowRules';
import { automatePaymentPlanCreation } from './paymentPlan/paymentPlanAutomation';

// workflowEventLog.js
// EventZ Workflow Checklist: Event Log implementation
// Stores and retrieves the append-only event log for workflow steps in localStorage

const WORKFLOW_EVENT_LOG_KEY = 'eventz_workflow_event_log';

// Read the event log from localStorage (returns array of events)
export function readWorkflowEventLog() {
  const raw = localStorage.getItem(WORKFLOW_EVENT_LOG_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

// Write the event log to localStorage
function writeWorkflowEventLog(events) {
  localStorage.setItem(WORKFLOW_EVENT_LOG_KEY, JSON.stringify(events));
}



// Append one or more events to the log (with auto-timestamp and F function)
export function appendWorkflowEvents(newEvents) {
  const now = new Date().toISOString();
  let events = readWorkflowEventLog();
  const toAppend = Array.isArray(newEvents) ? newEvents : [newEvents];
  let allStamped = [];
  function appendAndRunF(evts) {
    for (const e of evts) {
      const stamped = { ...e, timestamp: e.timestamp || now };
      events = events.concat([stamped]);
      allStamped.push(stamped);
      // Run F(Y, e) and append any resulting events recursively
      const fEvents = workflowF(events, stamped);
      if (fEvents && fEvents.length > 0) {
        appendAndRunF(fEvents);
      }
      // Run payment plan automation after every event append
      const autoEvents = automatePaymentPlanCreation(events);
      if (autoEvents && autoEvents.length > 0) {
        appendAndRunF(autoEvents);
      }
    }
  }
  appendAndRunF(toAppend);
  writeWorkflowEventLog(events);
  return allStamped;
}

// Clear the event log (for testing/dev only)
export function clearWorkflowEventLog() {
  localStorage.removeItem(WORKFLOW_EVENT_LOG_KEY);
}

export default {
  readWorkflowEventLog,
  appendWorkflowEvents,
  clearWorkflowEventLog,
};
