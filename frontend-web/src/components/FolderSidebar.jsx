import React, { useState } from 'react';
import './FolderSidebar.css';

const FolderSidebar = ({ folders, selectedFolder, onSelectFolder, onCreateFolder, onRenameFolder, onDeleteFolder }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [editingFolderId, setEditingFolderId] = useState(null);
    const [editingFolderName, setEditingFolderName] = useState('');

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;

        try {
            await onCreateFolder(newFolderName.trim());
            setNewFolderName('');
            setIsCreating(false);
        } catch (error) {
            console.error('Error creating folder:', error);
            alert(error.message || 'Failed to create folder');
        }
    };

    const handleRenameFolder = async (folderId) => {
        if (!editingFolderName.trim()) return;

        try {
            await onRenameFolder(folderId, editingFolderName.trim());
            setEditingFolderId(null);
            setEditingFolderName('');
        } catch (error) {
            console.error('Error renaming folder:', error);
            alert(error.message || 'Failed to rename folder');
        }
    };

    const handleDeleteFolder = async (folderId, folderName) => {
        const confirmDelete = window.confirm(`Delete folder "${folderName}"? This will only work if the folder is empty.`);
        if (!confirmDelete) return;

        try {
            await onDeleteFolder(folderId);
        } catch (error) {
            console.error('Error deleting folder:', error);
            alert(error.message || 'Failed to delete folder. Make sure the folder is empty.');
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
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') handleCreateFolder();
                            if (e.key === 'Escape') {
                                setIsCreating(false);
                                setNewFolderName('');
                            }
                        }}
                    />
                    <div className="folder-input-actions">
                        <button onClick={handleCreateFolder} className="btn-confirm">✓</button>
                        <button onClick={() => {
                            setIsCreating(false);
                            setNewFolderName('');
                        }} className="btn-cancel">✕</button>
                    </div>
                </div>
            )}

            <div className="folder-list">
                <div
                    className={`folder-item ${selectedFolder === null ? 'active' : ''}`}
                    onClick={() => onSelectFolder(null)}
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
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') handleRenameFolder(folder.id);
                                        if (e.key === 'Escape') cancelEditing();
                                    }}
                                />
                                <div className="folder-input-actions">
                                    <button onClick={() => handleRenameFolder(folder.id)} className="btn-confirm">✓</button>
                                    <button onClick={cancelEditing} className="btn-cancel">✕</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div
                                    className="folder-item-content"
                                    onClick={() => onSelectFolder(folder.id)}
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
