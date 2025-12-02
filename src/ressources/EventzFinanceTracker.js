import React, { useState } from "react";
import { useAuthUser } from "../auth/AuthUserContext";
import EventStream from "../sharedComponents/EventStream/EventStream";
import ProcessFlowStatusBar from "../StandardProcessFlow/ProcessFlowStatusBar";
import { readWorkflowEventLog } from "../workflowEventLog";
import { getWorkflowStepsCached } from "../workflowProjections";
import computeEntries, { queryRessourceEntries } from "./projections/computeEntries";
import getDatesDuDroit from "./projections/getAllDroitsPeriods";
import AddEntryCommand from "./addEntry/AddEntryCommand";
import handleAddEntry from "./addEntry/handleAddEntry";
import DeleteEntryCommand from "./deleteEntry/DeleteEntryCommand";
import handleDeleteEntry from "./deleteEntry/handleDeleteEntry";
import { v4 as uuidv4 } from "uuid";
import "./FinanceTracker.css";
import { incomeOptions, expenseOptions } from "../ressourceConfig";
import ResourceEntryManager from "../sharedComponents/ResourceEntryManager/ResourceEntryManager";
import ResourceProjectionViewer from "../sharedComponents/ResourceProjectionViewer/ResourceProjectionViewer";

// UpdateEntry imports
import UpdateEntryCommand from "./updateEntry/UpdateEntryCommand";
import UpdateEntryCommandHandler from "./updateEntry/UpdateEntryCommandHandler";
import UpdateEntryForm from "./updateEntry/UpdateEntryForm";

const EventzFinanceTracker = () => {
    // State for périodes modifiées popup
    const [periodesModifieesResult, setPeriodesModifieesResult] = useState(null);

    // Handler for Afficher Périodes Modifiées
    function handleAfficherPeriodesModifiees() {
      const changeId = latestDroitsPeriod && latestDroitsPeriod.changeId ? latestDroitsPeriod.changeId : null;
      if (!changeId) {
        setPeriodesModifieesResult('Aucun changeId trouvé');
        return;
      }
      // Lazy load to avoid import errors if not present
      import('../MutationDeRessources/06 ProjectionPériodesModifiées/queryPériodesModifiées').then(mod => {
        const result = mod.queryPériodesModifiées(eventLog, changeId);
        setPeriodesModifieesResult(result);
      }).catch(() => {
        setPeriodesModifieesResult('Erreur lors de la requête.');
      });
    }
  const user = useAuthUser();

  /** ------------------------------------------------------------
   * EVENT LOG + WORKFLOW STEPS
   * ------------------------------------------------------------ */
  const eventLog = readWorkflowEventLog();
  const steps = getWorkflowStepsCached("main-workflow");
  const isStep4Ouverte = steps[4]?.state === "Ouverte";

  /** ------------------------------------------------------------
   * DROITS PERIOD
   * ------------------------------------------------------------ */
  const allDroitsPeriods = getDatesDuDroit(eventLog);
  const latestDroitsPeriod =
    allDroitsPeriods.length > 0
      ? allDroitsPeriods[allDroitsPeriods.length - 1]
      : null;

  /** ------------------------------------------------------------
   * PROJECTION: ENTRIES
   * ------------------------------------------------------------ */
  let entriesByMonth = {};
  if (latestDroitsPeriod) {
    entriesByMonth = queryRessourceEntries(
      latestDroitsPeriod.startMonth,
      latestDroitsPeriod.endMonth
    );
  }

  const allMonths = Object.keys(entriesByMonth).sort();

  /** ------------------------------------------------------------
   * QUERY RESULT
   * ------------------------------------------------------------ */
  const [queryResult, setQueryResult] = useState(null);

  function handleQuery() {
    if (!latestDroitsPeriod) {
      setQueryResult("No droits period");
      return;
    }
    if (queryResult) {
      setQueryResult(null);
      return;
    }
    const byMonth = queryRessourceEntries(
      latestDroitsPeriod.startMonth,
      latestDroitsPeriod.endMonth
    );
    setQueryResult(byMonth);
  }

  /** ------------------------------------------------------------
   * BUILD UNIQUE ENTRY MAP
   * ------------------------------------------------------------ */
  const entryMap = new Map();
  for (const month of allMonths) {
    const entries = entriesByMonth[month] || [];
    for (const entry of entries) {
      if (entry?.entryId && !entryMap.has(entry.entryId)) {
        entryMap.set(entry.entryId, { ...entry });
      }
    }
  }

  let filteredEntries = [];

try {
  filteredEntries = Array.from(entryMap.values());
} catch (err) {
  filteredEntries = [];
}

  /** ------------------------------------------------------------
   * HELPERS
   * ------------------------------------------------------------ */
  function isMonthInRange(month, start, end) {
    if (!month || !start || !end) return false;
    const [my, mm] = month.split("-").map(Number);
    const [sy, sm] = start.split("-").map(Number);
    const [ey, em] = end.split("-").map(Number);
    if (my < sy || (my === sy && mm < sm)) return false;
    if (my > ey || (my === ey && mm > em)) return false;
    return true;
  }

  /** ------------------------------------------------------------
   * ADD ENTRY
   * ------------------------------------------------------------ */
  const [form, setForm] = useState({
    code: "",
    amount: "",
    startMonth: "",
    endMonth: "",
    type: "income",
  });

  function handleAdd() {
    if (!form.code || !form.startMonth || !form.endMonth || !form.amount) {
      alert("All fields are required.");
      return;
    }

    // month validation
    const [sy, sm] = form.startMonth.split("-").map(Number);
    const [ey, em] = form.endMonth.split("-").map(Number);
    if (sy > ey || (sy === ey && sm > em)) {
      alert("Start month must be before or equal to end month.");
      return;
    }

    if (!latestDroitsPeriod) {
      alert("No droits period defined.");
      return;
    }

    // check inside current droits period
    const [pSy, pSm] = latestDroitsPeriod.startMonth.split("-").map(Number);
    const [pEy, pEm] = latestDroitsPeriod.endMonth.split("-").map(Number);

    const startOk = sy > pSy || (sy === pSy && sm >= pSm);
    const endOk = ey < pEy || (ey === pEy && em <= pEm);

    if (!(startOk && endOk)) {
      alert("You can only add entries within the current droits period.");
      return;
    }

    const entryId = uuidv4();

    // latest changeId
    const last = [...eventLog].reverse().find((e) => e.changeId);
    const changeId = last ? last.changeId : null;

    const option = [...incomeOptions, ...expenseOptions].find(
      (o) => o.code === form.code
    );
    const label = option ? option.label : "";

    // Create the command first, then pass to handler
    const command = AddEntryCommand({
      entryId,
      code: form.code,
      label,
      amount: Number(form.amount),
      startMonth: form.startMonth,
      endMonth: form.endMonth,
      type: form.type,
      changeId,
    });

    const userEmail = user?.user?.email || user?.user?.name || "anonymous";
    console.log('user:', user);
    console.log('userEmail:', userEmail);

    try {
      const newEvents = handleAddEntry(eventLog, command, userEmail);
      alert("Entry added.");
      // Re-read event log to update UI (if needed, use state or context)
      window.location.reload();
    } catch (err) {
      if (err.message && err.message.includes("authenticate")) {
        alert("Vous devez vous authentifier pour ajouter une entrée.");
      } else {
        alert("Erreur: " + err.message);
      }
    }
  }


  function handleDelete(entryId) {
    console.log('[handleDelete] entryId:', entryId);
    console.log('[handleDelete] eventLog:', eventLog);
    // Create the command first, then pass to handler
    const command = DeleteEntryCommand({ entryId });
    const userEmail = user?.user?.email || user?.user?.name || "anonymous";
    try {
      const newEvents = handleDeleteEntry(eventLog, command, userEmail);
      alert("Entry removed.");
      window.location.reload();
    } catch (err) {
      if (err.message && err.message.includes("authentifier")) {
        alert("Vous devez vous authentifier pour supprimer une entrée.");
      } else {
        alert("Erreur: " + err.message);
      }
    }
  }

  // UPDATE ENTRY
  function handleUpdateEntry({ entryId, newStartMonth, newEndMonth }) {
    // latest changeId
    const last = [...eventLog].reverse().find((e) => e.changeId);
    const changeId = last ? last.changeId : null;
    try {
      const command = UpdateEntryCommand({ entryId, changeId, newStartMonth, newEndMonth });
      const newEvents = UpdateEntryCommandHandler(eventLog, command, user?.email || "anonymous");
      // persist newEvents if needed — UI will re-render through eventLog read
      alert("Entry updated.");
    } catch (err) {
      alert("Update failed: " + err.message);
    }
  }

  // Modal state for update entry (per entry)
  const [updateModalEntry, setUpdateModalEntry] = useState(null);

  /** ------------------------------------------------------------
   * RENDER
   * ------------------------------------------------------------ */
  return (
    <div className="workflow-main-container">
      <section className="workflow-header">
        <ProcessFlowStatusBar />
      </section>

      <section className="workflow-content">
        <div className="event-stream-section" style={{ position: "relative" }}>
          <h2>Finance Tracker</h2>

          {/* DROITS PERIOD INFO */}
          <div className="droits-period-info">
            <b>Période de droits courante:</b>
            {latestDroitsPeriod ? (
              <span className="droits-period-margin">
                {latestDroitsPeriod.startMonth} → {latestDroitsPeriod.endMonth}
              </span>
            ) : (
              <span className="droits-period-margin">Aucune période définie.</span>
            )}
          </div>

          {/* Afficher Périodes Modifiées Button */}
          <button onClick={handleAfficherPeriodesModifiees} style={{ margin: '12px 0', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>
            Afficher Périodes Modifiées
          </button>
          {periodesModifieesResult && (
            <div className="modal-overlay" onClick={() => setPeriodesModifieesResult(null)}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={() => setPeriodesModifieesResult(null)}>&times;</button>
                <strong>Périodes Modifiées (queryPériodesModifiées):</strong>
                <pre style={{ fontSize: 13, margin: 0, background: '#222', color: '#fff', padding: 16, borderRadius: 8 }}>
                  {typeof periodesModifieesResult === 'string' ? periodesModifieesResult : JSON.stringify(periodesModifieesResult, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <ResourceProjectionViewer
            queryResult={queryResult}
            onQuery={handleQuery}
          />

          <ResourceEntryManager
            entries={filteredEntries}
            allMonths={allMonths}
            form={form}
            setForm={setForm}
            onAddEntry={handleAdd}
            onDeleteEntry={handleDelete}
            isStep4Ouverte={isStep4Ouverte}
            incomeOptions={incomeOptions}
            expenseOptions={expenseOptions}
            isMonthInRange={isMonthInRange}
            onUpdateClick={entry => setUpdateModalEntry(entry)}
          />

          {/* Update Entry Modal (per entry) */}
          {updateModalEntry && (
            <div className="update-modal-overlay" onClick={() => setUpdateModalEntry(null)}>
              <div className="update-modal-content" onClick={e => e.stopPropagation()}>
                <button className="update-modal-close" onClick={() => setUpdateModalEntry(null)}>&times;</button>
                <UpdateEntryForm
                  changeId={([...eventLog].reverse().find((e) => e.changeId) || {}).changeId || ""}
                  entryId={updateModalEntry.entryId}
                  startMonth={updateModalEntry.startMonth}
                  endMonth={updateModalEntry.endMonth}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="workflow-event-stream">
        <EventStream
          events={eventLog}
          filter={(e) =>
            e.event === "EntryAdded" || e.event === "EntryDeleted"
          }
          maxHeight={400}
          showTitle={true}
        />
      </section>
    </div>
  );
};

export default EventzFinanceTracker;
