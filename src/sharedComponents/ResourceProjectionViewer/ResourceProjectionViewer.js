import React from 'react';
import './ResourceProjectionViewer.css';

const ResourceProjectionViewer = ({
  queryResult,
  onQuery,
}) => (
  <div className="projection-debug-section">
    <button className="projection-toggle-btn" onClick={onQuery}>
      {queryResult ? 'Fermer Projection' : 'Afficher Projection'}
    </button>
    {queryResult && (
      <div className="projection-popup">
        <button className="projection-close-btn" onClick={onQuery}>Fermer</button>
        <strong>Projection (computeEntries)):</strong>
        <pre className="projection-raw-pre">
          {typeof queryResult === 'string' ? queryResult : JSON.stringify(queryResult, null, 2)}
        </pre>
      </div>
    )}
  </div>
);

export default ResourceProjectionViewer;
