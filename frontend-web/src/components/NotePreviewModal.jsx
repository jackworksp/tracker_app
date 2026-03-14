import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Edit3, Pin, Folder } from 'lucide-react';
import { Badge } from '@design-system';
import './NotePreviewModal.css';

const NotePreviewModal = ({ note, onClose, onEdit, folders, subjects }) => {
  if (!note) return null;

  const folder = folders?.find(f => f.id === note.folder_id);
  const subject = subjects?.find(s => s.id === note.subject_id);

  return (
    <div className="note-preview">
      <div className="note-preview-topbar">
        <button className="note-preview-back-btn" onClick={onClose}>
          <ArrowLeft size={16} />
          Notes
        </button>
        <div className="note-preview-meta-info">
          {note.is_pinned && <Pin size={13} className="note-preview-pin" fill="currentColor" />}
          {folder && (
            <span className="note-preview-chip">
              <Folder size={12} />{folder.name}
            </span>
          )}
        </div>
        <button className="note-preview-edit-btn" onClick={onEdit}>
          <Edit3 size={14} />
          Edit
        </button>
      </div>

      <div className="note-preview-body">
        {note.color && note.color !== '#ffffff' && (
          <div className="note-preview-color-bar" style={{ backgroundColor: note.color }} />
        )}

        <h1 className="note-preview-title">{note.title || 'Untitled'}</h1>

        {Array.isArray(note.tags) && note.tags.length > 0 && (
          <div className="note-preview-tags">
            {note.tags.map(tag => (
              <Badge key={tag} variant="indigo" size="sm">#{tag}</Badge>
            ))}
          </div>
        )}

        <div className="note-preview-content">
          {note.content?.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content}</ReactMarkdown>
          ) : (
            <p className="note-preview-empty">This note is empty.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotePreviewModal;
