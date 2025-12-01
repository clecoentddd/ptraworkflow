import React from 'react';

/**
 * Displays the todo status for a given changeId.
 * @param {Object} props
 * @param {string} props.changeId
 * @param {string} props.status
 */
export default function MutationTodoStatus({ changeId, status }) {
  if (!changeId) return null;
  return (
    <div style={{
      background: '#fffbe6',
      border: '2px solid #e11d48',
      borderRadius: 8,
      padding: '12px 18px',
      margin: '12px 0',
      fontWeight: 'bold',
      color: '#e11d48',
      fontSize: 16
    }}>
      <span>Mutation <b>{changeId}</b> : <span>{status}</span></span>
    </div>
  );
}
