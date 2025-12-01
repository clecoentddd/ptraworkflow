import React from 'react';
import './MutationStatusSummary.css';
import { getLatestDroitsValidéesPeriod } from '../../sharedProjections/projectionPériodesDeDroitsValidées';

/**
 * MutationStatusSummary - shared component to display mutation status summary
 * Props:
 *   - overallStatus: result of getOverallStatus(eventLog)
 *   - eventLog: canonical event log (array)
 */
export default function MutationStatusSummary({ overallStatus, eventLog }) {
  // Find latest changeId from eventLog
  const latestChangeId = [...eventLog].reverse().find(e => e.changeId)?.changeId || '-';
  const { hasOpenMutation } = overallStatus || {};
  // Use projection to get latest validated droits period
  const latestDroitsPeriod = getLatestDroitsValidéesPeriod(eventLog);
  return (
    <div className="mutation-status-summary">
      <div className="mutation-status-title">Statut Mutation</div>
      <div className="mutation-status-row"><b>Current ChangeId:</b> {latestChangeId}</div>
      <div className="mutation-status-row">
        <b>Dernière période de droits:</b> {latestDroitsPeriod && latestDroitsPeriod.startMonth && latestDroitsPeriod.endMonth
          ? `${latestDroitsPeriod.startMonth} à ${latestDroitsPeriod.endMonth}`
          : '-'}
      </div>
      <div className="mutation-status-row">
        <b>Statut mutation:</b> {hasOpenMutation ? 'Mutation ouverte' : 'Aucune mutation ouverte'}
      </div>
    </div>
  );
}
