import React, { useState } from 'react';
import AnnulerMutationDesRessourcesCommand from './AnnulerMutationDesRessourcesCommand';
import AnnulerMutationDesRessourcesCommandHandler from './AnnulerMutationDesRessourcesCommandHandler';

export default function AnnulerMutationDesRessourcesButton({ changeId, userEmail = 'automation', onSuccess }) {
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  function handleClick() {
    setError(null);
    setSuccess(false);
    try {
      const command = AnnulerMutationDesRessourcesCommand({ changeId, userEmail });
      AnnulerMutationDesRessourcesCommandHandler(command);
      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ margin: '12px 0' }}>
      <button
        style={{
          background: '#e11d48',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          padding: '10px 18px',
          fontWeight: 'bold',
          fontSize: 16,
          cursor: 'pointer'
        }}
        onClick={handleClick}
      >
        Annuler la mutation
      </button>
      {success && <span style={{ color: 'green', marginLeft: 12 }}>Mutation annulée !</span>}
      {error && <span style={{ color: 'red', marginLeft: 12 }}>{error}</span>}
    </div>
  );
}
