// CommandHandler: ValiderLesRessourcesCommandHandler
// Emits RessourcesClosedForChangeEvent

import { createRessourcesClosedForChangeEvent } from "./RessourcesClosedForChangeEvent";
import { queryPériodesModifiées } from "../MutationDeRessources/06 ProjectionPériodesModifiées/queryPériodesModifiées";

export default function ValiderLesRessourcesCommandHandler(eventLog, command, userEmail) {
  const { changeId, ressourceVersionId } = command;
  if (!changeId) throw new Error("changeId is required");
  if (!ressourceVersionId) throw new Error("ressourceVersionId is required");
  if (!userEmail || userEmail === "anonymous") throw new Error("You need to authenticate to validate resources.");

  // Get periods for this mutation
  const periods = queryPériodesModifiées(eventLog, changeId) || {};
  const startMonth = periods.startMonth || null;
  const endMonth = periods.endMonth || null;

  // Emit RessourcesClosedForChangeEvent
  const closedEvent = createRessourcesClosedForChangeEvent({
    ressourceVersionId,
    changeId,
    startMonth,
    endMonth,
    userEmail
  });
  return [closedEvent];
}
