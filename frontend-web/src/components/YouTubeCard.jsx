import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import './YouTubeCard.css';

const getYouTubeId = (url) => {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\s?]+)/);
  return match ? match[1] : null;
};

const formatRelativeDate = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
};

const SOURCE_LABELS = {
  session: 'Session',
  task: 'Task',
  standalone: 'File',
  youtube_feed: 'YouTube',
  rss_feed: 'RSS',
};

export default function YouTubeCard({ attachment, onDelete, onOpenUrl }) {
  const [hovered, setHovered] = useState(false);
  const youtubeId = getYouTubeId(attachment.url);

  const handleClick = () => {
    if (onOpenUrl) onOpenUrl(attachment);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(attachment.id);
  };

  const title = attachment.title || attachment.url || 'Untitled';
  const sourceLabel = attachment.sourceLabel || SOURCE_LABELS[attachment.source] || 'Link';
  const dateStr = formatRelativeDate(attachment.created_at);

  return (
    <div
      className="yt-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Thumbnail */}
      <div className="yt-card__thumb-wrap" onClick={handleClick}>
        {youtubeId ? (
          <img
            className="yt-card__thumb"
            src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
            alt={title}
            loading="lazy"
          />
        ) : (
          <div className="yt-card__thumb-placeholder">
            <span className="yt-card__thumb-placeholder-icon">🔗</span>
          </div>
        )}
        {youtubeId && (
          <div className={`yt-card__play-btn${hovered ? ' yt-card__play-btn--visible' : ''}`}>
            <svg viewBox="0 0 68 48" width="48" height="34">
              <path className="yt-card__play-bg" d="M66.5 7.7c-.8-2.9-2.9-5.2-5.8-6C55.6 0 34 0 34 0S12.4 0 7.3 1.7c-2.9.8-5 3.1-5.8 6C0 12.8 0 24 0 24s0 11.2 1.5 16.3c.8 2.9 2.9 5.2 5.8 6C12.4 48 34 48 34 48s21.6 0 26.7-1.7c2.9-.8 5-3.1 5.8-6C68 35.2 68 24 68 24S68 12.8 66.5 7.7z" />
              <path className="yt-card__play-arrow" d="M45 24L27 14v20z" />
            </svg>
          </div>
        )}
        {hovered && onDelete && (
          <button
            className="yt-card__delete"
            onClick={handleDelete}
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="yt-card__info" onClick={handleClick}>
        <p className="yt-card__title" title={title}>{title}</p>
        <div className="yt-card__meta">
          <span className="yt-card__source-badge">{sourceLabel}</span>
          {dateStr && <span className="yt-card__date">{dateStr}</span>}
        </div>
      </div>
    </div>
  );
}
