import React from 'react';
import { CheckCircle, Trash2, ExternalLink, Youtube, BookOpen, Film } from 'lucide-react';
import './QueueCard.css';

function getFavicon(url) {
  try {
    const host = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=32`;
  } catch {
    return null;
  }
}

function getDomain(url) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

function TypeIcon({ type }) {
  if (type === 'WATCH') return <Youtube size={16} />;
  if (type === 'READ') return <BookOpen size={16} />;
  return <Film size={16} />;
}

export default function QueueCard({ task, onMarkDone, onDelete }) {
  const favicon = task.url ? getFavicon(task.url) : null;
  const domain = task.url ? getDomain(task.url) : null;

  return (
    <div className={`queue-card ${task.completed ? 'queue-card--done' : ''}`}>
      {/* Thumbnail / icon */}
      <div className="queue-card__thumb">
        {favicon ? (
          <img src={favicon} alt="" width={20} height={20} onError={e => { e.target.style.display = 'none'; }} />
        ) : (
          <TypeIcon type={task.type} />
        )}
      </div>

      {/* Content */}
      <div className="queue-card__content">
        <div className="queue-card__title">{task.title}</div>
        {domain && <div className="queue-card__domain">{domain}</div>}
      </div>

      {/* Type badge */}
      <span className={`queue-card__badge queue-card__badge--${(task.type || 'WATCH').toLowerCase()}`}>
        {task.type === 'WATCH' ? 'Watch' : 'Read'}
      </span>

      {/* Actions */}
      <div className="queue-card__actions">
        {task.url && (
          <a
            href={task.url}
            target="_blank"
            rel="noopener noreferrer"
            className="queue-card__btn"
            title="Open link"
            onClick={e => e.stopPropagation()}
          >
            <ExternalLink size={15} />
          </a>
        )}
        {!task.completed && (
          <button
            className="queue-card__btn queue-card__btn--done"
            onClick={() => onMarkDone && onMarkDone(task)}
            title="Mark as done"
          >
            <CheckCircle size={15} />
          </button>
        )}
        <button
          className="queue-card__btn queue-card__btn--delete"
          onClick={() => onDelete && onDelete(task.id)}
          title="Remove"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
