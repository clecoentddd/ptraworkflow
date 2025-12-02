// Command: ValiderLesRessourcesCommand
// Usage: triggers validation/closure of resources for a mutation

export default function ValiderLesRessourcesCommand({ changeId, ressourceVersionId, userEmail }) {
  return {
    type: "ValiderLesRessourcesCommand",
    changeId,
    ressourceVersionId,
    userEmail
  };
}
