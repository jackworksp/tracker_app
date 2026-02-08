import React from 'react';
import { StickyNote, X } from 'lucide-react';
import './NoteAttachmentCard.css';

const NoteAttachmentCard = ({ note, onUnlink, onClick }) => {
  if (!note) return null;

  return (
    <div className="note-attachment-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <button
        className="note-unlink-btn"
        onClick={(e) => {
          e.stopPropagation();
          onUnlink();
        }}
        title="Unlink note"
      >
        <X size={14} />
      </button>
      
      <div className="note-attachment-card-content">
        <div className="note-icon-wrapper">
          <StickyNote size={24} />
        </div>
      </div>
    </div>
  );
};

export default NoteAttachmentCard;
