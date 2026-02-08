import React from 'react';
import PropTypes from 'prop-types';
import { Link as LinkIcon, FileText, ExternalLink, Youtube, Instagram, Play, Tag, CheckSquare, BookOpen } from 'lucide-react';
import './AttachmentCard.css';

const AttachmentCard = ({ attachment, onDelete, onOpenUrl, onViewNote, onNavigateToSource }) => {
  // Helper function to extract YouTube ID
  const getYouTubeId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? match[1] : null;
  };

  // Determine platform
  const isYouTube = attachment.type === 'url' && !!getYouTubeId(attachment.url);
  const youtubeId = getYouTubeId(attachment.url);
  const isInstagram = attachment.type === 'url' && attachment.url?.includes('instagram.com');
  const isNote = attachment.type === 'note';

  // Handle card click
  const handleCardClick = (e) => {
    e.stopPropagation();
    if (isNote && onViewNote) {
      onViewNote(attachment.note_data);
    } else if (attachment.url && onOpenUrl) {
      onOpenUrl(attachment.url);
    }
  };

  // Handle source badge click
  const handleSourceClick = (e) => {
    e.stopPropagation();
    if (onNavigateToSource) {
      onNavigateToSource(attachment.source, attachment.source_id);
    }
  };

  return (
    <div className="attachment-card" onClick={handleCardClick}>
      {/* Header with icon */}
      <div className="attachment-card-header">
        {isNote ? (
          <FileText size={20} className="attachment-icon" style={{ color: '#FFA500' }} />
        ) : isYouTube ? (
          <Youtube size={20} className="attachment-icon" style={{ color: '#FF0000' }} />
        ) : isInstagram ? (
          <Instagram size={20} className="attachment-icon" style={{ color: '#E4405F' }} />
        ) : (
          <LinkIcon size={20} className="attachment-icon" style={{ color: '#06D6A0' }} />
        )}
      </div>

      {/* Content */}
      <div className="attachment-card-content">
        {/* YouTube Thumbnail */}
        {isYouTube && youtubeId && (
          <div className="attachment-thumbnail">
            <img
              src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
              alt={attachment.title}
            />
            <div className="thumbnail-overlay">
              <div className="play-button">
                <Play size={24} fill="currentColor" />
              </div>
            </div>
          </div>
        )}

        {/* Title */}
        <h3 className="attachment-title">
          {attachment.title || attachment.note_data?.title || 'Untitled'}
        </h3>

        {/* URL Preview for non-YouTube links */}
        {attachment.type === 'url' && !isYouTube && attachment.url && (
          <p className="attachment-url">
            {attachment.url.replace(/^https?:\/\//, '').substring(0, 50)}
            {attachment.url.length > 50 ? '...' : ''}
          </p>
        )}

        {/* Note Preview */}
        {isNote && attachment.note_data?.content && (
          <p className="attachment-note-preview">
            {attachment.note_data.content.substring(0, 120)}
            {attachment.note_data.content.length > 120 ? '...' : ''}
          </p>
        )}

        {/* Note Tags */}
        {isNote && attachment.note_data?.tags && attachment.note_data.tags.length > 0 && (
          <div className="attachment-tags">
            {attachment.note_data.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="attachment-tag">
                <Tag size={12} />
                {tag}
              </span>
            ))}
            {attachment.note_data.tags.length > 3 && (
              <span className="attachment-tag-more">
                +{attachment.note_data.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer with badges */}
      <div className="attachment-card-footer">
        <div className="attachment-badges">
          {/* Platform Badge */}
          {isYouTube && (
            <span className="attachment-badge platform-badge youtube">
              <Youtube size={12} />
              YouTube
            </span>
          )}
          {isInstagram && (
            <span className="attachment-badge platform-badge instagram">
              <Instagram size={12} />
              Instagram
            </span>
          )}

          {/* Source Badge */}
          <span
            className={`attachment-badge source-badge ${attachment.source}`}
            onClick={handleSourceClick}
            title={`Go to ${attachment.source}`}
          >
            {attachment.source === 'task' ? <><CheckSquare size={14} style={{marginRight: '4px', display: 'inline-block', verticalAlign: 'middle'}} /> Task</> : <><BookOpen size={14} style={{marginRight: '4px', display: 'inline-block', verticalAlign: 'middle'}} /> Session</>}
          </span>

          {/* Subject Badge */}
          {attachment.subject_name && attachment.subject_name !== 'No Subject' && (
            <span className="attachment-badge subject-badge">
              {attachment.subject_name}
            </span>
          )}
        </div>

        {/* Open Link Button */}
        {attachment.type === 'url' && (
          <button
            className="attachment-open-btn"
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenUrl) onOpenUrl(attachment.url);
            }}
            title="Open in new tab"
          >
            <ExternalLink size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

AttachmentCard.propTypes = {
  attachment: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['url', 'note']).isRequired,
    source: PropTypes.oneOf(['task', 'session']).isRequired,
    source_id: PropTypes.number,
    title: PropTypes.string,
    url: PropTypes.string,
    note_data: PropTypes.shape({
      id: PropTypes.number,
      title: PropTypes.string,
      content: PropTypes.string,
      tags: PropTypes.arrayOf(PropTypes.string)
    }),
    subject_id: PropTypes.number,
    subject_name: PropTypes.string,
    created_at: PropTypes.string,
    metadata: PropTypes.object
  }).isRequired,
  onDelete: PropTypes.func,
  onOpenUrl: PropTypes.func,
  onViewNote: PropTypes.func,
  onNavigateToSource: PropTypes.func
};

export default AttachmentCard;
