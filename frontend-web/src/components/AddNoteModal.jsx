import React, { useState, useEffect } from 'react';
import { X, Check, Pin, Folder, GraduationCap } from 'lucide-react';
import { message } from 'antd';
import api from '../api';
import './AddNoteModal.css';

const AddNoteModal = ({ visible, onClose, onSubmit, initialData, currentFolder }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [color, setColor] = useState('#ffffff');
  const [folderId, setFolderId] = useState(null);

  const [subjectId, setSubjectId] = useState(null);
  const [folders, setFolders] = useState([]);
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    if (visible) {
      loadFolders();
      loadSubjects();
      if (initialData) {
        setTitle(initialData.title || '');
        setContent(initialData.content || '');
        setTags(initialData.tags || []);
        setIsPinned(initialData.is_pinned || false);
        setColor(initialData.color || '#ffffff');

        setFolderId(initialData.folder_id || null);
        setSubjectId(initialData.subject_id || null);
      } else {
        // Reset form
        setTitle('');
        setContent('');
        setTags([]);
        setIsPinned(false);
        setColor('#ffffff');
        setFolderId(currentFolder || null);
        setSubjectId(null);
      }
    }
  }, [visible, initialData, currentFolder]);

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
      // subjects.getAll() returns { data: [...], pagination: {...} }
      const subjects = response?.data || response;
      setSubjects(Array.isArray(subjects) ? subjects : []);
    } catch (error) {
      console.error('Failed to load subjects:', error);
      setSubjects([]);
    }
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) {
      message.error('Please add a title or content');
      return;
    }

    try {
      await onSubmit({
        id: initialData?.id,
        title,
        content,
        tags,
        is_pinned: isPinned,
        color,
        folder_id: folderId,
        subject_id: subjectId
      });
      onClose();
    } catch (error) {
      console.error('Error submitting note:', error);
    }
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content note-modal" onClick={e => e.stopPropagation()} style={{ backgroundColor: color }}>
        <form onSubmit={handleSubmit}>
          <div className="note-modal-header">
            <input
              type="text"
              className="note-title-input"
              placeholder="Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            <button 
                type="button" 
                className={`pin-button ${isPinned ? 'pinned' : ''}`}
                onClick={() => setIsPinned(!isPinned)}
            >
                <Pin size={20} fill={isPinned ? "currentColor" : "none"} />
            </button>
          </div>
          
          <div className="note-modal-body">
            <textarea
              className="note-content-input"
              placeholder="Take a note..."
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={5}
            />
            
            <div className="tags-section">
              <div className="active-tags">
                {Array.isArray(tags) && tags.map(tag => (
                  <span key={tag} className="tag-chip">
                    #{tag}
                    <button type="button" onClick={() => removeTag(tag)}><X size={12} /></button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                className="tag-input"
                placeholder="Add tag (Press Enter)..."
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
              />
            </div>



            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <div className="folder-select-section" style={{ flex: 1 }}>
                  <Folder size={16} />
                  <select
                    className="folder-select"
                    value={folderId || ''}
                    onChange={e => setFolderId(e.target.value === '' ? null : parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  >
                    <option value="">No Folder</option>
                    {Array.isArray(folders) && folders.map(folder => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="folder-select-section" style={{ flex: 1 }}>
                  <GraduationCap size={16} />
                  <select
                    className="folder-select"
                    value={subjectId || ''}
                    onChange={e => setSubjectId(e.target.value === '' ? null : parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  >
                    <option value="">No Subject</option>
                    {Array.isArray(subjects) && subjects.map(subject => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>
            </div>

            <div className="color-picker-row">
                {['#ffffff', '#f28b82', '#fbbc04', '#fff475', '#ccff90', '#a7ffeb', '#cbf0f8', '#aecbfa', '#d7aefb', '#fdcfe8', '#e6c9a8', '#e8eaed'].map(c => (
                    <button
                        key={c}
                        type="button"
                        className={`color-circle ${color === c ? 'selected' : ''}`}
                        style={{ backgroundColor: c }}
                        onClick={() => setColor(c)}
                    />
                ))}
            </div>
          </div>

          <div className="note-modal-footer">
            <button type="button" className="btn-text" onClick={onClose}>Close</button>
            <button type="submit" className="btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNoteModal;
