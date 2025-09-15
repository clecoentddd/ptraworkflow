import React, { useState, useMemo } from "react";
import "./CommeGit.css";

const CommeGit = () => {
  const [events] = useState(() => {
    const saved = localStorage.getItem("eventSourcedProcessEvents");
    return saved ? JSON.parse(saved) : [];
  });

  // Group events by ChangeId and order by timestamp descending
  const grouped = useMemo(() => {
    const map = {};
    events.forEach(e => {
      if (!e.changeId) return;
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
      <h1>Comme Git (Event Stream Tree)</h1>
      <div className="git-tree">
        {Object.entries(grouped).map(([changeId, evts]) => {
          const annulled = evts.some(e => e.type === "OperationMutationAnnulée");
          return (
            <div key={changeId} className={`git-branch ${annulled ? "inactive" : ""}`}>
              <div className="git-node" onClick={() => toggle(changeId)}>
                <span className="dot"></span>
                <span className="icon">{expanded[changeId] ? "▼" : "▶"}</span>
                <span className="label">ChangeId: {changeId}</span>
                <span className="meta">
                  ({evts.length} events){annulled && " - Annulée"}
                </span>
              </div>

              {expanded[changeId] && (
                <div className="git-children">
                  {evts.map(event => {
                    const stepKey = `${changeId}-step${event.stepId}`;
                    const isStep4 = event.stepId === 4 && (event.type === 'StepStarted' || event.type === 'StepCompleted');

                    return (
                      <div key={event.id} className="git-node" onClick={() => isStep4 && toggle(stepKey)}>
                        <span className="dot small"></span>
                        {isStep4 && <span className="icon">{expanded[stepKey] ? "▼" : "▶"}</span>}
                        <span className="label">
                          {event.stepId ? `Step ${event.stepId} – ` : ""}{event.type}
                        </span>

                        {/* Step 4 expansion → show ResourceAdded / ResourceRemoved */}
                        {isStep4 && expanded[stepKey] && (
                          <div className="git-children">
                            {(() => {
                              const startSeq = event.sequenceNumber;
                              const endSeqEvent = evts.find(
                                e => e.stepId === 4 && e.type === 'StepCompleted' && e.sequenceNumber > startSeq
                              );
                              const endSeq = endSeqEvent ? endSeqEvent.sequenceNumber : Infinity;

                              const step4Resources = evts.filter(
                                e =>
                                  e.stepId === 4 &&
                                  (e.type === 'ResourceAdded' || e.type === 'ResourceRemoved') &&
                                  e.sequenceNumber > startSeq &&
                                  e.sequenceNumber < endSeq
                              );

                              return step4Resources.map(resEvt => (
                                <div key={resEvt.id} className="git-node resource-node">
                                  <span className="dot tiny"></span>
                                  <span className="label">
                                    {resEvt.type} → {JSON.stringify(resEvt.data)}
                                  </span>
                                </div>
                              ));
                            })()}
                          </div>
                        )}
                      </div>
                    );
                  })}
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
