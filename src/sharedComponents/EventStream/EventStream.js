// Reusable EventStream component for displaying eventz events with optional filter
import React from 'react';
import './EventStream.css';

/**
 * @param {Object[]} events - Array of event objects
 * @param {(event: Object) => boolean} [filter] - Optional filter function
 * @param {number} [maxHeight] - Optional max height for scroll
 */
export default function EventStream({ events, filter, maxHeight = 260, showTitle = true }) {
  const filtered = filter ? events.filter(filter) : events;
  return (
    <div className="event-stream-section" style={{ maxHeight }}>
      {showTitle && <div className="event-stream-title">Event Stream</div>}
      <div className="event-stream-inner">
        {filtered.length === 0 ? (
          <div className="event-stream-empty">No events yet...</div>
        ) : (
          [...filtered].reverse().map((event, i) => (
            <div className="event-stream-card" key={event.id || i}>
              <pre className="event-stream-pre">{JSON.stringify(event, null, 2)}</pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
