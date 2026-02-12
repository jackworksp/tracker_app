import React from 'react';
import { StickyNote, X } from 'lucide-react';
import './NoteAttachmentCard.css';

const NoteAttachmentCard = ({ note, onUnlink, onClick }) => {
  if (!note) return null;

  const handleUnlink = (e) => {
    e.stopPropagation();

    // Check if mobile device
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      // Add confirmation on mobile to prevent accidental unlinks
      if (window.confirm(`Unlink note "${note.title}"?`)) {
        onUnlink();
      }
    } else {
      onUnlink();
    }
  };

  return (
    <div
      className="note-attachment-card"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      title={note.title || 'Note'}
    >
      <button
        className="note-unlink-btn"
        onClick={handleUnlink}
        title="Unlink note"
      >
        <X size={14} />
      </button>

      <div className="note-attachment-card-content">
        <div className="note-icon-wrapper">
          <StickyNote size={24} />
        </div>
        {note.title && (
          <div className="note-attachment-title">
            {note.title.length > 10 ? `${note.title.substring(0, 10)}...` : note.title}
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteAttachmentCard;
