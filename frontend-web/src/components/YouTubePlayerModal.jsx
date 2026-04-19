import { ExternalLink, X } from 'lucide-react';
import './YouTubePlayerModal.css';

export default function YouTubePlayerModal({ videoId, title, onClose, autoplay = true }) {
  if (!videoId) return null;

  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const embedUrl = `https://www.youtube.com/embed/${videoId}${autoplay ? '?autoplay=1' : ''}`;

  return (
    <div className="yt-player-overlay" onClick={onClose}>
      <div className="yt-player-modal" onClick={(event) => event.stopPropagation()}>
        <div className="yt-player-header">
          <span className="yt-player-title">{title || 'YouTube video'}</span>
          <div className="yt-player-actions">
            <a href={watchUrl} target="_blank" rel="noopener noreferrer" title="Open on YouTube">
              <ExternalLink size={16} />
            </a>
            <button type="button" onClick={onClose} title="Close">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="yt-player-embed">
          <iframe
            src={embedUrl}
            title={title || 'YouTube video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
