// Projection slice for MutationDeRessources
// Pure projection: derives mutation state from event log

import { readWorkflowEventLog } from '../../workflowEventLog';

// Example: derive overall mutation status from event log
// Returns a map of changeId to status
export function getMutationProjection(eventLog = readWorkflowEventLog()) {
  // Find all mutation creation events
  const mutationEvents = eventLog.filter(e => e.event === 'MutationDeRessourcesCréée');
  // Find all resource opened events
  const openedEvents = eventLog.filter(e => e.event === 'RessourcesOpenedForChange');
  // Find all annulled mutations
  const annulledChangeIds = new Set(eventLog.filter(e => e.event === 'MutationDesRessourcesAnnulée').map(e => e.changeId));

  // Debug logging
  console.log('[getMutationProjection] mutationEvents:', mutationEvents);
  console.log('[getMutationProjection] openedEvents:', openedEvents);
  console.log('[getMutationProjection] annulledChangeIds:', Array.from(annulledChangeIds));

  // Build status per changeId, exclude annulled
  const statusByChangeId = {};
  mutationEvents.forEach(mutation => {
    const changeId = mutation.changeId;
    if (annulledChangeIds.has(changeId)) return; // skip annulled mutations
    const opened = openedEvents.find(e => e.changeId === changeId);
    if (opened) {
      statusByChangeId[changeId] = 'Ressources à saisir';
    } else {
      statusByChangeId[changeId] = 'Ressources à ouvrir';
    }
  });

  console.log('[getMutationProjection] statusByChangeId:', statusByChangeId);

  return {
    statusByChangeId,
    mutationEvents,
    openedEvents,
    annulledChangeIds
  };
}

// Add more pure projection/query functions as needed
