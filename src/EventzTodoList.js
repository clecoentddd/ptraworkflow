import React, { useState } from 'react';
import { getTodosCached } from './projections';
import { appendEvents, readEventLog } from './eventLog';
import EventStream from './components/EventStream';

// Map EventZ status to UI label ("Ouverte" for active)
function statusLabel(status) {
  if (status === 'active') return 'Ouverte';
  if (status === 'completed') return 'Done';
  if (status === 'deleted') return 'Supprimée';
  return status;
}

export default function EventzTodoList() {
  const [_, setRerender] = useState(0);
  const todos = Object.values(getTodosCached());
  const [text, setText] = useState('');
  const [selectedTodoId, setSelectedTodoId] = useState(null);
  const allEvents = readEventLog();

  function handleAdd() {
    if (!text.trim()) return;
    appendEvents({ event: 'TodoAdded', todoId: Date.now().toString(), text });
    setText('');
    setRerender(x => x + 1);
  }

  function handleComplete(todoId) {
    appendEvents({ event: 'TodoCompleted', todoId });
    setRerender(x => x + 1);
  }

  function handleDelete(todoId) {
    appendEvents({ event: 'TodoDeleted', todoId });
    setRerender(x => x + 1);
  }

  return (
    <div style={{ maxWidth: 540, margin: '40px auto', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', padding: 24 }}>
      <h2>EventZ Todo List</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Nouvelle tâche..." style={{ flex: 1 }} />
        <button onClick={handleAdd}>Ajouter</button>
      </div>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {todos.filter(t => t.state !== 'deleted').map(todo => (
          <li key={todo.todoId} style={{ display: 'flex', alignItems: 'center', marginBottom: 8, background: '#f8f9fa', borderRadius: 4, padding: 8, cursor: 'pointer', border: selectedTodoId === todo.todoId ? '2px solid #1976d2' : 'none' }}
              onClick={() => setSelectedTodoId(todo.todoId)}
          >
            <span style={{ flex: 1, textDecoration: todo.state === 'completed' ? 'line-through' : 'none' }}>{todo.text}</span>
            <span style={{ marginRight: 12, fontSize: 12, color: '#1976d2' }}>{statusLabel(todo.state)}</span>
            {todo.state === 'active' && <button onClick={e => { e.stopPropagation(); handleComplete(todo.todoId); }} style={{ marginRight: 8 }}>Terminer</button>}
            {todo.state !== 'deleted' && <button onClick={e => { e.stopPropagation(); handleDelete(todo.todoId); }}>Supprimer</button>}
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 32 }}>
        <EventStream
          events={selectedTodoId ? allEvents.filter(e => e.todoId === selectedTodoId) : allEvents}
          maxHeight={260}
          showTitle={true}
        />
        <div style={{ fontSize: 13, color: '#888', marginTop: 8 }}>
          {selectedTodoId ? 'Affichage de l’historique pour cette tâche.' : 'Affichage de tous les événements.'}
        </div>
      </div>
    </div>
  );
}
