import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowLeft,
  Pin,
  Folder,
  Hash,
  Save,
  Trash2,
  GraduationCap,
  Check,
  Eye,
  Edit3,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Code,
  FileCode,
  Quote,
  Minus,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Badge, Icon } from '@design-system';
import api from '../api';
import './NoteEditor.css';

const NOTE_COLORS = [
  '#ffffff',
  '#f28b82',
  '#fbbc04',
  '#fff475',
  '#ccff90',
  '#a7ffeb',
  '#cbf0f8',
  '#aecbfa',
  '#d7aefb',
  '#fdcfe8',
];

const DEBOUNCE_DELAY = 1500;

// Inserts markdown syntax around the selected text in a textarea
const wrapSelection = (textarea, before, after = before) => {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.slice(start, end);
  const replacement = `${before}${selected || 'text'}${after}`;
  const newValue =
    textarea.value.slice(0, start) + replacement + textarea.value.slice(end);
  return {
    newValue,
    cursorStart: start + before.length,
    cursorEnd: start + before.length + (selected || 'text').length,
  };
};

// Inserts a line prefix (e.g. "- " or "1. ") at start of each selected line
const prefixLines = (textarea, prefix) => {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const before = textarea.value.slice(0, start);
  const selected = textarea.value.slice(start, end) || 'item';
  const after = textarea.value.slice(end);
  const lines = selected.split('\n').map((l) => `${prefix}${l}`);
  const replacement = lines.join('\n');
  return {
    newValue: before + replacement + after,
    cursorStart: start,
    cursorEnd: start + replacement.length,
  };
};

const NoteEditor = ({ note, onBack, onSave, onDelete, folders, subjects, isFullscreen = false, onToggleFullscreen }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [color, setColor] = useState('#ffffff');
  const [folderId, setFolderId] = useState(null);
  const [subjectId, setSubjectId] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [isDirty, setIsDirty] = useState(false);
  const [mode, setMode] = useState('write'); // 'write' | 'preview'
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const debounceTimerRef = useRef(null);
  const contentTextareaRef = useRef(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setTags(Array.isArray(note.tags) ? note.tags : []);
      setIsPinned(note.is_pinned || false);
      setColor(note.color || '#ffffff');
      setFolderId(note.folder_id || null);
      setSubjectId(note.subject_id || null);
    } else {
      setTitle('');
      setContent('');
      setTags([]);
      setIsPinned(false);
      setColor('#ffffff');
      setFolderId(null);
      setSubjectId(null);
    }
    setIsDirty(false);
    setSaveStatus('idle');
    setMode('write');
  }, [note]);

  useEffect(() => {
    const textarea = contentTextareaRef.current;
    if (textarea && mode === 'write') {
      const scrollContainer = textarea.closest('.note-editor-main');
      const savedScrollTop = scrollContainer ? scrollContainer.scrollTop : 0;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
      if (scrollContainer) scrollContainer.scrollTop = savedScrollTop;
    }
  }, [content, mode]);

  const buildNoteData = useCallback(
    () => ({
      id: note?.id,
      title,
      content,
      tags,
      is_pinned: isPinned,
      color,
      folder_id: folderId,
      subject_id: subjectId,
    }),
    [note, title, content, tags, isPinned, color, folderId, subjectId]
  );

  const performSave = useCallback(async () => {
    setSaveStatus('saving');
    try {
      await onSave(buildNoteData());
      setSaveStatus('saved');
      setIsDirty(false);
    } catch (err) {
      console.error('Auto-save failed:', err);
      setSaveStatus('unsaved');
    }
  }, [onSave, buildNoteData]);

  const scheduleAutoSave = useCallback(() => {
    setSaveStatus('unsaved');
    setIsDirty(true);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(performSave, DEBOUNCE_DELAY);
  }, [note?.id, performSave]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const markDirty = useCallback(() => {
    setIsDirty(true);
    scheduleAutoSave();
  }, [scheduleAutoSave]);

  const handleTitleChange = (e) => { setTitle(e.target.value); markDirty(); };
  const handleContentChange = (e) => { setContent(e.target.value); markDirty(); };
  const handlePinToggle = () => { setIsPinned((p) => !p); markDirty(); };
  const handleColorSelect = (c) => { setColor(c); markDirty(); };
  const handleFolderChange = (e) => {
    setFolderId(e.target.value === '' ? null : parseInt(e.target.value, 10));
    markDirty();
  };
  const handleSubjectChange = (e) => {
    setSubjectId(e.target.value === '' ? null : parseInt(e.target.value, 10));
    markDirty();
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const trimmed = tagInput.trim();
      if (!tags.includes(trimmed)) {
        setTags([...tags, trimmed]);
        markDirty();
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag) => {
    setTags((prev) => prev.filter((t) => t !== tag));
    markDirty();
  };

  const handleManualSave = async () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    await performSave();
    onBack(false);
  };

  const handleBack = async () => {
    if (isDirty) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      await performSave();
    }
    onBack(isDirty);
  };

  const handleDelete = () => {
    if (!note?.id) { onBack(false); return; }
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    setShowDeleteConfirm(false);
    onDelete(note.id);
  };

  // ── Formatting toolbar helpers ──────────────────────────────
  const applyFormat = useCallback((type) => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    let result;
    switch (type) {
      case 'bold':        result = wrapSelection(textarea, '**'); break;
      case 'italic':      result = wrapSelection(textarea, '*'); break;
      case 'h1':          result = prefixLines(textarea, '# '); break;
      case 'h2':          result = prefixLines(textarea, '## '); break;
      case 'ul':          result = prefixLines(textarea, '- '); break;
      case 'ol':          result = prefixLines(textarea, '1. '); break;
      case 'code':        result = wrapSelection(textarea, '`'); break;
      case 'codeblock':   result = wrapSelection(textarea, '\n```\n', '\n```\n'); break;
      case 'quote':       result = prefixLines(textarea, '> '); break;
      case 'hr':
        result = {
          newValue: textarea.value.slice(0, textarea.selectionStart) + '\n---\n' + textarea.value.slice(textarea.selectionEnd),
          cursorStart: textarea.selectionStart + 5,
          cursorEnd: textarea.selectionStart + 5,
        };
        break;
      default: return;
    }

    setContent(result.newValue);
    markDirty();
    // Restore focus + selection
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(result.cursorStart, result.cursorEnd);
    });
  }, [markDirty]);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  const renderSaveStatus = () => {
    if (saveStatus === 'saving')
      return <span className="note-editor-status note-editor-saving">Saving...</span>;
    if (saveStatus === 'saved')
      return <span className="note-editor-status note-editor-saved"><Check size={13} />Saved</span>;
    if (saveStatus === 'unsaved')
      return <span className="note-editor-status note-editor-unsaved">Unsaved changes</span>;
    return null;
  };

  return (
    <div className="note-editor">
      {/* Top bar */}
      <div className="note-editor-topbar">
        <button type="button" className="note-editor-back-btn" onClick={handleBack} aria-label="Back to notes">
          <ArrowLeft size={16} />
          Notes
        </button>

        {renderSaveStatus()}

        {/* Write / Preview tabs */}
        <div className="note-editor-mode-tabs">
          <button
            type="button"
            className={`note-editor-mode-btn${mode === 'write' ? ' active' : ''}`}
            onClick={() => setMode('write')}
          >
            <Edit3 size={13} />
            Write
          </button>
          <button
            type="button"
            className={`note-editor-mode-btn${mode === 'preview' ? ' active' : ''}`}
            onClick={() => setMode('preview')}
          >
            <Eye size={13} />
            Preview
          </button>
        </div>

        <div className="note-editor-actions">
          <button
            type="button"
            className={`note-editor-pin-btn${isPinned ? ' pinned' : ''}`}
            onClick={handlePinToggle}
            aria-label={isPinned ? 'Unpin note' : 'Pin note'}
            title={isPinned ? 'Unpin note' : 'Pin note'}
          >
            <Pin size={16} fill={isPinned ? 'currentColor' : 'none'} />
          </button>

          <button type="button" className="note-editor-save-btn" onClick={handleManualSave}>
            <Save size={15} />
            Save
          </button>

          {showDeleteConfirm ? (
            <div className="note-editor-delete-confirm">
              <span>Delete this note?</span>
              <button type="button" className="note-editor-confirm-cancel" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button type="button" className="note-editor-confirm-delete" onClick={confirmDelete}>Delete</button>
            </div>
          ) : (
            <button type="button" className="note-editor-delete-btn" onClick={handleDelete} title="Delete note">
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Formatting toolbar — only in write mode */}
      {mode === 'write' && (
        <div className="note-editor-toolbar">
          <button type="button" className="toolbar-btn" onClick={() => applyFormat('bold')} title="Bold (Ctrl+B)"><Bold size={14} /></button>
          <button type="button" className="toolbar-btn" onClick={() => applyFormat('italic')} title="Italic (Ctrl+I)"><Italic size={14} /></button>
          <div className="toolbar-divider" />
          <button type="button" className="toolbar-btn" onClick={() => applyFormat('h1')} title="Heading 1"><Heading1 size={14} /></button>
          <button type="button" className="toolbar-btn" onClick={() => applyFormat('h2')} title="Heading 2"><Heading2 size={14} /></button>
          <div className="toolbar-divider" />
          <button type="button" className="toolbar-btn" onClick={() => applyFormat('ul')} title="Bullet list"><List size={14} /></button>
          <button type="button" className="toolbar-btn" onClick={() => applyFormat('ol')} title="Numbered list"><ListOrdered size={14} /></button>
          <div className="toolbar-divider" />
          <button type="button" className="toolbar-btn" onClick={() => applyFormat('code')} title="Inline code"><Code size={14} /></button>
          <button type="button" className="toolbar-btn" onClick={() => applyFormat('codeblock')} title="Code block"><FileCode size={14} /></button>
          <button type="button" className="toolbar-btn" onClick={() => applyFormat('quote')} title="Blockquote"><Quote size={14} /></button>
          <button type="button" className="toolbar-btn" onClick={() => applyFormat('hr')} title="Horizontal rule"><Minus size={14} /></button>
        </div>
      )}

      {/* Body */}
      <div className="note-editor-body">
        <div className="note-editor-main">
          <div
            className="note-editor-color-bar"
            style={{ backgroundColor: color !== '#ffffff' ? color : 'transparent' }}
          />

          <input
            type="text"
            className="note-editor-title"
            placeholder="Untitled"
            value={title}
            onChange={handleTitleChange}
            aria-label="Note title"
          />

          {mode === 'write' ? (
            <textarea
              ref={contentTextareaRef}
              className="note-editor-content"
              placeholder="Start writing... (supports **markdown**)"
              value={content}
              onChange={handleContentChange}
              aria-label="Note content"
            />
          ) : (
            <div className="note-editor-preview">
              {content.trim() ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              ) : (
                <p className="note-editor-preview-empty">Nothing to preview yet.</p>
              )}
            </div>
          )}

          <div className="note-editor-word-count">
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </div>
        </div>

        {/* Metadata sidebar */}
        <aside className="note-editor-sidebar" aria-label="Note metadata">
          <div className="note-editor-meta-section">
            <div className="note-editor-meta-label"><Hash size={12} />Tags</div>
            <div className="note-editor-tags">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="indigo"
                  size="sm"
                  removable
                  onRemove={() => handleRemoveTag(tag)}
                >
                  #{tag}
                </Badge>
              ))}
            </div>
            <input
              type="text"
              className="note-editor-tag-input"
              placeholder="Add tag, press Enter"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
            />
          </div>

          <div className="note-editor-meta-section">
            <div className="note-editor-meta-label"><Folder size={12} />Folder</div>
            <select className="note-editor-select" value={folderId ?? ''} onChange={handleFolderChange}>
              <option value="">No Folder</option>
              {Array.isArray(folders) && folders.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div className="note-editor-meta-section">
            <div className="note-editor-meta-label"><GraduationCap size={12} />Subject</div>
            <select className="note-editor-select" value={subjectId ?? ''} onChange={handleSubjectChange}>
              <option value="">No Subject</option>
              {Array.isArray(subjects) && subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="note-editor-meta-section">
            <div className="note-editor-meta-label">Color</div>
            <div className="note-editor-colors">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`note-editor-color-btn${color === c ? ' active' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => handleColorSelect(c)}
                  title={c}
                />
              ))}
            </div>
          </div>

          <div className="note-editor-meta-section note-editor-cheatsheet">
            <div className="note-editor-meta-label">Markdown hints</div>
            <div className="cheatsheet-items">
              <code>**bold**</code>
              <code>*italic*</code>
              <code># H1</code>
              <code>## H2</code>
              <code>- list</code>
              <code>`code`</code>
              <code>{'> quote'}</code>
              <code>---</code>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default NoteEditor;
