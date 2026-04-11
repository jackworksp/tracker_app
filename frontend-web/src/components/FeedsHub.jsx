import { useCallback, useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import { Plus, RefreshCw, Rss, X } from 'lucide-react';
import api from '../api';
import YouTubeCard from './YouTubeCard';
import RssFeedsSection from './RssFeedsSection';
import { openUrl } from '../utils/linkUtils';
import './FeedsHub.css';

export default function FeedsHub() {
  const [feedTab, setFeedTab] = useState('youtube');
  const [channels, setChannels] = useState([]);
  const [videos, setVideos] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [channelInput, setChannelInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadChannels = useCallback(async () => {
    const data = await api.feeds.getChannels();
    setChannels(Array.isArray(data) ? data : []);
  }, []);

  const loadVideos = useCallback(async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.feeds.getVideos();
      setVideos(response?.data || []);
      if (Array.isArray(response?.channels)) {
        setChannels(response.channels);
      }
    } catch (error) {
      console.error('Failed to load feed videos:', error);
      message.error('Failed to load feed videos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const [channelData, videoData] = await Promise.all([
          api.feeds.getChannels(),
          api.feeds.getVideos(),
        ]);

        if (!mounted) return;

        setChannels(Array.isArray(videoData?.channels) ? videoData.channels : (Array.isArray(channelData) ? channelData : []));
        setVideos(videoData?.data || []);
      } catch (error) {
        console.error('Failed to initialize feeds hub:', error);
        if (mounted) message.error('Failed to load feeds');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const visibleVideos = useMemo(() => {
    if (!activeChannel) return videos;
    return videos.filter((video) => video.channel_id === activeChannel);
  }, [videos, activeChannel]);

  const handleRefresh = async () => {
    await loadVideos({ silent: true });
  };

  const handleAddChannel = async (event) => {
    event.preventDefault();
    const value = channelInput.trim();
    if (!value) {
      message.error('Enter a YouTube channel URL, handle, or channel ID');
      return;
    }

    try {
      setSubmitting(true);
      await api.feeds.addChannel(value);
      await Promise.all([loadChannels(), loadVideos({ silent: true })]);
      setChannelInput('');
      setShowModal(false);
      message.success('Channel added');
    } catch (error) {
      console.error('Failed to add channel:', error);
      message.error(error.message || 'Failed to add channel');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveChannel = async (channelId) => {
    if (!window.confirm('Remove this channel from your feed?')) return;

    try {
      await api.feeds.deleteChannel(channelId);
      if (activeChannel === channelId) {
        setActiveChannel(null);
      }
      await Promise.all([loadChannels(), loadVideos({ silent: true })]);
      message.success('Channel removed');
    } catch (error) {
      console.error('Failed to remove channel:', error);
      message.error('Failed to remove channel');
    }
  };

  return (
    <div className="feeds-hub">
      <div className="feeds-hub__header">
        <div>
          <h2 className="feeds-hub__title">
            <Rss size={24} />
            Feeds
          </h2>
          <p className="feeds-hub__subtitle">Follow YouTube channels and curated RSS feeds in one place.</p>
        </div>

        {feedTab === 'youtube' && (
          <div className="feeds-hub__actions">
            <button
              type="button"
              className="feeds-hub__action-btn"
              onClick={handleRefresh}
              disabled={loading || refreshing || channels.length === 0}
            >
              <RefreshCw size={16} className={refreshing ? 'feeds-hub__spin' : ''} />
              Refresh
            </button>
            <button
              type="button"
              className="feeds-hub__action-btn feeds-hub__action-btn--primary"
              onClick={() => setShowModal(true)}
            >
              <Plus size={16} />
              Add Channel
            </button>
          </div>
        )}
      </div>

      {/* Internal tab switcher */}
      <div className="feeds-hub__tabs">
        <button
          type="button"
          className={`feeds-hub__tab${feedTab === 'youtube' ? ' feeds-hub__tab--active' : ''}`}
          onClick={() => setFeedTab('youtube')}
        >
          YouTube
        </button>
        <button
          type="button"
          className={`feeds-hub__tab${feedTab === 'rss' ? ' feeds-hub__tab--active' : ''}`}
          onClick={() => setFeedTab('rss')}
        >
          RSS Feeds
        </button>
      </div>

      {feedTab === 'rss' ? (
        <RssFeedsSection />
      ) : (
        <>
      {channels.length > 0 && (
        <div className="feeds-hub__pills">
          <button
            type="button"
            className={`feeds-hub__pill${activeChannel === null ? ' feeds-hub__pill--active' : ''}`}
            onClick={() => setActiveChannel(null)}
          >
            All
            <span className="feeds-hub__pill-count">{videos.length}</span>
          </button>

          {channels.map((channel) => {
            const count = videos.filter((video) => video.channel_id === channel.channel_id).length;
            return (
              <div key={channel.channel_id} className="feeds-hub__pill-wrap">
                <button
                  type="button"
                  className={`feeds-hub__pill${activeChannel === channel.channel_id ? ' feeds-hub__pill--active' : ''}`}
                  onClick={() => setActiveChannel(channel.channel_id)}
                >
                  <span className="feeds-hub__pill-label">{channel.channel_name || channel.channel_id}</span>
                  <span className="feeds-hub__pill-count">{count}</span>
                </button>
                <button
                  type="button"
                  className="feeds-hub__pill-remove"
                  onClick={() => handleRemoveChannel(channel.channel_id)}
                  title={`Remove ${channel.channel_name || channel.channel_id}`}
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="feeds-hub__empty">
          <p>Loading feeds...</p>
        </div>
      ) : channels.length === 0 ? (
        <div className="feeds-hub__empty">
          <Rss size={32} />
          <h3>No channels yet</h3>
          <p>Add your first YouTube channel to start building this feed.</p>
          <button
            type="button"
            className="feeds-hub__action-btn feeds-hub__action-btn--primary"
            onClick={() => setShowModal(true)}
          >
            <Plus size={16} />
            Add Channel
          </button>
        </div>
      ) : visibleVideos.length === 0 ? (
        <div className="feeds-hub__empty">
          <p>No videos found for this channel selection.</p>
        </div>
      ) : (
        <div className="feeds-hub__grid">
          {visibleVideos.map((video) => (
            <YouTubeCard
              key={video.id}
              attachment={video}
              onOpenUrl={(attachment) => openUrl(attachment.url)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <div className="feeds-modal__backdrop" onClick={() => !submitting && setShowModal(false)}>
          <div className="feeds-modal" onClick={(event) => event.stopPropagation()}>
            <div className="feeds-modal__header">
              <h3>Add Channel</h3>
              <button
                type="button"
                className="feeds-modal__close"
                onClick={() => !submitting && setShowModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form className="feeds-modal__form" onSubmit={handleAddChannel}>
              <label className="feeds-modal__label" htmlFor="feed-channel-input">
                YouTube channel URL, `@handle`, or channel ID
              </label>
              <input
                id="feed-channel-input"
                className="feeds-modal__input"
                placeholder="https://www.youtube.com/@mkbhd"
                value={channelInput}
                onChange={(event) => setChannelInput(event.target.value)}
                autoFocus
              />
              <div className="feeds-modal__actions">
                <button type="button" className="feeds-modal__btn feeds-modal__btn--secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="feeds-modal__btn feeds-modal__btn--primary" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Channel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
