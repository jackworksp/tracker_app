import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Paperclip, Search, X, ChevronDown } from 'lucide-react';
import { message } from 'antd';
import AttachmentCard from './AttachmentCard';
import BidirectionalSwipeCard from './BidirectionalSwipeCard';
import api from '../api';
import './AttachmentsHub.css';

const AttachmentsHub = ({ subjectId }) => {
  const [attachments, setAttachments] = useState([]);
  const [filteredAttachments, setFilteredAttachments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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

  // Load attachments when filters or pagination changes
  useEffect(() => {
    loadAttachments();
  }, [filters, pagination.page]);

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
    // Navigate to notes page with the note selected
    // This could be enhanced to open a modal or navigate directly
    message.info(`Viewing note: ${noteData.title}`);
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

  const hasActiveFilters = filters.type || filters.source || (filters.subject_id && !subjectId);

  if (loading && attachments.length === 0) {
    return (
      <div className="attachments-hub">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading attachments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="attachments-hub">
      {/* Sticky Header */}
      <div className="attachments-header">
        <div className="attachments-header-top">
          <h1 className="attachments-title">
            <Paperclip size={28} color="#06D6A0" />
            Attachments
          </h1>
          <span className="attachments-count">
            {pagination.total} {pagination.total === 1 ? 'attachment' : 'attachments'}
          </span>
        </div>

        {/* Search Bar */}
        <div className="attachments-search-container">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            className="attachments-search-input"
            placeholder="Search attachments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="search-clear-btn"
              onClick={() => setSearchTerm('')}
              aria-label="Clear search"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="attachments-filters">
          <div className="filter-group">
            <label htmlFor="type-filter" className="filter-label">Type</label>
            <div className="select-wrapper">
              <select
                id="type-filter"
                className="filter-select"
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <option value="">All Types</option>
                <option value="url">URLs</option>
                <option value="note">Notes</option>
              </select>
              <ChevronDown size={16} className="select-icon" />
            </div>
          </div>

          <div className="filter-group">
            <label htmlFor="source-filter" className="filter-label">Source</label>
            <div className="select-wrapper">
              <select
                id="source-filter"
                className="filter-select"
                value={filters.source}
                onChange={(e) => handleFilterChange('source', e.target.value)}
              >
                <option value="">All Sources</option>
                <option value="task">Tasks</option>
                <option value="session">Sessions</option>
              </select>
              <ChevronDown size={16} className="select-icon" />
            </div>
          </div>

          {!subjectId && (
            <div className="filter-group">
              <label htmlFor="subject-filter" className="filter-label">Subject</label>
              <div className="select-wrapper">
                <select
                  id="subject-filter"
                  className="filter-select"
                  value={filters.subject_id}
                  onChange={(e) => handleFilterChange('subject_id', e.target.value)}
                >
                  <option value="">All Subjects</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="select-icon" />
              </div>
            </div>
          )}

          {hasActiveFilters && (
            <button className="clear-filters-btn" onClick={handleClearFilters}>
              <X size={14} />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="attachments-content">
        {filteredAttachments.length === 0 ? (
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
      </div>
    </div>
  );
};

AttachmentsHub.propTypes = {
  subjectId: PropTypes.number
};

export default AttachmentsHub;
