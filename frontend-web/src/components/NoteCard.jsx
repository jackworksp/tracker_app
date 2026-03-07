import React from 'react';
import { Icon, Pin, Calendar } from '@design-system';
import './NotesPage.css';

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
};

// Strip markdown syntax for plain-text card previews
const stripMarkdown = (text) => {
  if (!text) return '';
  return text
    .replace(/^#{1,6}\s+/gm, '')       // headings
    .replace(/\*\*(.+?)\*\*/g, '$1')   // bold
    .replace(/\*(.+?)\*/g, '$1')       // italic
    .replace(/`{3}[\s\S]*?`{3}/g, '')  // code blocks
    .replace(/`(.+?)`/g, '$1')         // inline code
    .replace(/^>\s+/gm, '')            // blockquotes
    .replace(/^[-*+]\s+/gm, '')        // bullet lists
    .replace(/^\d+\.\s+/gm, '')        // numbered lists
    .replace(/^---+$/gm, '')           // hr
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // links
    .replace(/\n+/g, ' ')              // collapse newlines
    .trim();
};

const NoteCard = ({ note, onClick }) => {
  const hasColorAccent =
    note.color && note.color.toLowerCase() !== '#ffffff' && note.color.toLowerCase() !== '#fff';

  const visibleTags = note.tags ? note.tags.slice(0, 3) : [];
  const extraTagCount = note.tags ? Math.max(0, note.tags.length - 3) : 0;
  const formattedDate = formatDate(note.updated_at);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(note);
    }
  };

  return (
    <div
      className="note-card"
      role="button"
      tabIndex={0}
      onClick={() => onClick(note)}
      onKeyDown={handleKeyDown}
      aria-label={note.title || 'Untitled note'}
    >
      {hasColorAccent && (
        <div
          className="note-card-color-accent"
          style={{ backgroundColor: note.color }}
        />
      )}

      {note.is_pinned && (
        <div className="note-card-pin">
          <Icon icon={Pin} size={13} fill="currentColor" aria-label="Pinned" />
        </div>
      )}

      {note.title && (
        <h3 className="note-card-title">{note.title}</h3>
      )}

      {note.content && (
        <p className="note-card-preview">{stripMarkdown(note.content)}</p>
      )}

      {visibleTags.length > 0 && (
        <div className="note-card-tags">
          {visibleTags.map((tag, index) => (
            <span key={index} className="note-card-tag">#{tag}</span>
          ))}
          {extraTagCount > 0 && (
            <span className="note-card-tag-more">+{extraTagCount} more</span>
          )}
        </div>
      )}

      <div className="note-card-footer">
        {formattedDate && (
          <span className="note-card-date">
            <Icon icon={Calendar} size={11} color="tertiary" />
            {formattedDate}
          </span>
        )}
      </div>
    </div>
  );
};

export default NoteCard;
