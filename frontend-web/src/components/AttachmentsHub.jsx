import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Paperclip, X, StickyNote, LayoutGrid, Plus } from 'lucide-react';
import { message } from 'antd';
import AttachmentCard from './AttachmentCard';
import BidirectionalSwipeCard from './BidirectionalSwipeCard';
import NotesPage from './NotesPage';
import AddFileLinkModal from './AddFileLinkModal';
import api from '../api';
import './AttachmentsHub.css';

const AttachmentsHub = ({ subjectId }) => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'notes'
  const [attachments, setAttachments] = useState([]);
  const [filteredAttachments, setFilteredAttachments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddLinkModalOpen, setIsAddLinkModalOpen] = useState(false);
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

  // Apply client-side search (for responsive filtering)
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredAttachments(attachments);
    } else {
      const lowerTerm = searchTerm.toLowerCase();
      const filtered = attachments.filter(att => {
        const titleMatch = att.title?.toLowerCase().includes(lowerTerm);
        const urlMatch = att.url?.toLowerCase().includes(lowerTerm);
        const noteTitleMatch = att.note_data?.title?.toLowerCase().includes(lowerTerm);
        const noteContentMatch = att.note_data?.content?.toLowerCase().includes(lowerTerm);

        return titleMatch || urlMatch || noteTitleMatch || noteContentMatch;
      });
      setFilteredAttachments(filtered);
    }
  }, [searchTerm, attachments]);

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
    window.open(url, '_blank', 'noopener,noreferrer');
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
    </div>
  );
};

AttachmentsHub.propTypes = {
  subjectId: PropTypes.number
};

export default AttachmentsHub;
