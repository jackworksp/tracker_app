import React, { useState, useEffect } from 'react';
import { Plus, Search, StickyNote, MoreVertical } from 'lucide-react';
import { message } from 'antd';
import NoteCard from './NoteCard';
import AddNoteModal from './AddNoteModal';
import BidirectionalSwipeCard from './BidirectionalSwipeCard';
import FolderSidebar from './FolderSidebar';
import api from '../api';
import './NotesPage.css';

const NotesPage = () => {
    const [notes, setNotes] = useState([]);
    const [folders, setFolders] = useState([]);
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [filteredNotes, setFilteredNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [editingNote, setEditingNote] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);

    useEffect(() => {
        loadFolders();
        loadNotes();
    }, []);

    useEffect(() => {
        loadNotes();
    }, [selectedFolder]);

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

    const loadFolders = async () => {
        try {
            const data = await api.noteFolders.getAll();
            setFolders(data || []);
        } catch (error) {
            console.error('Failed to load folders:', error);
            message.error('Failed to load folders');
        }
    };

    const loadNotes = async () => {
        try {
            setLoading(true);
            const data = await api.notes.getAll(selectedFolder);
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

    const handleCreateFolder = async (name) => {
        await api.noteFolders.create({ name });
        message.success('Folder created');
        loadFolders();
    };

    const handleRenameFolder = async (id, name) => {
        await api.noteFolders.update(id, { name });
        message.success('Folder renamed');
        loadFolders();
    };

    const handleDeleteFolder = async (id) => {
        await api.noteFolders.delete(id);
        message.success('Folder deleted');
        if (selectedFolder === id) {
            setSelectedFolder(null);
        }
        loadFolders();
    };

    const handleContextMenu = (e, note) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            note
        });
    };

    const handleMoveNote = async (noteId, folderId) => {
        try {
            await api.notes.move(noteId, folderId);
            message.success('Note moved');
            loadNotes();
            setContextMenu(null);
        } catch (error) {
            console.error('Failed to move note:', error);
            message.error('Failed to move note');
        }
    };

    const handleCopyNote = async (noteId, folderId) => {
        try {
            await api.notes.copy(noteId, folderId);
            message.success('Note copied');
            loadNotes();
            setContextMenu(null);
        } catch (error) {
            console.error('Failed to copy note:', error);
            message.error('Failed to copy note');
        }
    };

    const handleDeleteNote = async (noteId) => {
        if (!window.confirm('Delete this note?')) return;

        try {
            await api.notes.delete(noteId);
            message.success('Note deleted');
            loadNotes();
            setContextMenu(null);
        } catch (error) {
            console.error('Failed to delete note:', error);
            message.error('Failed to delete note');
        }
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
        <div className="notes-page" onClick={() => setContextMenu(null)}>
            <div className="notes-layout">
                <FolderSidebar
                    folders={folders}
                    selectedFolder={selectedFolder}
                    onSelectFolder={setSelectedFolder}
                    onCreateFolder={handleCreateFolder}
                    onRenameFolder={handleRenameFolder}
                    onDeleteFolder={handleDeleteFolder}
                />

                <div className="notes-main-content">
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
                                <div key={note.id} onContextMenu={(e) => handleContextMenu(e, note)}>
                                     <BidirectionalSwipeCard
                                        onSwipeRight={() => handleDeleteNote(note.id)}
                                    >
                                        <NoteCard
                                            note={note}
                                            onClick={handleNoteClick}
                                        />
                                    </BidirectionalSwipeCard>
                                </div>
                            ))}
                        </div>

                        {filteredNotes.length === 0 && searchTerm && (
                            <div className="empty-notes-state" style={{ height: 'auto', marginTop: '2rem' }}>
                                <p>No notes match "{searchTerm}"</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <div
                    className="note-context-menu"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="context-menu-section">
                        <div className="context-menu-header">Move to folder</div>
                        <div className="context-menu-item" onClick={() => handleMoveNote(contextMenu.note.id, null)}>
                            📁 Unfiled
                        </div>
                        {folders.map(folder => (
                            <div
                                key={folder.id}
                                className="context-menu-item"
                                onClick={() => handleMoveNote(contextMenu.note.id, folder.id)}
                            >
                                📁 {folder.name}
                            </div>
                        ))}
                    </div>
                    <div className="context-menu-divider"></div>
                    <div className="context-menu-section">
                        <div className="context-menu-header">Copy to folder</div>
                        <div className="context-menu-item" onClick={() => handleCopyNote(contextMenu.note.id, null)}>
                            📁 Unfiled
                        </div>
                        {folders.map(folder => (
                            <div
                                key={folder.id}
                                className="context-menu-item"
                                onClick={() => handleCopyNote(contextMenu.note.id, folder.id)}
                            >
                                📁 {folder.name}
                            </div>
                        ))}
                    </div>
                    <div className="context-menu-divider"></div>
                    <div
                        className="context-menu-item context-menu-danger"
                        onClick={() => handleDeleteNote(contextMenu.note.id)}
                    >
                        🗑️ Delete Note
                    </div>
                </div>
            )}

            <AddNoteModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSubmit={handleSaveNote}
                initialData={editingNote}
                currentFolder={selectedFolder}
            />
        </div>
    );
};

export default NotesPage;
