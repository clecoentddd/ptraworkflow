Who Does What
The Rule Function F does everything:

Receives all history Y (all existing events) and the new event e
Filters Y to get relevant events (e.g., for this account)
Computes current state from those events (e.g., sum deposits/withdrawals)
Applies business logic/validation against that computed state
Returns new fact(s) y to be appended (or rejects if invalid)

The Eventz System (infrastructure) does:

Appends the returned y to Y
Invokes F when new events arrive
Stores the immutable tuple stream Y

The Logic Complies To
F = pure function that maps (Y, e) → y
Where:

Y = complete immutable history (all facts)
e = incoming event (new fact)
y = output fact(s) to append
F = the rule that encodes all business logic

The business logic lives entirely inside F. F is:

Pure (no side effects)
Deterministic (same Y + e always produces same y)
Self-contained (all rules in one place)
Transparent (you can read the entire logic)

There's no separate "command handler" layer - F is the command handler, validator, and state computer all in one function.