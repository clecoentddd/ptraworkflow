import React, { useState } from 'react';
import { getTodosCached } from '../projections';
import { appendEvents, readEventLog } from '../eventLog';
import EventStream from '../components/EventStream';
import './TodoWorkflow.css';

function statusLabel(status) {
  if (status === 'active') return 'Ouverte';
  if (status === 'completed') return 'Done';
  if (status === 'deleted') return 'Supprimée';
  return status;
}

export default function TodoWorkflow() {
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
    <div className="todo-container">
      <h2 className="todo-header">EventZ Todo List</h2>
      <div className="todo-input-row">
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Nouvelle tâche..." className="todo-input" />
        <button onClick={handleAdd}>Ajouter</button>
      </div>
      <ul className="todo-list">
        {todos.filter(t => t.state !== 'deleted').map(todo => (
          <li key={todo.todoId}
              className={`todo-item${selectedTodoId === todo.todoId ? ' selected' : ''}`}
              onClick={() => setSelectedTodoId(todo.todoId)}
          >
            <span className={`todo-text${todo.state === 'completed' ? ' todo-completed' : ''}`}>{todo.text}</span>
            <span className="todo-status">{statusLabel(todo.state)}</span>
            {todo.state === 'active' && <button className="todo-action" onClick={e => { e.stopPropagation(); handleComplete(todo.todoId); }}>Terminer</button>}
            {todo.state !== 'deleted' && <button className="todo-action" onClick={e => { e.stopPropagation(); handleDelete(todo.todoId); }}>Supprimer</button>}
          </li>
        ))}
      </ul>
      <div className="todo-history">
        <EventStream
          events={selectedTodoId ? allEvents.filter(e => e.todoId === selectedTodoId) : allEvents}
          maxHeight={260}
          showTitle={true}
        />
        <div className="todo-history-label">
          {selectedTodoId ? 'Affichage de l’historique pour cette tâche.' : 'Affichage de tous les événements.'}
        </div>
      </div>
    </div>
  );
}