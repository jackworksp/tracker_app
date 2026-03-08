import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Paperclip, X, StickyNote, LayoutGrid, Plus, FileText, Youtube, Instagram, Link, FileSpreadsheet, FileText as FileWord, Presentation, Cloud, Github, Twitter, MessageSquare, HardDrive } from 'lucide-react';
import { message } from 'antd';
import AttachmentCard from './AttachmentCard';
import BidirectionalSwipeCard from './BidirectionalSwipeCard';
import NotesPage from './NotesPage';
import AddFileLinkModal from './AddFileLinkModal';
import api from '../api';
import { openUrl } from '../utils/linkUtils';
import './AttachmentsHub.css';

const AttachmentsHub = ({ subjectId }) => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'notes'
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

  // Load subjects for filter dropdown
  useEffect(() => {
    loadSubjects();
  }, []);

  // Update subject filter when subjectId prop changes
  useEffect(() => {
    if (subjectId) {
      setFilters(prev => ({ ...prev, subject_id: subjectId }));
    }
  }, [subjectId]);

  // Load attachments when filters or pagination changes (ONLY if activeTab is overview)
  useEffect(() => {
    if (activeTab === 'overview') {
        loadAttachments();
    }
  }, [filters, pagination.page, activeTab]);

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
    // Switch to notes tab
    setActiveTab('notes');
    // Ideally we would also select the specific note, but for now just switching tabs is a start
    message.info(`Switched to Notes tab`);
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

  return (
    <div className="attachments-hub">
      {/* Sticky Header */}
      <div className="attachments-header">
        <div className="attachments-header-top">
          <h1 className="attachments-title">
            <Paperclip size={28} color="#06D6A0" />
            Attachments
          </h1>
          
          {/* Tab Switcher */}
          <div className="attachments-tab-switcher">
            <button 
                onClick={() => setActiveTab('overview')}
                className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            >
                <LayoutGrid size={16} /> Overview
            </button>
            <button 
                onClick={() => setActiveTab('notes')}
                className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
            >
                <StickyNote size={16} /> Notes
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
            {activeTab === 'overview' && (
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
            
            <span className="attachments-count">
                {activeTab === 'overview' && (
                    <>{pagination.total} {pagination.total === 1 ? 'attachment' : 'attachments'}</>
                )}
            </span>
          </div>
        </div>

        {/* Platform Filter Pills — overview only */}
        {activeTab === 'overview' && (() => {
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
        {activeTab === 'overview' ? (
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
                <div className="attachments-masonry-grid">
                    {filteredAttachments.map(attachment => (
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
                        />
                    </BidirectionalSwipeCard>
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
            </>
        ) : (
            // EMBEDDED NOTES PAGE
            <div style={{ height: 'calc(100vh - 200px)', overflow: 'hidden' }}>
                <NotesPage subjectId={subjectId} />
            </div>
        )}
      </div>
      
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
    </div>
  );
};

AttachmentsHub.propTypes = {
  subjectId: PropTypes.number
};

export default AttachmentsHub;
