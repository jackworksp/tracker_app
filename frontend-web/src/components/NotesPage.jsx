import React, { useState, useEffect } from 'react';
import { Plus, Search, StickyNote } from 'lucide-react';
import { message } from 'antd';
import NoteCard from './NoteCard';
import AddNoteModal from './AddNoteModal';
import api from '../api';
import './NotesPage.css';

const NotesPage = () => {
    const [notes, setNotes] = useState([]);
    const [filteredNotes, setFilteredNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [editingNote, setEditingNote] = useState(null);

    useEffect(() => {
        loadNotes();
    }, []);

    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredNotes(notes);
        } else {
            const lowerTerm = searchTerm.toLowerCase();
            const filtered = notes.filter(note => 
                note.title.toLowerCase().includes(lowerTerm) || 
                (note.content && note.content.toLowerCase().includes(lowerTerm)) ||
                (note.tags && note.tags.some(tag => tag.toLowerCase().includes(lowerTerm)))
            );
            setFilteredNotes(filtered);
        }
    }, [searchTerm, notes]);

    const loadNotes = async () => {
        try {
            setLoading(true);
            const data = await api.notes.getAll();
            setNotes(data || []);
            setFilteredNotes(data || []);
        } catch (error) {
            console.error('Failed to load notes:', error);
            message.error('Failed to load notes');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveNote = async (noteData) => {
        try {
            if (noteData.id) {
                await api.notes.update(noteData.id, noteData);
                message.success('Note updated');
            } else {
                await api.notes.create(noteData);
                message.success('Note created');
            }
            loadNotes();
        } catch (error) {
            console.error('Failed to save note:', error);
            message.error('Failed to save note');
            throw error;
        }
    };

    const handleNoteClick = (note) => {
        setEditingNote(note);
        setModalVisible(true);
    };

    const handleAddClick = () => {
        setEditingNote(null);
        setModalVisible(true);
    };

    if (loading) {
        return (
            <div className="notes-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading notes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="notes-page">
            <div className="notes-header">
                <div className="notes-header-top">
                    <h1 className="notes-title">
                        <StickyNote size={28} color="#fbbc04" />
                        Notes
                    </h1>
                </div>
                
                <div className="notes-search-container">
                    <Search size={20} className="text-gray-400" />
                    <input
                        type="text"
                        className="notes-search-input"
                        placeholder="Search notes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="notes-content-area">
                <div className="notes-masonry-grid">
                    {/* New Note Card */}
                    <div className="new-note-card" onClick={handleAddClick}>
                        <div className="new-note-icon-wrapper">
                            <Plus size={24} />
                        </div>
                        <span className="new-note-text">New Note</span>
                    </div>

                    {filteredNotes.map(note => (
                        <NoteCard 
                            key={note.id} 
                            note={note} 
                            onClick={handleNoteClick} 
                        />
                    ))}
                </div>
                
                {filteredNotes.length === 0 && searchTerm && (
                    <div className="empty-notes-state" style={{ height: 'auto', marginTop: '2rem' }}>
                        <p>No notes match "{searchTerm}"</p>
                    </div>
                )}
            </div>

            {/* FAB Removed in favor of New Note Card */}
            {/* <button 
                className="fab-add-note" 
                onClick={handleAddClick}
                title="Create Note"
            >
                <Plus size={24} />
            </button> */}

            <AddNoteModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSubmit={handleSaveNote}
                initialData={editingNote}
            />
        </div>
    );
};

export default NotesPage;
