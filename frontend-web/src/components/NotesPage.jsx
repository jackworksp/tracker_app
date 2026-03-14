import React, { useState, useEffect } from 'react';
import { Plus, Search, StickyNote, FolderOpen, LayoutGrid } from 'lucide-react';
import { message } from 'antd';
import NoteCard from './NoteCard';
import NoteEditor from './NoteEditor';
import NotePreviewModal from './NotePreviewModal';
import BidirectionalSwipeCard from './BidirectionalSwipeCard';
import FolderSidebar from './FolderSidebar';
import { Modal, Button, Badge } from '@design-system';
import api from '../api';
import './NotesPage.css';

const NotesPage = ({ subjectId }) => {
    const [notes, setNotes] = useState([]);
    const [folders, setFolders] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [filteredNotes, setFilteredNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [contextMenu, setContextMenu] = useState(null);

    // Preview state
    const [showPreview, setShowPreview] = useState(false);
    const [previewNote, setPreviewNote] = useState(null);

    // Editor state — null = list view, object/false = editor open
    const [showEditor, setShowEditor] = useState(false);
    const [editorNote, setEditorNote] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null); // { noteId, source: 'editor'|'list' }
    const [sortBy, setSortBy] = useState('pinned');
    const [activeTag, setActiveTag] = useState(null);
    const [activeView, setActiveView] = useState('notes'); // 'folders' | 'notes'

    useEffect(() => {
        loadFolders();
        loadNotes();
        loadSubjects();
    }, []);

    useEffect(() => {
        loadNotes();
    }, [selectedFolder, subjectId]);

    useEffect(() => {
        if (!Array.isArray(notes)) { setFilteredNotes([]); return; }
        let result = notes;
        if (searchTerm.trim()) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(note =>
                note.title?.toLowerCase().includes(lowerTerm) ||
                (note.content && note.content.toLowerCase().includes(lowerTerm)) ||
                (Array.isArray(note.tags) && note.tags.some(tag => tag?.toLowerCase().includes(lowerTerm)))
            );
        }
        if (activeTag) {
            result = result.filter(note =>
                Array.isArray(note.tags) && note.tags.includes(activeTag)
            );
        }
        result = [...result].sort((a, b) => {
            if (sortBy === 'pinned') {
                if (a.is_pinned && !b.is_pinned) return -1;
                if (!a.is_pinned && b.is_pinned) return 1;
                return new Date(b.updated_at) - new Date(a.updated_at);
            }
            if (sortBy === 'newest') return new Date(b.updated_at) - new Date(a.updated_at);
            if (sortBy === 'oldest') return new Date(a.updated_at) - new Date(b.updated_at);
            if (sortBy === 'az') return (a.title || '').localeCompare(b.title || '');
            return 0;
        });
        setFilteredNotes(result);
    }, [searchTerm, notes, sortBy, activeTag]);

    const loadFolders = async () => {
        try {
            const data = await api.noteFolders.getAll();
            setFolders(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load folders:', error);
            setFolders([]);
        }
    };

    const loadSubjects = async () => {
        try {
            const response = await api.subjects.getAll();
            const data = response?.data || response;
            setSubjects(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load subjects:', error);
            setSubjects([]);
        }
    };

    const loadNotes = async () => {
        try {
            setLoading(true);
            const data = await api.notes.getAll(selectedFolder, subjectId);
            const safeData = Array.isArray(data) ? data : [];
            setNotes(safeData);
            setFilteredNotes(safeData);
        } catch (error) {
            console.error('Failed to load notes:', error);
            setNotes([]);
            setFilteredNotes([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveNote = async (noteData) => {
        const safeData = {
            ...noteData,
            title: noteData.title?.trim() || 'Untitled',
            // New notes have subject_id=null from the editor; assign current subject so
            // loadNotes() (which filters by subjectId) returns the note after saving.
            subject_id: noteData.subject_id || subjectId || null,
        };
        if (safeData.id) {
            const updated = await api.notes.update(safeData.id, safeData);
            setNotes(prev => prev.map(n => n.id === safeData.id ? updated : n));
            return updated;
        } else {
            const created = await api.notes.create(safeData);
            // Switch editor to the now-saved note so auto-save works on subsequent edits.
            setEditorNote(created);
            loadNotes();
            return created;
        }
    };

    const handleNoteClick = (note) => {
        setPreviewNote(note);
        setShowPreview(true);
    };

    const handlePreviewClose = () => {
        setShowPreview(false);
        setPreviewNote(null);
    };

    const handlePreviewEdit = () => {
        setShowPreview(false);
        setEditorNote(previewNote);
        setShowEditor(true);
    };

    const handleAddClick = () => {
        setEditorNote(null);
        setShowEditor(true);
    };

    const handleEditorBack = () => {
        setShowEditor(false);
        setEditorNote(null);
        setIsFullscreen(false);
        loadNotes();
    };

    const handleEditorDelete = (noteId) => {
        setDeleteTarget({ noteId, source: 'editor' });
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
        if (selectedFolder === id) setSelectedFolder(null);
        loadFolders();
    };

    const handleContextMenu = (e, note) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, note });
    };

    const handleMoveNote = async (noteId, folderId) => {
        try {
            await api.notes.move(noteId, folderId);
            message.success('Note moved');
            loadNotes();
            setContextMenu(null);
        } catch (error) {
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
            message.error('Failed to copy note');
        }
    };

    const handleDeleteNote = (noteId) => {
        setDeleteTarget({ noteId, source: 'list' });
    };

    const confirmDeleteNote = async () => {
        if (!deleteTarget) return;
        const { noteId, source } = deleteTarget;
        setDeleteTarget(null);
        try {
            await api.notes.delete(noteId);
            message.success('Note deleted');
            if (source === 'editor') {
                setShowEditor(false);
                setEditorNote(null);
            }
            loadNotes();
            setContextMenu(null);
        } catch (error) {
            console.error('Failed to delete note:', error);
            message.error('Failed to delete note');
        }
    };

    // — List view —
    // Don't early-return while editor is open: that would unmount the Modal,
    // causing it to reopen when loading finishes (showEditor is still true).
    if (loading && !showEditor && !showPreview) {
        return (
            <div className="notes-page">
                <div className="loading-container">
                    <div className="loading-spinner" />
                    <p>Loading notes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="notes-page" onClick={() => setContextMenu(null)}>
            <div className="notes-view-toggle">
                <button
                    className={`notes-view-btn${activeView === 'folders' ? ' active' : ''}`}
                    onClick={() => setActiveView('folders')}
                    title="Folders view"
                >
                    <FolderOpen size={16} />
                    Folders
                </button>
                <button
                    className={`notes-view-btn${activeView === 'notes' ? ' active' : ''}`}
                    onClick={() => setActiveView('notes')}
                    title="Notes view"
                >
                    <LayoutGrid size={16} />
                    Notes
                </button>
            </div>

            <div className="notes-layout">
                {activeView === 'folders' && (
                <FolderSidebar
                    folders={folders}
                    selectedFolder={selectedFolder}
                    onSelectFolder={(id) => { setSelectedFolder(id); setActiveView('notes'); }}
                    onCreateFolder={handleCreateFolder}
                    onRenameFolder={handleRenameFolder}
                    onDeleteFolder={handleDeleteFolder}
                />
                )}

                {activeView === 'notes' && (
                <div className="notes-main-content">
                    <div className="notes-header">
                        <div className="notes-header-top">
                            <h1 className="notes-title">
                                <StickyNote size={22} />
                                {selectedFolder ? (folders.find(f => f.id === selectedFolder)?.name ?? 'Notes') : 'All Notes'}
                            </h1>
                            <select
                                className="notes-sort-select"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                aria-label="Sort notes"
                            >
                                <option value="pinned">Pinned first</option>
                                <option value="newest">Newest</option>
                                <option value="oldest">Oldest</option>
                                <option value="az">A → Z</option>
                            </select>
                        </div>
                        <div className="notes-search-container">
                            <Search size={16} />
                            <input
                                type="text"
                                className="notes-search-input"
                                placeholder="Search by title, content, or tag..."
                                aria-label="Search notes"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {(() => {
                            const allTags = [...new Set(notes.flatMap(n => Array.isArray(n.tags) ? n.tags : []))];
                            return allTags.length > 0 ? (
                                <div className="notes-tag-filters">
                                    {allTags.map(tag => (
                                        <Badge
                                            key={tag}
                                            variant="indigo"
                                            size="sm"
                                            active={activeTag === tag}
                                            onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                                        >
                                            #{tag}
                                        </Badge>
                                    ))}
                                </div>
                            ) : null;
                        })()}
                    </div>

                    <div className="notes-content-area">
                        <div className="notes-masonry-grid">
                            <div className="new-note-card" onClick={handleAddClick}>
                                <Plus size={18} />
                                <span>New Note</span>
                            </div>

                            {Array.isArray(filteredNotes) && filteredNotes.map(note => (
                                <div key={note.id} onContextMenu={(e) => handleContextMenu(e, note)}>
                                    <BidirectionalSwipeCard onSwipeRight={() => handleDeleteNote(note.id)}>
                                        <NoteCard note={note} onClick={handleNoteClick} />
                                    </BidirectionalSwipeCard>
                                </div>
                            ))}
                        </div>

                        {filteredNotes.length === 0 && !loading && (
                            <div className="empty-notes-state">
                                {searchTerm
                                    ? <p>No notes match "{searchTerm}"</p>
                                    : activeTag
                                    ? <p>No notes tagged #{activeTag}</p>
                                    : selectedFolder
                                    ? <p>This folder is empty. Create a note or move one here.</p>
                                    : <p>No notes yet. Create your first note!</p>
                                }
                            </div>
                        )}
                    </div>
                </div>
                )}
            </div>

            {/* Note Preview Modal */}
            <Modal
                isOpen={showPreview}
                onClose={handlePreviewClose}
                title={null}
                showCloseButton={false}
                closeOnOverlayClick={true}
                closeOnEscape={true}
                size="xl"
                className="note-editor-modal"
            >
                <NotePreviewModal
                    note={previewNote}
                    folders={folders}
                    subjects={subjects}
                    onClose={handlePreviewClose}
                    onEdit={handlePreviewEdit}
                />
            </Modal>

            {/* Note Editor Modal */}
            <Modal
                isOpen={showEditor}
                onClose={handleEditorBack}
                title={null}
                showCloseButton={false}
                closeOnOverlayClick={false}
                closeOnEscape={true}
                size={isFullscreen ? 'full' : 'xl'}
                className={`note-editor-modal${isFullscreen ? ' note-editor-modal--fullscreen' : ''}`}
            >
                <NoteEditor
                    note={editorNote}
                    folders={folders}
                    subjects={subjects}
                    onBack={handleEditorBack}
                    onSave={handleSaveNote}
                    onDelete={handleEditorDelete}
                    isFullscreen={isFullscreen}
                    onToggleFullscreen={() => setIsFullscreen(f => !f)}
                />
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                title="Delete Note"
                size="sm"
            >
                <p style={{ marginBottom: '20px', color: 'var(--nds-text-secondary)' }}>
                    Are you sure you want to delete this note? This cannot be undone.
                </p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                    <Button variant="danger" onClick={confirmDeleteNote}>Delete</Button>
                </div>
            </Modal>

            {/* Context Menu */}
            {contextMenu && (
                <div
                    className="note-context-menu"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="context-menu-section">
                        <div className="context-menu-header">Move to folder</div>
                        <div className="context-menu-item" onClick={() => handleMoveNote(contextMenu.note.id, null)}>📁 Unfiled</div>
                        {folders.map(folder => (
                            <div key={folder.id} className="context-menu-item" onClick={() => handleMoveNote(contextMenu.note.id, folder.id)}>
                                📁 {folder.name}
                            </div>
                        ))}
                    </div>
                    <div className="context-menu-divider" />
                    <div className="context-menu-section">
                        <div className="context-menu-header">Copy to folder</div>
                        <div className="context-menu-item" onClick={() => handleCopyNote(contextMenu.note.id, null)}>📁 Unfiled</div>
                        {folders.map(folder => (
                            <div key={folder.id} className="context-menu-item" onClick={() => handleCopyNote(contextMenu.note.id, folder.id)}>
                                📁 {folder.name}
                            </div>
                        ))}
                    </div>
                    <div className="context-menu-divider" />
                    <div className="context-menu-item context-menu-danger" onClick={() => handleDeleteNote(contextMenu.note.id)}>
                        🗑️ Delete Note
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotesPage;
