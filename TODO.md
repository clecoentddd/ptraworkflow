---

# EventZ Workflow Checklist: Event Model

## Event Structure

All workflow step events use this structure:

```
{
  "event": "EventName",           // e.g. StepOpened, StepDone
  "workflowId": "string",         // unique id for the workflow instance
  "step": 1 | 2 | 3 | 4 | 5 | 6,   // step number
  "timestamp": "ISO-8601",        // e.g. 2025-11-18T12:34:56.789Z
  "meta": { "any": "optional" }, // optional metadata (user, source, etc.)
  // event-specific fields below
}
```

## Event Types

- **StepOpened**: { }
- **StepDone**: { }
- **StepSkipped**: { }
- **StepCancelled**: { }
- **StepRollback**: { reason }
- **StepOpenRejected**: { reason }
- **StepDoneRejected**: { reason }

### Example Event Payloads

```
{
  "event": "StepOpened",
  "workflowId": "wf-123",
  "step": 3,
  "timestamp": "2025-11-18T12:00:00.000Z"
}

{
  "event": "StepDone",
  "workflowId": "wf-123",
  "step": 3,
  "timestamp": "2025-11-18T12:05:00.000Z"
}

{
  "event": "StepSkipped",
  "workflowId": "wf-123",
  "step": 4,
  "timestamp": "2025-11-18T12:10:00.000Z"
}

{
  "event": "StepCancelled",
  "workflowId": "wf-123",
  "step": 2,
  "timestamp": "2025-11-18T12:15:00.000Z"
}

{
  "event": "StepRollback",
  "workflowId": "wf-123",
  "step": 5,
  "timestamp": "2025-11-18T12:16:00.000Z",
  "reason": "Step2Cancelled"
}
```

## State Derivation

The current state of a step is derived by replaying all events for that `workflowId` and `step` in order. The last relevant event determines the state:

- If last event is StepDone → state is "Done"
- If last event is StepSkipped → state is "Skipped"
- If last event is StepCancelled → state is "Cancelled"
- If last event is StepOpened → state is "Ouverte"
- If no event yet → state is "ToDo"

## Business Rules (F)

- Only StepOpened can open a step
- StepDone/Skipped/Cancelled only allowed if step is currently "Ouverte"
- StepOpenRejected/StepDoneRejected emitted if business rules are violated
- All rules enforced in pure functions: F(Y, e) → eventsToAppend

## Required Engine API

- appendEvent(e): Calls F(Y, e), appends result(s) to log Y, returns all appended events
- getStepState(workflowId, step): Returns current state for a step
- getWorkflowState(workflowId): Returns all step states for a workflow
- getEventsByWorkflow(workflowId): Returns all events for a workflow

## Optional: Performance Cache

Incremental cache for workflow state, updated only when new events are appended. Used for fast queries, never for business rules.

---
EventZ Workflow Todo/Step Engine

Purpose: Implement a workflow engine where steps transition through states using immutable events (EventZ pattern).
There is no aggregate, no stored state, no projection required for correctness.
Only the append-only event log (Y) is authoritative.

1. Core Principles (EventZ Model)

All information is stored as immutable events appended to Y.

State is never mutated.

A step’s current state is derived by inspecting the last event for that step.

Business rules are implemented by pure functions F(Y, e) that:

take the entire event log Y and a new incoming event e,

enforce rules,

and return 1 or more new events to append to Y.

F may return multiple events (e.g. rollback logic).

2. Workflow Structure

A workflow consists of three ordered steps:

Step 1

Step 2

Step 3

Transitions allowed per step:

Todo (implicit initial state, no events yet)

Opened

Done

Skipped

Cancelled

Each of these is represented by an immutable event.

3. Event Definitions

All workflow step events use this structure:

{
  "event": "EventName",
  "workflowId": "string",
  "step": 1 | 2 | 3,
  "timestamp": "ISO-8601",
  "meta": { "any": "optional" }
}

EventNames:

StepOpened

StepDone

StepSkipped

StepCancelled

StepRollback (system-generated)

Optional system events (rejections):

StepOpenRejected

StepDoneRejected, etc.

These appear only if F forbids an operation.

4. State Derivation (Authoritative Rule)

A step’s true state is the last event of these types for that step:

StepOpened

StepDone

StepSkipped

StepCancelled

Pseudo-code:

function getStepState(Y, workflowId, step) {
  let state = "Todo";

  for (const e of Y) {
    if (e.workflowId !== workflowId || e.step !== step) continue;
    if (e.event.startsWith("Step")) {
      state = e.event.replace("Step", "");
    }
  }

  return state;    // "Todo", "Opened", "Done", "Skipped", "Cancelled"
}


This function must be implemented as part of the engine.

5. Business Rules (F Functions)

All rules are enforced in pure functions: F(Y, e) → eventsToAppend.

5.1 Step Opening Rules
Opening Step 1

Always allowed.

Opening Step 2

Allowed only if Step 1 is Done or Skipped.

if step == 2:
   allow only if step1 ∈ { Done, Skipped }


If not allowed, return a rejection event:

{
  "event": "StepOpenRejected",
  "workflowId": "...",
  "step": 2,
  "reason": "Step1 not completed"
}

Opening Step 3

Allowed only if Step 2 is Done or Skipped.

5.2 Completion Rules (Done)

A step can be marked Done only if:

it is currently Opened

Otherwise:

{
  "event": "StepDoneRejected",
  "workflowId": "...",
  "step": N,
  "reason": "Step not opened"
}

5.3 Skip Rules

A step may be skipped only if:

it is currently Opened

5.4 Cancel Rules
Cancelling Step 1 triggers rollback logic:

If Step 1 is cancelled and Step 3 is currently Opened,
then the system must append rollback events:

StepRollback (step 3)
StepCancelled (step 3)


So F returns:

[
  { "event": "StepCancelled", "workflowId":"W1", "step":1 },
  { "event": "StepRollback",  "workflowId":"W1", "step":3, "reason":"Step1Cancelled" },
  { "event": "StepCancelled", "workflowId":"W1", "step":3 }
]


This is EventZ:
multiple events may be appended atomically.

6. Required Engine API

You must implement:

appendEvent(e)

Calls F(Y, e)

Appends result(s) to the log Y

Returns all appended events

getStepState(workflowId, step)

Uses the authoritative state rule.

getWorkflowState(workflowId)

Returns:

{
  "1": "StateOfStep1",
  "2": "StateOfStep2",
  "3": "StateOfStep3"
}

getEventsByWorkflow(workflowId)

Returns all events in Y for this workflow.

7. Optional: Performance Cache (Not Authoritative)

Implement a simple incremental cache:

workflowCache = {
  [workflowId]: {
     1: "Opened",
     2: "Todo",
     3: "Todo"
  }
}


Rules:

Updated only when new events are appended

Used only for fast queries

Never used for business rules

If cache is lost, reconstruct from Y

This preserves EventZ philosophy.

8. Expected Implementation

The AI must generate:

eventLog.js

appendEvent()

internal F() dispatcher

in-memory Y array

timestamp auto-generation

state.js

getStepState()

getWorkflowState()

rules.js

F functions for:

opening

completing

skipping

cancelling (with rollback)

Optional: cache.js

incremental cache for workflow state

9. Example Scenario

User opens Step 1
→ StepOpened(step=1)

User completes Step 1
→ StepDone(step=1)

System opens Step 2
→ StepOpened(step=2)

User cancels Step 1 (later!)

Step 3 is still open
→ F returns 3 events:

Cancel step1

StepRollback(step3)

StepCancelled(step3)

10. Acceptance Criteria

All rules must be enforced by F.

No mutable state except optional cache.

Log is immutable and append-only.

A step’s state is derived strictly from its events in Y.

Cancelling Step 1 must rollback Step 3 if needed.

Code must be deterministic and pure wherever possible.


The AI must not introduce aggregates or DDD concepts.

---

# EventZ Todo List: Event Model

## Event Structure

All todo events use this structure:

```
{
  "event": "EventName",           // e.g. TodoAdded, TodoCompleted
  "todoId": "string",             // unique id for the todo item
  "timestamp": "ISO-8601",        // e.g. 2025-11-18T12:34:56.789Z
  "meta": { "any": "optional" }, // optional metadata (user, source, etc.)
  // event-specific fields below
}
```

## Event Types

- **TodoAdded**: { text, [other fields] }
- **TodoEdited**: { text, [other fields] }
- **TodoCompleted**: {}
- **TodoUncompleted**: {}
- **TodoDeleted**: {}
- **TodoRestored**: {}

### Example Event Payloads

```
{
  "event": "TodoAdded",
  "todoId": "abc123",
  "timestamp": "2025-11-18T12:00:00.000Z",
  "text": "Buy milk"
}

{
  "event": "TodoCompleted",
  "todoId": "abc123",
  "timestamp": "2025-11-18T12:05:00.000Z"
}

{
  "event": "TodoEdited",
  "todoId": "abc123",
  "timestamp": "2025-11-18T12:10:00.000Z",
  "text": "Buy oat milk"
}

{
  "event": "TodoDeleted",
  "todoId": "abc123",
  "timestamp": "2025-11-18T12:15:00.000Z"
}
```

## State Derivation

The current state of a todo is derived by replaying all events for that `todoId` in order. The last relevant event determines the state:

- If last event is TodoCompleted → state is "completed"
- If last event is TodoDeleted → state is "deleted"
- If last event is TodoRestored → state is "active"
- If last event is TodoAdded or TodoEdited → state is "active"

## Business Rules (F)

- Only TodoAdded can create a new todoId
- TodoCompleted/Uncompleted/Edited/Deleted/Restored only allowed if todo exists and is not deleted
- All rules enforced in pure functions: F(Y, e) → eventsToAppend

## Required Engine API

- appendEvent(e): Calls F(Y, e), appends result(s) to log Y, returns all appended events
- getTodoState(todoId): Returns current state for a todo
- getAllTodos(): Returns all active todos
- getEventsByTodo(todoId): Returns all events for a todo

## Optional: Performance Cache

Incremental cache for todo state, updated only when new events are appended. Used for fast queries, never for business rules.

---