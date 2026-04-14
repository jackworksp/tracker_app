import { useCallback, useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import { ExternalLink, Plus, RefreshCw, Rss, X } from 'lucide-react';
import api from '../api';
import { openUrl } from '../utils/linkUtils';
import './RssFeedsSection.css';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelativeDate(dateStr) {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths}mo ago`;
    return `${Math.floor(diffMonths / 12)}y ago`;
  } catch (_) {
    return null;
  }
}

// ─── Article Card ─────────────────────────────────────────────────────────────

function RssArticleCard({ article, onRead }) {
  const dateStr = formatRelativeDate(article.published_at);
  const isRead = article.is_read;

  function handleOpen() {
    if (article.article_url) openUrl(article.article_url);
  }

  return (
    <div className={`rss-article${isRead ? ' rss-article--read' : ''}`}>
      <div className="rss-article__meta">
        {article.favicon_url && (
          <img
            className="rss-article__favicon"
            src={article.favicon_url}
            alt=""
            width={16}
            height={16}
          />
        )}
        <span className="rss-article__source">{article.feed_title}</span>
        {dateStr && <span className="rss-article__date">{dateStr}</span>}
      </div>

      <p className="rss-article__title" onClick={handleOpen} role="button" tabIndex={0}
         onKeyDown={(e) => e.key === 'Enter' && handleOpen()}>
        {article.title}
      </p>

      {article.summary && (
        <p className="rss-article__summary">{article.summary}</p>
      )}

      <div className="rss-article__footer">
        <button
          type="button"
          className={`rss-article__read-btn${isRead ? ' rss-article__read-btn--read' : ''}`}
          onClick={() => onRead(article.id, isRead)}
        >
          {isRead ? 'Read' : 'Mark read'}
        </button>
        {article.article_url && (
          <button
            type="button"
            className="rss-article__open-btn"
            onClick={handleOpen}
            title="Open article"
          >
            <ExternalLink size={13} />
            Open
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RssFeedsSection() {
  const [feeds, setFeeds] = useState([]);
  const [articles, setArticles] = useState([]);
  const [activeFeedId, setActiveFeedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [feedUrl, setFeedUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadArticles = useCallback(async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const response = await api.rss.getArticles();
      setArticles(response?.articles || []);
      setFeeds(response?.feeds || []);
    } catch (error) {
      console.error('Failed to load RSS articles:', error);
      message.error('Failed to load RSS feeds');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    api.rss.getArticles()
      .then((response) => {
        if (!mounted) return;
        setArticles(response?.articles || []);
        setFeeds(response?.feeds || []);
      })
      .catch((err) => {
        console.error('Failed to initialize RSS section:', err);
        if (mounted) message.error('Failed to load RSS feeds');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, []);

  const visibleArticles = useMemo(() => {
    if (activeFeedId === null) return articles;
    return articles.filter((a) => a.feed_id === activeFeedId);
  }, [articles, activeFeedId]);

  const handleRefresh = () => loadArticles({ silent: true });

  const handleAddFeed = async (event) => {
    event.preventDefault();
    const value = feedUrl.trim();
    if (!value) {
      message.error('Enter an RSS or Atom feed URL');
      return;
    }
    try {
      setSubmitting(true);
      await api.rss.addFeed(value);
      setFeedUrl('');
      setShowModal(false);
      message.success('Feed added');
      await loadArticles({ silent: true });
    } catch (error) {
      console.error('Failed to add RSS feed:', error);
      message.error(error.message || 'Failed to add feed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveFeed = async (feedId) => {
    if (!window.confirm('Remove this feed? All cached articles will be deleted.')) return;
    try {
      await api.rss.deleteFeed(feedId);
      if (activeFeedId === feedId) setActiveFeedId(null);
      await loadArticles({ silent: true });
      message.success('Feed removed');
    } catch (error) {
      console.error('Failed to remove RSS feed:', error);
      message.error('Failed to remove feed');
    }
  };

  const handleMarkRead = async (articleId, currentIsRead) => {
    // Optimistic update
    const newIsRead = !currentIsRead;
    setArticles((prev) =>
      prev.map((a) => (a.id === articleId ? { ...a, is_read: newIsRead } : a))
    );
    setFeeds((prev) =>
      prev.map((f) => {
        const delta = newIsRead ? -1 : 1;
        return f.id === articles.find((a) => a.id === articleId)?.feed_id
          ? { ...f, unread_count: Math.max(0, Number(f.unread_count) + delta) }
          : f;
      })
    );
    try {
      await api.rss.markRead(articleId, newIsRead);
    } catch (error) {
      // Revert on failure
      setArticles((prev) =>
        prev.map((a) => (a.id === articleId ? { ...a, is_read: currentIsRead } : a))
      );
      message.error('Failed to update read status');
    }
  };

  return (
    <div className="rss-section">
      {/* Action bar */}
      <div className="rss-section__actions">
        <button
          type="button"
          className="feeds-hub__action-btn"
          onClick={handleRefresh}
          disabled={loading || refreshing || feeds.length === 0}
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
          Add Feed
        </button>
      </div>

      {/* Feed filter pills */}
      {feeds.length > 0 && (
        <div className="feeds-hub__pills">
          <button
            type="button"
            className={`feeds-hub__pill${activeFeedId === null ? ' feeds-hub__pill--active' : ''}`}
            onClick={() => setActiveFeedId(null)}
          >
            All
            <span className="feeds-hub__pill-count">{articles.length}</span>
          </button>

          {feeds.map((feed) => (
            <div key={feed.id} className="feeds-hub__pill-wrap">
              <button
                type="button"
                className={`feeds-hub__pill${activeFeedId === feed.id ? ' feeds-hub__pill--active' : ''}`}
                onClick={() => setActiveFeedId(feed.id)}
              >
                {feed.favicon_url && (
                  <img
                    className="rss-section__favicon"
                    src={feed.favicon_url}
                    alt=""
                    width={16}
                    height={16}
                  />
                )}
                <span className="feeds-hub__pill-label">{feed.title || feed.feed_url}</span>
                {Number(feed.unread_count) > 0 && (
                  <span className="feeds-hub__pill-count">{feed.unread_count}</span>
                )}
              </button>
              <button
                type="button"
                className="feeds-hub__pill-remove"
                onClick={() => handleRemoveFeed(feed.id)}
                title={`Remove ${feed.title || feed.feed_url}`}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="feeds-hub__empty">
          <p>Loading RSS feeds...</p>
        </div>
      ) : feeds.length === 0 ? (
        <div className="feeds-hub__empty">
          <Rss size={32} />
          <h3>No RSS feeds yet</h3>
          <p>Subscribe to blogs, news sites, or any RSS/Atom feed to see articles here.</p>
          <button
            type="button"
            className="feeds-hub__action-btn feeds-hub__action-btn--primary"
            onClick={() => setShowModal(true)}
          >
            <Plus size={16} />
            Add Your First Feed
          </button>
        </div>
      ) : visibleArticles.length === 0 ? (
        <div className="feeds-hub__empty">
          <p>No articles found for this feed.</p>
        </div>
      ) : (
        <div className="rss-section__list">
          {visibleArticles.map((article) => (
            <RssArticleCard
              key={article.id}
              article={article}
              onRead={handleMarkRead}
            />
          ))}
        </div>
      )}

      {/* Add Feed Modal */}
      {showModal && (
        <div
          className="feeds-modal__backdrop"
          onClick={() => !submitting && setShowModal(false)}
        >
          <div className="feeds-modal" onClick={(e) => e.stopPropagation()}>
            <div className="feeds-modal__header">
              <h3>Add RSS Feed</h3>
              <button
                type="button"
                className="feeds-modal__close"
                onClick={() => !submitting && setShowModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form className="feeds-modal__form" onSubmit={handleAddFeed}>
              <label className="feeds-modal__label" htmlFor="rss-feed-url-input">
                RSS or Atom feed URL
              </label>
              <input
                id="rss-feed-url-input"
                className="feeds-modal__input"
                placeholder="https://hnrss.org/frontpage"
                value={feedUrl}
                onChange={(e) => setFeedUrl(e.target.value)}
                autoFocus
              />
              <p className="rss-section__hint">
                Tip: most blogs have a feed at <code>/feed</code> or <code>/rss</code>.
                YouTube channels, Reddit, and Substack also support RSS.
              </p>
              <div className="feeds-modal__actions">
                <button
                  type="button"
                  className="feeds-modal__btn feeds-modal__btn--secondary"
                  onClick={() => !submitting && setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="feeds-modal__btn feeds-modal__btn--primary"
                  disabled={submitting}
                >
                  {submitting ? 'Adding...' : 'Add Feed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
