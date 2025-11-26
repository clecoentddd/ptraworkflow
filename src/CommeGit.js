import React, { useState, useMemo } from "react";
import "./CommeGit.css";
import { readWorkflowEventLog } from "./workflowEventLog";

const CommeGit = () => {
  // Use workflow event log for all events
  const [events] = useState(() => readWorkflowEventLog());

  // Group events by ChangeId and order by timestamp descending
  const grouped = useMemo(() => {
    const map = {};
    // Only include events with changeId and exclude pure workflow steps (StepOpened, StepDone, StepSkipped, StepCancelled)
    events.forEach(e => {
      if (!e.changeId) return;
      // Exclude pure workflow step events
      if (["StepOpened", "StepDone", "StepSkipped", "StepCancelled"].includes(e.event)) return;
      if (!map[e.changeId]) map[e.changeId] = [];
      map[e.changeId].push(e);
    });

    // Sort events inside each ChangeId branch by sequenceNumber ascending
    Object.keys(map).forEach(cid => {
      map[cid].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
    });

    // Sort ChangeIds by timestamp of latest event descending
    const sortedChangeIds = Object.keys(map).sort((a, b) => {
      const lastA = map[a][map[a].length - 1].timestamp;
      const lastB = map[b][map[b].length - 1].timestamp;
      return new Date(lastB) - new Date(lastA);
    });

    const sortedMap = {};
    sortedChangeIds.forEach(cid => {
      sortedMap[cid] = map[cid];
    });

    return sortedMap;
  }, [events]);

  const [expanded, setExpanded] = useState({});

  const toggle = id => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="commegit-container">
      <h1 style={{marginBottom: 18}}>Comme Git – Graph</h1>
      <div className="git-tree-graph">
        {Object.entries(grouped).map(([changeId, evts], idx) => {
          const annulled = evts.some(e => e.event === "MutationAnnulée" || e.event === "OperationMutationAnnulée");
          const validated = evts.some(e => e.event === "DecisionValidee");
          let statusLabel = annulled ? "Annulée" : validated ? "Validée" : "En cours";
          let statusClass = annulled ? "annulled" : validated ? "validated" : "inprogress";

          // Dot color by status
          const dotColor = statusClass === 'validated' ? '#2c974b' : statusClass === 'annulled' ? '#c00' : '#1976d2';
          return (
            <div key={changeId} className={`git-branch-tree ${statusClass}`}> 
              <div className="git-branch-header">
                <span className="git-branch-dot" style={{background: dotColor, boxShadow: `0 0 0 2px ${dotColor}33`}}></span>
                <span className="git-branch-connector"></span>
                <span className="git-branch-label">{changeId}</span>
                <span className={`status-label ${statusClass}`}>{statusLabel}</span>
                <button className="git-expand-btn" style={{marginLeft: 10, fontWeight: 'bold', fontSize: 18, background: '#f0f0f0', border: 'none', borderRadius: 6, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: dotColor, cursor: 'pointer'}} onClick={() => toggle(changeId)}>{expanded[changeId] ? "−" : "+"}</button>
              </div>
              {expanded[changeId] && (
                <div className="git-event-list">
                  {evts.map(event => (
                    <div key={event.id || event.sequenceNumber} className="git-event-node">
                      <span className="git-event-dot" style={{background: dotColor, boxShadow: `0 0 0 2px ${dotColor}33`}}></span>
                      <span className="git-event-connector"></span>
                      <span className="git-event-label">{event.event}{event.stepId ? ` (Step ${event.stepId})` : ""}</span>
                      {event.data && <span className="git-event-meta">{JSON.stringify(event.data)}</span>}
                    </div>
                  ))}
                  {evts.length === 0 && <div style={{color: '#888'}}>Aucun événement métier pour cette version.</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CommeGit;
