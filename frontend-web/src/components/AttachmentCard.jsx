import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { Link as LinkIcon, FileText, ExternalLink, Youtube, Instagram, Play, Tag, CheckSquare, BookOpen, Trash2, StickyNote, FileSpreadsheet, Presentation, Cloud, Github, Twitter, MessageSquare, HardDrive, X, Maximize2, PenLine, Paperclip } from 'lucide-react';
import './AttachmentCard.css';

const AttachmentCard = ({ attachment, onDelete, onOpenUrl, onViewNote, onNavigateToSource, onAddNote, onRename }) => {
  // Helper function to extract YouTube ID
  const getYouTubeId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\s?]+)/);
    return match ? match[1] : null;
  };

  const getOfficeType = (url) => {
    if (!url) return null;
    if (/1drv\.ms\/w\//i.test(url) || /sharepoint\.com.*\.docx/i.test(url)) return 'word';
    if (/1drv\.ms\/x\//i.test(url) || /sharepoint\.com.*\.xlsx/i.test(url)) return 'excel';
    if (/1drv\.ms\/p\//i.test(url) || /sharepoint\.com.*\.pptx/i.test(url)) return 'powerpoint';
    if (url.includes('onedrive.live.com') || url.includes('1drv.ms') || url.includes('sharepoint.com')) return 'onedrive';
    if (url.includes('drive.google.com') || url.includes('docs.google.com')) return 'google-drive';
    if (url.includes('github.com')) return 'github';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
    if (url.includes('reddit.com')) return 'reddit';
    return null;
  };

  // Determine platform — check URL regardless of type so session/task-sourced YouTube links open in-player
  const youtubeId = getYouTubeId(attachment.url);
  const isYouTube = !!youtubeId;
  const isInstagram = !!attachment.url?.includes('instagram.com');
  const isNote = attachment.type === 'note';
  const officeType = attachment.type === 'url' ? getOfficeType(attachment.url) : null;

  const officeConfig = {
    word:        { label: 'W',  icon: <FileText size={32} />,       className: 'attachment-media--word' },
    excel:       { label: 'X',  icon: <FileSpreadsheet size={32} />, className: 'attachment-media--excel' },
    powerpoint:  { label: 'P',  icon: <Presentation size={32} />,   className: 'attachment-media--powerpoint' },
    onedrive:    { label: '',   icon: <Cloud size={32} />,           className: 'attachment-media--onedrive' },
    'google-drive': { label: '', icon: <HardDrive size={32} />,      className: 'attachment-media--gdrive' },
    github:      { label: '',   icon: <Github size={32} />,          className: 'attachment-media--github' },
    twitter:     { label: '',   icon: <Twitter size={32} />,         className: 'attachment-media--twitter' },
    reddit:      { label: '',   icon: <MessageSquare size={32} />,   className: 'attachment-media--reddit' },
  };

  const hasOfficeBanner = !!officeType && !!officeConfig[officeType];

  // Favicon for generic links
  const isGenericLink = attachment.type === 'url' && !isYouTube && !isInstagram && !hasOfficeBanner;
  const [faviconLoaded, setFaviconLoaded] = useState(false);
  const [faviconError, setFaviconError] = useState(false);
  const [thumbError, setThumbError] = useState(false);
  const [ytPlayer, setYtPlayer] = useState(false); // show inline player
  const iframeRef = useRef(null);

  const getFaviconUrl = (url) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=256`;
    } catch {
      return null;
    }
  };

  const faviconUrl = isGenericLink ? getFaviconUrl(attachment.url) : null;
  const showFaviconBanner = isGenericLink && faviconUrl && !faviconError;

  // Handle card click
  const handleCardClick = (e) => {
    e.stopPropagation();
    // Ignore clicks originating from action buttons inside the card
    if (e.target.closest('button')) return;
    if (isNote && onViewNote) {
      onViewNote(attachment.note_data);
    } else if (isYouTube && youtubeId) {
      setYtPlayer(true);
    } else if (attachment.url && onOpenUrl) {
      onOpenUrl(attachment.url);
    }
  };

  // Handle source badge click
  const handleSourceClick = (e) => {
    e.stopPropagation();
    if (canNavigateToSource) {
      onNavigateToSource(attachment.source, attachment.source_id);
    }
  };

  // hasMedia is true for generic links as long as we have a favicon URL (prevents layout jump if image errors after mount)
  const hasMedia = isYouTube || isInstagram || hasOfficeBanner || (isGenericLink && !!faviconUrl);
  const canRename = attachment.type === 'url' && typeof onRename === 'function';
  const canNavigateToSource =
    ['task', 'session'].includes(attachment.source) &&
    typeof onNavigateToSource === 'function';

  return (
    <div className={`attachment-card ${hasMedia ? 'attachment-card--media' : ''}`} onClick={handleCardClick}>
      {/* Delete button — top-right, visible on hover */}
      {onDelete && (
        <button
          className="attachment-delete-btn"
          onClick={(e) => { e.stopPropagation(); onDelete(attachment.id); }}
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      )}

      {/* Media — edge-to-edge at top */}
      {isYouTube && youtubeId && (
        <div className="attachment-media">
          {thumbError ? (
            <div className="attachment-media--youtube-fallback">
              <Youtube size={32} color="#fff" opacity={0.7} />
            </div>
          ) : (
            <img
              src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
              alt={attachment.title}
              onError={() => setThumbError(true)}
            />
          )}
          {!thumbError && (
            <div className="attachment-media-overlay">
              <div className="play-button"><Play size={24} fill="currentColor" /></div>
            </div>
          )}
        </div>
      )}
      {isInstagram && (
        <div className="attachment-media attachment-media--instagram">
          <Instagram size={28} />
        </div>
      )}
      {hasOfficeBanner && (
        <div className={`attachment-media ${officeConfig[officeType].className}`}>
          {officeConfig[officeType].icon}
        </div>
      )}
      {/* Favicon banner for generic links */}
      {isGenericLink && faviconUrl && !faviconError && (
        <div className={`attachment-media attachment-media--favicon ${faviconLoaded ? '' : 'attachment-media--favicon-loading'}`}>
          <img
            src={faviconUrl}
            alt=""
            className="attachment-favicon-img"
            onLoad={() => setFaviconLoaded(true)}
            onError={() => setFaviconError(true)}
          />
          {!faviconLoaded && <LinkIcon size={28} style={{ opacity: 0.3 }} />}
        </div>
      )}

      {/* Body */}
      <div className="attachment-card-body">
        {/* Icon — only for non-media cards */}
        {!hasMedia && (
          <div className="attachment-card-icon">
            {isNote
              ? <FileText size={20} style={{ color: '#FFA500' }} />
              : <LinkIcon size={20} style={{ color: '#06D6A0' }} />}
          </div>
        )}

        <h3 className="attachment-title">
          {attachment.title || attachment.note_data?.title || 'Untitled'}
        </h3>

        {/* URL — only for plain links */}
        {attachment.type === 'url' && !hasMedia && attachment.url && (
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
        {isNote && attachment.note_data?.tags?.length > 0 && (
          <div className="attachment-tags">
            {attachment.note_data.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="attachment-tag"><Tag size={12} />{tag}</span>
            ))}
            {attachment.note_data.tags.length > 3 && (
              <span className="attachment-tag-more">+{attachment.note_data.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="attachment-card-footer">
          <div className="attachment-badges">
            <span
              className={`attachment-badge source-badge ${attachment.source}`}
              onClick={canNavigateToSource ? handleSourceClick : undefined}
              title={canNavigateToSource ? `Go to ${attachment.source}` : attachment.source}
            >
              {attachment.source === 'task' && <><CheckSquare size={14} style={{marginRight: '4px'}} />Task</>}
              {attachment.source === 'session' && <><BookOpen size={14} style={{marginRight: '4px'}} />Session</>}
              {attachment.source === 'standalone' && <><Paperclip size={14} style={{marginRight: '4px'}} />File</>}
            </span>
          </div>
          {canRename && (
            <button
              className="attachment-open-btn"
              onClick={(e) => { e.stopPropagation(); onRename(attachment); }}
              title="Rename"
            >
              <PenLine size={16} />
            </button>
          )}
          {onAddNote && (
            <button
              className="attachment-open-btn"
              onClick={(e) => { e.stopPropagation(); onAddNote(attachment); }}
              title="Add note"
            >
              <StickyNote size={16} />
            </button>
          )}
          {attachment.type === 'url' && (
            <button
              className="attachment-open-btn"
              onClick={(e) => { e.stopPropagation(); if (onOpenUrl) onOpenUrl(attachment.url); }}
              title="Open in new tab"
            >
              <ExternalLink size={16} />
            </button>
          )}
        </div>
      </div>
      {/* Inline YouTube Player Modal — rendered via portal to escape Framer Motion stacking context */}
      {ytPlayer && youtubeId && ReactDOM.createPortal(
        <div className="ac-yt-overlay" onClick={(e) => { e.stopPropagation(); setYtPlayer(false); }}>
          <div className="ac-yt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ac-yt-header">
              <span className="ac-yt-title">{attachment.title}</span>
              <div className="ac-yt-actions">
                <button
                  onClick={(e) => { e.stopPropagation(); iframeRef.current?.requestFullscreen(); }}
                  title="Fullscreen"
                >
                  <Maximize2 size={16} />
                </button>
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open on YouTube"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink size={16} />
                </a>
                <button onClick={(e) => { e.stopPropagation(); setYtPlayer(false); }} title="Close">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="ac-yt-embed">
              <iframe
                ref={iframeRef}
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                title={attachment.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

AttachmentCard.propTypes = {
  attachment: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['url', 'note']).isRequired,
    source: PropTypes.oneOf(['task', 'session', 'standalone']).isRequired,
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
  onNavigateToSource: PropTypes.func,
  onAddNote: PropTypes.func,
  onRename: PropTypes.func
};

export default AttachmentCard;
