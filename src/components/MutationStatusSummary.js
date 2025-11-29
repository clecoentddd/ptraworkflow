import React from 'react';

/**
 * MutationStatusSummary - shared component to display mutation status summary
 * Props:
 *   - overallStatus: result of getOverallStatus(eventLog)
 *   - eventLog: canonical event log (array)
 */
export default function MutationStatusSummary({ overallStatus, eventLog }) {
  // Find latest changeId from eventLog
  const latestChangeId = [...eventLog].reverse().find(e => e.changeId)?.changeId || '-';
  const { latestDroitsPeriod, hasOpenMutation } = overallStatus || {};
  return (
    <div style={{ background: '#f7f7f7', borderRadius: 8, padding: 16, marginBottom: 16 }}>
      <div style={{ fontWeight: 600, fontSize: 17, marginBottom: 8 }}>Statut Mutation</div>
      <div><b>Current ChangeId:</b> {latestChangeId}</div>
      <div>
        <b>Dernière période de droits:</b> {latestDroitsPeriod && latestDroitsPeriod.startMonth && latestDroitsPeriod.endMonth
          ? `${latestDroitsPeriod.startMonth} à ${latestDroitsPeriod.endMonth}`
          : '-'}
      </div>
      <div>
        <b>Statut mutation:</b> {hasOpenMutation ? 'Mutation ouverte' : 'Aucune mutation ouverte'}
      </div>
    </div>
  );
}
