import React from 'react';
import { Pin } from 'lucide-react';
import './NotesPage.css';

const NoteCard = ({ note, onClick }) => {
  return (
    <div 
      className="note-card" 
      onClick={() => onClick(note)}
      style={{ '--note-color': note.color || '#ffffff' }}
    >
      {note.is_pinned && (
        <div className="note-pin">
          <Pin size={14} fill="currentColor" />
        </div>
      )}
      
      {note.title && <h3 className="note-title">{note.title}</h3>}
      
      {note.content && (
        <p className="note-preview">
          {note.content}
        </p>
      )}
      
      {note.tags && note.tags.length > 0 && (
        <div className="note-tags">
          {note.tags.map((tag, index) => (
            <span key={index} className="note-tag">#{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
};

export default NoteCard;
