import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search } from 'lucide-react';
import { message } from 'antd';
import NoteCard from './NoteCard';
import api from '../api';
import './NoteSelectorModal.css';

const NoteSelectorModal = ({ isOpen, onClose, onSelectNote, excludeNoteIds = [], taskId }) => {
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadNotes();
    }
  }, [isOpen]);

  useEffect(() => {
    filterNotes();
  }, [searchTerm, notes, excludeNoteIds]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const data = await api.notes.getAll();
      setNotes(data || []);
    } catch (error) {
      console.error('Failed to load notes:', error);
      message.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const filterNotes = () => {
    let filtered = notes;

    // Exclude already-linked notes
    if (excludeNoteIds.length > 0) {
      filtered = filtered.filter(note => !excludeNoteIds.includes(note.id));
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const lowerTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(lowerTerm) ||
        (note.content && note.content.toLowerCase().includes(lowerTerm)) ||
        (note.tags && note.tags.some(tag => tag.toLowerCase().includes(lowerTerm)))
      );
    }

    setFilteredNotes(filtered);
  };

  const handleSelectNote = async (note) => {
    // If taskId is provided, link directly (existing behavior)
    if (taskId) {
      try {
        await api.noteLinks.linkToTask(taskId, note.id);
        message.success('Note linked successfully');
        if (onSelectNote) onSelectNote(note);
        onClose();
      } catch (error) {
        console.error('Failed to link note:', error);
        message.error('Failed to link note');
      }
    } else {
      // If no taskId, just return the selected note ID (for pending linking)
      if (onSelectNote) onSelectNote(note.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="note-selector-backdrop"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, x: '-50%', y: 'calc(-50% + 20px)' }}
        animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
        exit={{ opacity: 0, scale: 0.95, x: '-50%', y: 'calc(-50% + 20px)' }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="note-selector-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="note-selector-header">
          <h3>Select a Note to Link</h3>
          <button className="note-selector-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="note-selector-search-bar">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search notes by title, content, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="note-selector-search-input"
            autoFocus
          />
        </div>

        <div className="note-selector-content">
          {loading ? (
            <div className="note-selector-loading">Loading notes...</div>
          ) : filteredNotes.length === 0 ? (
            <div className="note-selector-empty">
              {searchTerm ? 'No notes found matching your search' : 'No notes available to link'}
            </div>
          ) : (
            <div className="note-selector-grid">
              {filteredNotes.map(note => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onClick={handleSelectNote}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NoteSelectorModal;
