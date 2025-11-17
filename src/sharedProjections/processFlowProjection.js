// Projection: returns process steps and their status from processState
export default function processFlowProjection(processState) {
  return [
    { id: 1, name: 'Créer la mutation', status: processState.step1 },
    { id: 2, name: 'Suspendre les paiements', status: processState.step2 },
    { id: 3, name: 'Mettre à jour la fin de droit', status: processState.step3 },
    { id: 4, name: 'Mettre à jour le plan de calcul', status: processState.step4 },
    { id: 5, name: 'Reconcilier droit, prestations, paiements', status: processState.step5 },
    { id: 6, name: 'Valider la décision de fin de droit', status: processState.step6 },
  ];
}
