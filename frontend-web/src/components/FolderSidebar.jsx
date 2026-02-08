import React, { useState } from 'react';
import './FolderSidebar.css';

const FolderSidebar = ({ folders, selectedFolder, onSelectFolder, onCreateFolder, onRenameFolder, onDeleteFolder }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [editingFolderId, setEditingFolderId] = useState(null);
    const [editingFolderName, setEditingFolderName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCreateFolder = async () => {
        if (!newFolderName.trim() || isSubmitting) return;

        try {
            setIsSubmitting(true);
            await onCreateFolder(newFolderName.trim());
            setNewFolderName('');
            setIsCreating(false);
        } catch (error) {
            console.error('Error creating folder:', error);
            alert(error.message || 'Failed to create folder');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRenameFolder = async (folderId) => {
        if (!editingFolderName.trim() || isSubmitting) return;

        try {
            setIsSubmitting(true);
            await onRenameFolder(folderId, editingFolderName.trim());
            setEditingFolderId(null);
            setEditingFolderName('');
        } catch (error) {
            console.error('Error renaming folder:', error);
            alert(error.message || 'Failed to rename folder');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteFolder = async (folderId, folderName) => {
        if (isSubmitting) return;
        
        const confirmDelete = window.confirm(`Delete folder "${folderName}"? This will only work if the folder is empty.`);
        if (!confirmDelete) return;

        try {
            setIsSubmitting(true);
            await onDeleteFolder(folderId);
        } catch (error) {
            console.error('Error deleting folder:', error);
            alert(error.message || 'Failed to delete folder. Make sure the folder is empty.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const startEditing = (folder) => {
        setEditingFolderId(folder.id);
        setEditingFolderName(folder.name);
    };

    const cancelEditing = () => {
        setEditingFolderId(null);
        setEditingFolderName('');
    };

    return (
        <div className="folder-sidebar">
            <div className="folder-sidebar-header">
                <h3>Folders</h3>
                <button
                    className="add-folder-btn"
                    onClick={() => setIsCreating(true)}
                    title="Create new folder"
                    disabled={isSubmitting}
                >
                    +
                </button>
            </div>

            {isCreating && (
                <div className="folder-input-container">
                    <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="Folder name..."
                        autoFocus
                        disabled={isSubmitting}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') handleCreateFolder();
                            if (e.key === 'Escape' && !isSubmitting) {
                                setIsCreating(false);
                                setNewFolderName('');
                            }
                        }}
                    />
                    <div className="folder-input-actions">
                        <button onClick={handleCreateFolder} className="btn-confirm" disabled={isSubmitting}>✓</button>
                        <button onClick={() => {
                            setIsCreating(false);
                            setNewFolderName('');
                        }} className="btn-cancel" disabled={isSubmitting}>✕</button>
                    </div>
                </div>
            )}

            <div className="folder-list">
                <div
                    className={`folder-item ${selectedFolder === null ? 'active' : ''}`}
                    onClick={() => !isSubmitting && onSelectFolder(null)}
                >
                    <span className="folder-icon">📁</span>
                    <span className="folder-name">All Notes</span>
                </div>

                {folders.map(folder => (
                    <div key={folder.id} className={`folder-item ${selectedFolder === folder.id ? 'active' : ''}`}>
                        {editingFolderId === folder.id ? (
                            <div className="folder-edit-container">
                                <input
                                    type="text"
                                    value={editingFolderName}
                                    onChange={(e) => setEditingFolderName(e.target.value)}
                                    autoFocus
                                    disabled={isSubmitting}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') handleRenameFolder(folder.id);
                                        if (e.key === 'Escape' && !isSubmitting) cancelEditing();
                                    }}
                                />
                                <div className="folder-input-actions">
                                    <button onClick={() => handleRenameFolder(folder.id)} className="btn-confirm" disabled={isSubmitting}>✓</button>
                                    <button onClick={cancelEditing} className="btn-cancel" disabled={isSubmitting}>✕</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div
                                    className="folder-item-content"
                                    onClick={() => !isSubmitting && onSelectFolder(folder.id)}
                                >
                                    <span className="folder-icon">📁</span>
                                    <span className="folder-name">{folder.name}</span>
                                </div>
                                <div className="folder-actions">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            startEditing(folder);
                                        }}
                                        className="folder-action-btn"
                                        title="Rename"
                                        disabled={isSubmitting}
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteFolder(folder.id, folder.name);
                                        }}
                                        className="folder-action-btn"
                                        title="Delete"
                                        disabled={isSubmitting}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FolderSidebar;
