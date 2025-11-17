Eventz Browser Prototype — Business Requirements + Software Architecture

Single-file, minimal, prototype-focused specification for an in-browser Eventz app using one stream. Clean, vertical-slice architecture: Command → CommandHandler → Event (append), and Projection = queries over events.

0. EventZ (Concise Definition for AI Migration)

EventZ = one append-only stream of immutable events. No aggregates, no snapshots, no state reconstruction through models. Every user action produces an event tuple that is appended to the single history file. All UI state is derived by pure projections that replay or filter events. No deletes, no updates — only new events.

Migration rule for AI: Whenever adding features, do not create mutable models or tables. Instead:

Represent every change as a Command → CommandHandler → Event.

Append the Event to the single EventZ stream.

Derive all screens and state through Projections that read events.

Simplify: “Never store state. Only append events, and derive everything from history.”

1. Purpose (one-sentence)

Build a browser-only prototype that lets a user create a person and manage recurring financial entries (income/expense) using an append-only Eventz log (one JSONL stream), with a live Event Log screen and simple projections computed in the browser.

2. Constraints & scope (prototype)

Single global stream (one JSONL file / IndexedDB fallback).

All state is derived from replaying events (no database tables).

Vertical-slice design: each feature implemented as a Command + CommandHandler that emits Event(s).

UI: simple single-page app (React or plain JS) with: Person screen, Editor for entries, ChangeSet controls, and Event Log viewer.

No server required for MVP; optional cloud sync later.

3. Business requirements (concise)

Create Person: user creates a person (personId, name). Event: PersonCreated.

Entries: user can Add / Update / Delete entries. Each entry includes: entryId, code (string/number), amount, periodFrom (YYYY-MM), periodTo (YYYY-MM), changeId.

ChangeSet (changeId): user groups multiple mutations under a changeId. New edits require a new changeId after validation. User can validate or cancel a changeId. Events: ChangeCreated, ChangeValidated, ChangeCancelled.

Type rule: If code starts with 1 → income; if starts with 2 → expense. No separate type field.

Event Log: user can view all events, filter by changeId, entryId, personId, event type, and date. Raw JSON is visible.

UI projections: current person state, current entries for a person (replay Entry events), and monthly balance calculation (income positive, expense negative) computed from events.

4. Vertical-slice architecture (pattern)

Each feature is implemented as a vertical slice with three parts:

Command (intent): plain object representing user action.

Example: AddEntryCommand { personId, changeId, entryId, code, amount, periodFrom, periodTo }

CommandHandler (pure-ish, runs in UI/client): validates command against current projection(s), decides emitted Event(s), and calls appendEvent(event).

Example responsibilities:

ensure periods valid (periodFrom ≤ periodTo)

ensure code starts with 1 or 2

check idempotency (no duplicate entryId in same changeId)

CommandHandler emits one or more events (e.g., EntryAdded or AddRejected).

Event (immutable tuple): appended to the single Eventz stream; includes ts, event, personId, entryId (if relevant), changeId, tags, and payload.

Events are never mutated or deleted.

Projection / Query: pure functions that read events (optionally filtered by tags/index) and compute current UI state.

Can be full replay or incremental using snapshots/index.

5. Canonical Event schema (minimal)

Each event is JSON stored one-per-line in budget-events.jsonl (or IndexedDB):

{
  "ts": "2025-11-16T12:00:00Z",
  "event": "EntryAdded",
  "personId": "p-123",
  "entryId": "e-456",
  "changeId": "c-789",
  "tags": ["person:p-123","entry:e-456","change:c-789"],
  "payload": {
    "code": 101,
    "amount": 2000,
    "periodFrom": "2025-01",
    "periodTo": "2025-03",
    "label": "Salary"
  }
}

Minimal required events for MVP:

PersonCreated (payload: { personId, name })

ChangeCreated (payload: { changeId, userId? })

EntryAdded (payload: { entryId, code, amount, periodFrom, periodTo, label? })

EntryUpdated (payload: { entryId, ...changed })

EntryDeleted (payload: { entryId })

ChangeValidated (payload: { changeId })

ChangeCancelled (payload: { changeId })

All events include tags for fast filtering (e.g., person:..., entry:..., change:...).

6. In-browser storage strategy (prototype)

Primary: File System Access API to append to a local budget-events.jsonl file in a user-chosen folder.

Fallback: IndexedDB object store events where each entry is an event and has an auto-increment seq (used as offset).

Append semantics: client provides a single append API (appendEvent) that returns an offset (seq id or byte position) and ensures ordering.

Multi-tab: simple token/lock in IndexedDB to prevent concurrent multi-writer corruption; first version can disallow multi-tab writes.

7. Projection examples (code sketches)
Current entries for a person (full replay)
function computeEntries(events, personId) {
  const entries = new Map();
  for (const e of events) {
    if (e.personId !== personId) continue;
    switch (e.event) {
      case 'EntryAdded': entries.set(e.entryId, { ...e.payload, entryId: e.entryId }); break;
      case 'EntryUpdated': entries.set(e.entryId, { ...entries.get(e.entryId), ...e.payload }); break;
      case 'EntryDeleted': entries.delete(e.entryId); break;
    }
  }
  return Array.from(entries.values());
}
Monthly balance for person
function monthlyBalance(events, personId, month) {
  let balance = 0;
  for (const e of events) {
    if (e.personId !== personId) continue;
    if (!['EntryAdded','EntryUpdated','EntryDeleted'].includes(e.event)) continue;
    // treat EntryDeleted as removing previously added entry — simplified: ignore deleted entries by computing final set then summing
  }
  // simpler: compute final entries via computeEntries(), then sum amounts for which month in period
  const entries = computeEntries(events, personId);
  for (const ent of entries) {
    if (monthInRange(month, ent.periodFrom, ent.periodTo)) {
      const sign = ent.code.toString().startsWith('1') ? 1 : -1;
      balance += sign * ent.amount;
    }
  }
  return balance;
}
8. Event Log screen

Shows paginated list of events (latest first).

Filters: changeId, entryId, personId, event type, date range.

Each row: timestamp, event type, short human summary, toggle for raw JSON.

Replay button runs filtered events through selected projection (e.g., entries for person).

9. CommandHandler responsibilities (detailed)

Validate command inputs (IDs, periods, code leading digit).

Use current projection(s) to enforce local rules (e.g., no duplicate entryId in same changeId).

Emit deterministic Event(s) representing the change.

Append to Eventz stream using appendEvent(event).

Update in-memory incremental projection and persist small indexes/snapshots.

Rejected commands should emit Rejected events or return structured errors — for prototype, returning error is OK.

10. Acceptance criteria (prototype)

User can create a person and see it in the UI (via PersonCreated replay).

User can create a changeId, add two entries (one income code starts with 1, one expense code starts with 2), and see entries in the projection immediately.

User can validate the change (append ChangeValidated) and further edits require a new changeId.

User can cancel a change (append ChangeCancelled) and the staged entries no longer appear in the live projection.

Event Log shows all events and supports filtering by changeId and entryId.

11. Minimal developer APIs (client)

appendEvent(event) -> Promise<{ offset }>

readEvents(filter) -> AsyncIterable<event> (filter by tags/date/offset)

createCommandHandler(command) (returns handler to validate & append events)

replayProjection(projectionFn, filter) -> state

12. Prototype roadmap (quick)

Implement append API (IndexedDB first for compatibility).

Implement a small projection engine and computeEntries().

Build UI: Person create, ChangeSet create/validate/cancel, AddEntry form, Entries list.

Implement Event Log screen with filters and raw JSON view.

Add File System Access API append support (optional).

13. Notes / rationale

Single stream keeps the model simple and auditable.

Vertical-slice architecture reduces coupling and makes incremental prototype development easy.

Projections are pure and testable, so the UI always derives from authoritative history.

End of simplified single-file spec.