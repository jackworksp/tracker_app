import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Paperclip, X, StickyNote, LayoutGrid, List, Plus, FileText, Youtube, Instagram, Link, FileSpreadsheet, FileText as FileWord, Presentation, Cloud, Github, Twitter, MessageSquare, HardDrive, Clock } from 'lucide-react';
import { message } from 'antd';
import AttachmentCard from './AttachmentCard';
import YouTubeCard from './YouTubeCard';
import BidirectionalSwipeCard from './BidirectionalSwipeCard';
import AddFileLinkModal from './AddFileLinkModal';
import SaveToLaterModal from './SaveToLaterModal';
import QueueCard from './QueueCard';
import api from '../api';
import { logSessionForTask } from '../utils/taskUtils';
import { openUrl } from '../utils/linkUtils';
import './AttachmentsHub.css';

const AttachmentsHub = ({ subjectId }) => {
  const viewModeStorageKey = 'attachmentsViewMode';
  const [attachments, setAttachments] = useState([]);
  const [filteredAttachments, setFilteredAttachments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddLinkModalOpen, setIsAddLinkModalOpen] = useState(false);
  const [noteModal, setNoteModal] = useState(null); // { attachment } or null
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [renameModal, setRenameModal] = useState(null); // { attachment } or null
  const [renameTitle, setRenameTitle] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [platformFilter, setPlatformFilter] = useState('all');
  const [filters, setFilters] = useState({
    type: '',
    source: '',
    subject_id: subjectId || ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  // Later tab state
  const [view, setView] = useState('attachments'); // 'attachments' | 'later'
  const [laterItems, setLaterItems] = useState([]);
  const [laterFilter, setLaterFilter] = useState('pending'); // 'pending' | 'done' | 'watch' | 'read'
  const [laterLoading, setLaterLoading] = useState(false);
  const [isSaveToLaterOpen, setIsSaveToLaterOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list' | 'youtube'

  // Load subjects for filter dropdown
  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    try {
      const savedMode = localStorage.getItem(viewModeStorageKey);
      if (savedMode === 'list' || savedMode === 'grid' || savedMode === 'youtube') {
        setViewMode(savedMode);
      }
    } catch (error) {
      console.error('Failed to read view mode from localStorage:', error);
    }
  }, []);

  // Update subject filter when subjectId prop changes
  useEffect(() => {
    if (subjectId) {
      setFilters(prev => ({ ...prev, subject_id: subjectId }));
    }
  }, [subjectId]);

  useEffect(() => {
    loadAttachments();
  }, [filters, pagination.page]);

  // Apply client-side search + platform filter
  useEffect(() => {
    let filtered = attachments;

    if (platformFilter !== 'all') {
      filtered = filtered.filter(att => getPlatform(att) === platformFilter);
    }

    if (searchTerm.trim()) {
      const lowerTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(att => {
        const titleMatch = att.title?.toLowerCase().includes(lowerTerm);
        const urlMatch = att.url?.toLowerCase().includes(lowerTerm);
        const noteTitleMatch = att.note_data?.title?.toLowerCase().includes(lowerTerm);
        const noteContentMatch = att.note_data?.content?.toLowerCase().includes(lowerTerm);
        return titleMatch || urlMatch || noteTitleMatch || noteContentMatch;
      });
    }

    setFilteredAttachments(filtered);
  }, [searchTerm, platformFilter, attachments]);

  const getPlatform = (attachment) => {
    if (attachment.type === 'note') return 'note';
    const url = attachment.url || '';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('drive.google.com') || url.includes('docs.google.com')) return 'google-drive';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
    if (url.includes('github.com')) return 'github';
    if (url.includes('reddit.com')) return 'reddit';
    if (/1drv\.ms\/w\//i.test(url) || /sharepoint\.com.*\.docx/i.test(url)) return 'word';
    if (/1drv\.ms\/x\//i.test(url) || /sharepoint\.com.*\.xlsx/i.test(url)) return 'excel';
    if (/1drv\.ms\/p\//i.test(url) || /sharepoint\.com.*\.pptx/i.test(url)) return 'powerpoint';
    if (url.includes('onedrive.live.com') || url.includes('1drv.ms') || url.includes('sharepoint.com')) return 'onedrive';
    return 'link';
  };

  const loadLaterItems = useCallback(async () => {
    try {
      setLaterLoading(true);
      const response = await api.tasks.getLater(subjectId ? { subject_id: subjectId } : {});
      setLaterItems(response.data || []);
    } catch (err) {
      console.error('Failed to load later items:', err);
    } finally {
      setLaterLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    if (view === 'later') loadLaterItems();
  }, [view, loadLaterItems]);

  const handleLaterMarkDone = async (task) => {
    try {
      await api.tasks.update(task.id, { completed: true });
      logSessionForTask(task, subjectId || null).catch(err =>
        console.error('Session log failed:', err)
      );
      message.success('Marked as done');
      loadLaterItems();
    } catch (err) {
      console.error('Failed to mark done:', err);
      message.error('Failed to mark as done');
    }
  };

  const handleLaterDelete = async (taskId) => {
    try {
      await api.tasks.delete(taskId);
      message.success('Removed');
      loadLaterItems();
    } catch (err) {
      console.error('Failed to delete later item:', err);
      message.error('Failed to remove');
    }
  };

  const loadSubjects = async () => {
    try {
      const data = await api.subjects.getAll();
      setSubjects(data || []);
    } catch (error) {
      console.error('Failed to load subjects:', error);
    }
  };

  const loadAttachments = async () => {
    try {
      setLoading(true);
      const filterParams = {};

      if (filters.subject_id) filterParams.subject_id = filters.subject_id;
      if (filters.type) filterParams.type = filters.type;
      if (filters.source) filterParams.source = filters.source;

      const response = await api.attachments.getAll(
        filterParams,
        pagination.page,
        pagination.limit
      );

      setAttachments(response.data || []);
      setFilteredAttachments(response.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.pagination.total,
        totalPages: response.pagination.totalPages
      }));
    } catch (error) {
      console.error('Failed to load attachments:', error);
      message.error('Failed to load attachments');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (attachmentId) => {
    if (!window.confirm('Delete this attachment?')) return;

    try {
      await api.attachments.delete(attachmentId);
      message.success('Attachment deleted');
      loadAttachments();
    } catch (error) {
      console.error('Failed to delete attachment:', error);
      message.error('Failed to delete attachment');
    }
  };

  const handleOpenUrl = (url) => {
    openUrl(url);
  };

  const handleViewNote = (noteData) => {
    message.info('Open the Notes tab to view this note');
  };

  const handleNavigateToSource = (source, sourceId) => {
    // Navigate to the source (Tasks or Timeline/Sessions)
    // This would need integration with parent App component
    message.info(`Navigate to ${source} with ID: ${sourceId}`);
  };

  const handleFilterChange = (filterKey, value) => {
    setFilters(prev => ({ ...prev, [filterKey]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 on filter change
  };

  const handleClearFilters = () => {
    setFilters({
      type: '',
      source: '',
      subject_id: subjectId || ''
    });
    setSearchTerm('');
  };
  
  const handleLinkAdded = () => {
      loadAttachments();
  };

  const handleOpenAddNote = (attachment) => {
    const defaultTitle = attachment.title || attachment.note_data?.title || 'Untitled';
    setNoteTitle(`Notes on: ${defaultTitle}`);
    setNoteContent('');
    setNoteModal({ attachment });
  };

  const canRenameAttachment = (attachment) =>
    attachment.type === 'url' &&
    ['standalone', 'task', 'session'].includes(attachment.source);

  const handleOpenRename = (attachment) => {
    if (!canRenameAttachment(attachment)) return;
    setRenameTitle(attachment.title || '');
    setRenameModal({ attachment });
  };

  const handleRenameAttachment = async () => {
    const title = renameTitle.trim();
    if (!title) {
      message.error('Title is required');
      return;
    }
    if (title.length > 500) {
      message.error('Title must be 500 characters or fewer');
      return;
    }

    try {
      setIsRenaming(true);
      await api.attachments.rename(renameModal.attachment.id, title);
      message.success('Attachment renamed');
      setRenameModal(null);
      setRenameTitle('');
      loadAttachments();
    } catch (error) {
      console.error('Failed to rename attachment:', error);
      message.error('Failed to rename attachment');
    } finally {
      setIsRenaming(false);
    }
  };

  const handleViewModeToggle = () => {
    const nextMode = viewMode === 'grid' ? 'list' : viewMode === 'list' ? 'youtube' : 'grid';
    setViewMode(nextMode);
    try {
      localStorage.setItem(viewModeStorageKey, nextMode);
    } catch (error) {
      console.error('Failed to save view mode to localStorage:', error);
    }
  };

  const handleSaveNote = async () => {
    if (!noteTitle.trim()) {
      message.error('Please enter a title');
      return;
    }
    try {
      setIsSavingNote(true);
      await api.notes.create({
        title: noteTitle.trim(),
        content: noteContent.trim(),
        subject_id: noteModal.attachment.subject_id || subjectId || null,
        tags: []
      });
      message.success('Note saved');
      setNoteModal(null);
    } catch (error) {
      console.error('Failed to save note:', error);
      message.error('Failed to save note');
    } finally {
      setIsSavingNote(false);
    }
  };

  const hasActiveFilters = filters.type || filters.source || (filters.subject_id && !subjectId);

  const pendingLater = laterItems.filter(t => !t.completed);
  const doneLater = laterItems.filter(t => t.completed);

  const displayedLaterItems = (() => {
    if (laterFilter === 'done') return doneLater;
    if (laterFilter === 'watch') return pendingLater.filter(t => t.type === 'WATCH');
    if (laterFilter === 'read') return pendingLater.filter(t => t.type === 'READ');
    return pendingLater;
  })();

  return (
    <div className="attachments-hub">
      {/* Sticky Header */}
      <div className="attachments-header">
        <div className="attachments-header-top">
          <h1 className="attachments-title">
            <Paperclip size={28} color="#06D6A0" />
            Attachments
          </h1>

          {/* View tabs */}
          <div style={{ display: 'flex', gap: '4px', margin: '0 12px' }}>
            {[{ key: 'attachments', label: 'All' }, { key: 'later', label: 'Later' }].map(tab => (
              <button
                key={tab.key}
                onClick={() => setView(tab.key)}
                style={{
                  padding: '5px 14px',
                  borderRadius: '6px',
                  border: `1px solid ${view === tab.key ? '#06D6A0' : 'rgba(255,255,255,0.1)'}`,
                  background: view === tab.key ? 'rgba(6,214,160,0.12)' : 'transparent',
                  color: view === tab.key ? '#06D6A0' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}
              >
                {tab.key === 'later' && <Clock size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />}
                {tab.label}
                {tab.key === 'later' && pendingLater.length > 0 && (
                  <span style={{ marginLeft: 5, background: 'rgba(6,214,160,0.2)', color: '#06D6A0', borderRadius: '10px', padding: '1px 6px', fontSize: '0.75rem' }}>
                    {pendingLater.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
            {view === 'attachments' && (
              <button
                className="attachments-view-toggle"
                onClick={handleViewModeToggle}
                title={viewMode === 'grid' ? 'Switch to list view' : viewMode === 'list' ? 'Switch to YouTube view' : 'Switch to grid view'}
              >
                {viewMode === 'grid' ? <List size={16} /> : viewMode === 'list' ? <Youtube size={16} /> : <LayoutGrid size={16} />}
              </button>
            )}
            {view === 'later' ? (
              <button
                onClick={() => setIsSaveToLaterOpen(true)}
                style={{
                  background: '#06D6A0',
                  color: '#0f1219',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={16} /> Save Link
              </button>
            ) : (
              <button
                className="add-link-btn"
                onClick={() => setIsAddLinkModalOpen(true)}
                style={{
                  background: '#06D6A0',
                  color: '#0f1219',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={16} /> Add Link
              </button>
            )}
            {view === 'attachments' && (
              <span className="attachments-count">
                {pagination.total} {pagination.total === 1 ? 'attachment' : 'attachments'}
              </span>
            )}
          </div>
        </div>

        {/* Platform Filter Pills — shown only in attachments view */}
        {view === 'later' ? (
          <div className="attachment-filter-pills">
            {[
              { key: 'pending', label: `Pending (${pendingLater.length})` },
              { key: 'watch', label: `Watch (${pendingLater.filter(t => t.type === 'WATCH').length})` },
              { key: 'read', label: `Read (${pendingLater.filter(t => t.type === 'READ').length})` },
              { key: 'done', label: `Done (${doneLater.length})` },
            ].map(f => (
              <button
                key={f.key}
                className={`filter-pill ${laterFilter === f.key ? 'filter-pill--active' : ''}`}
                onClick={() => setLaterFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        ) : null}

        {/* Platform Filter Pills — attachments view only */}
        {view === 'attachments' && (() => {
          const platformCounts = attachments.reduce((acc, att) => {
            const p = getPlatform(att);
            acc[p] = (acc[p] || 0) + 1;
            return acc;
          }, {});

          const pills = [
            { key: 'all', label: 'All', icon: null },
            { key: 'youtube', label: 'YouTube', icon: <Youtube size={13} /> },
            { key: 'instagram', label: 'Instagram', icon: <Instagram size={13} /> },
            { key: 'google-drive', label: 'Google Drive', icon: <HardDrive size={13} /> },
            { key: 'note', label: 'Notes', icon: <StickyNote size={13} /> },
            { key: 'word', label: 'Word', icon: <FileWord size={13} /> },
            { key: 'excel', label: 'Excel', icon: <FileSpreadsheet size={13} /> },
            { key: 'powerpoint', label: 'PowerPoint', icon: <Presentation size={13} /> },
            { key: 'onedrive', label: 'OneDrive', icon: <Cloud size={13} /> },
            { key: 'twitter', label: 'Twitter/X', icon: <Twitter size={13} /> },
            { key: 'github', label: 'GitHub', icon: <Github size={13} /> },
            { key: 'reddit', label: 'Reddit', icon: <MessageSquare size={13} /> },
            { key: 'link', label: 'Links', icon: <Link size={13} /> },
          ].filter(p => p.key === 'all' || platformCounts[p.key]);

          return (
            <div className="attachment-filter-pills">
              {pills.map(pill => (
                <button
                  key={pill.key}
                  className={`filter-pill ${platformFilter === pill.key ? 'filter-pill--active' : ''}`}
                  onClick={() => setPlatformFilter(pill.key)}
                >
                  {pill.icon}
                  {pill.label}
                  {pill.key !== 'all' && platformCounts[pill.key] && (
                    <span className="filter-pill-count">{platformCounts[pill.key]}</span>
                  )}
                </button>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Content Area */}
      <div className="attachments-content">
        {view === 'later' && (
          <>
            {laterLoading ? (
              <div className="loading-container"><div className="loading-spinner"></div><p>Loading...</p></div>
            ) : displayedLaterItems.length === 0 ? (
              <div className="empty-attachments-state">
                <Clock size={48} color="rgba(255,255,255,0.2)" />
                <p className="empty-state-title">
                  {laterFilter === 'done' ? 'Nothing done yet' : 'Your Later list is empty'}
                </p>
                <p className="empty-state-subtitle">
                  {laterFilter === 'done' ? 'Mark items as done to see them here' : 'Save links to watch or read later'}
                </p>
              </div>
            ) : (
              <div style={{ padding: '0 4px' }}>
                {displayedLaterItems.map(task => (
                  <QueueCard
                    key={task.id}
                    task={task}
                    onMarkDone={handleLaterMarkDone}
                    onDelete={handleLaterDelete}
                  />
                ))}
              </div>
            )}
          </>
        )}
        {view === 'attachments' &&
        <>
                {loading && attachments.length === 0 ? (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Loading attachments...</p>
                    </div>
                ) : filteredAttachments.length === 0 ? (
                <div className="empty-attachments-state">
                    <Paperclip size={48} color="rgba(255, 255, 255, 0.3)" />
                    <p className="empty-state-title">No attachments found</p>
                    <p className="empty-state-subtitle">
                    {searchTerm
                        ? `No attachments matching "${searchTerm}"`
                        : hasActiveFilters
                        ? 'Try adjusting your filters'
                        : 'Attachments from your tasks and sessions will appear here'}
                    </p>
                </div>
                ) : (
                <div className={
                  viewMode === 'youtube' ? 'attachments-youtube-grid' :
                  viewMode === 'grid' ? 'attachments-masonry-grid' : 'attachments-list'
                }>
                    {filteredAttachments.map(attachment => (
                      viewMode === 'youtube' ? (
                        <YouTubeCard
                          key={attachment.id}
                          attachment={attachment}
                          onDelete={handleDelete}
                          onOpenUrl={handleOpenUrl}
                        />
                      ) : (
                      <BidirectionalSwipeCard
                          key={attachment.id}
                          onSwipeRight={() => handleDelete(attachment.id)}
                      >
                          <AttachmentCard
                          attachment={attachment}
                          onDelete={handleDelete}
                          onOpenUrl={handleOpenUrl}
                          onViewNote={handleViewNote}
                          onNavigateToSource={handleNavigateToSource}
                          onAddNote={handleOpenAddNote}
                          onRename={canRenameAttachment(attachment) ? handleOpenRename : undefined}
                          />
                      </BidirectionalSwipeCard>
                      )
                    ))}
                </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                <div className="attachments-pagination">
                    <button
                    className="pagination-btn"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    >
                    Previous
                    </button>
                    <span className="pagination-info">
                    Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                    className="pagination-btn"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page >= pagination.totalPages}
                    >
                    Next
                    </button>
                </div>
                )}
        </>}
      </div>

      <SaveToLaterModal
        isOpen={isSaveToLaterOpen}
        onClose={() => setIsSaveToLaterOpen(false)}
        onSaved={loadLaterItems}
        subjectId={subjectId}
      />
      <AddFileLinkModal
        isOpen={isAddLinkModalOpen}
        onClose={() => setIsAddLinkModalOpen(false)}
        onLinkAdded={handleLinkAdded}
        subjectId={subjectId}
      />

      {/* Add Note Modal */}
      {noteModal && (
        <div className="note-modal-backdrop" onClick={() => setNoteModal(null)}>
          <div className="note-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="note-modal-header">
              <FileText size={18} color="#06D6A0" />
              <h3>Add Note</h3>
              <button className="note-modal-close" onClick={() => setNoteModal(null)}><X size={18} /></button>
            </div>
            <div className="note-modal-body">
              <input
                className="note-modal-title-input"
                type="text"
                placeholder="Note title"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                autoFocus
              />
              <textarea
                className="note-modal-content-input"
                placeholder="Write your notes here..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={6}
              />
            </div>
            <div className="note-modal-footer">
              <button className="note-modal-btn-cancel" onClick={() => setNoteModal(null)}>Cancel</button>
              <button className="note-modal-btn-save" onClick={handleSaveNote} disabled={isSavingNote}>
                {isSavingNote ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}

      {renameModal && (
        <div className="note-modal-backdrop" onClick={() => !isRenaming && setRenameModal(null)}>
          <div className="note-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="note-modal-header">
              <FileText size={18} color="#06D6A0" />
              <h3>Rename Attachment</h3>
              <button className="note-modal-close" onClick={() => !isRenaming && setRenameModal(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="note-modal-body">
              <input
                className="note-modal-title-input"
                type="text"
                placeholder="Attachment title"
                value={renameTitle}
                onChange={(e) => setRenameTitle(e.target.value)}
                maxLength={500}
                autoFocus
              />
            </div>
            <div className="note-modal-footer">
              <button
                className="note-modal-btn-cancel"
                onClick={() => setRenameModal(null)}
                disabled={isRenaming}
              >
                Cancel
              </button>
              <button
                className="note-modal-btn-save"
                onClick={handleRenameAttachment}
                disabled={isRenaming}
              >
                {isRenaming ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

AttachmentsHub.propTypes = {
  subjectId: PropTypes.number
};

export default AttachmentsHub;
