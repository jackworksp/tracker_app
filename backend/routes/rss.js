const express = require('express');
const { Parser } = require('xml2js');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const parser = new Parser({ explicitArray: false, mergeAttrs: true, trim: true });

router.use(authenticateToken);

// ─── Helpers ────────────────────────────────────────────────────────────────

function validateFeedUrl(url) {
    try {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            throw new Error('Only http and https URLs are allowed');
        }
        return parsed.href;
    } catch (err) {
        if (err.message === 'Only http and https URLs are allowed') throw err;
        throw new Error('Invalid URL');
    }
}

async function fetchRssText(url) {
    const response = await fetch(url, {
        redirect: 'follow',
        headers: {
            'User-Agent': 'vela-rss/1.0',
            'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*;q=0.8',
        },
    });
    if (!response.ok) {
        throw new Error(`Feed returned HTTP ${response.status}`);
    }
    return response.text();
}

function stripHtml(html) {
    if (!html || typeof html !== 'string') return '';
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function faviconUrl(feedUrl) {
    try {
        const { hostname } = new URL(feedUrl);
        return `https://www.google.com/s2/favicons?sz=32&domain=${hostname}`;
    } catch (_) {
        return null;
    }
}

function parseFeedXml(parsed) {
    // Atom 1.0
    if (parsed.feed) {
        const feed = parsed.feed;
        const feedTitle = (typeof feed.title === 'object' ? feed.title._ : feed.title) || 'Untitled Feed';
        const links = feed.link ? (Array.isArray(feed.link) ? feed.link : [feed.link]) : [];
        const feedSiteUrl = links.find((l) => l?.rel === 'alternate' || !l?.rel)?.href || null;

        const rawEntries = feed.entry
            ? (Array.isArray(feed.entry) ? feed.entry : [feed.entry])
            : [];

        const articles = rawEntries.map((entry) => {
            const guid = entry.id || null;
            const entryLinks = entry.link ? (Array.isArray(entry.link) ? entry.link : [entry.link]) : [];
            const articleUrl = entryLinks.find((l) => l?.rel === 'alternate' || !l?.rel)?.href
                || entryLinks[0]?.href
                || null;
            const title = (typeof entry.title === 'object' ? entry.title._ : entry.title) || 'Untitled';
            const rawSummary = (typeof entry.summary === 'object' ? entry.summary._ : entry.summary)
                || (typeof entry.content === 'object' ? entry.content._ : entry.content)
                || '';
            const summary = stripHtml(rawSummary).slice(0, 500);
            const published = entry.published || entry.updated || null;
            return { guid: guid || articleUrl, title, articleUrl, summary, published };
        });

        return { feedTitle, feedSiteUrl, articles };
    }

    // RSS 2.0
    if (parsed.rss) {
        const channel = parsed.rss.channel;
        const feedTitle = channel.title || 'Untitled Feed';
        const feedSiteUrl = channel.link || null;

        const rawItems = channel.item
            ? (Array.isArray(channel.item) ? channel.item : [channel.item])
            : [];

        const articles = rawItems.map((item) => {
            const guid = (typeof item.guid === 'object' ? item.guid._ : item.guid) || item.link || null;
            const title = item.title || 'Untitled';
            const articleUrl = item.link || item['feedburner:origLink'] || null;
            const rawSummary = item['content:encoded'] || item.description || '';
            const summary = stripHtml(rawSummary).slice(0, 500);
            const published = item.pubDate || item['dc:date'] || null;
            return { guid, title, articleUrl, summary, published };
        });

        return { feedTitle, feedSiteUrl, articles };
    }

    throw new Error('Unrecognized feed format — expected RSS 2.0 or Atom 1.0');
}

async function upsertArticles(userId, feedId, articles) {
    for (const article of articles) {
        if (!article.guid) continue;
        await db.pool.query(
            `INSERT INTO rss_articles
               (user_id, feed_id, article_guid, title, article_url, summary, published_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (user_id, article_guid) DO NOTHING`,
            [userId, feedId, article.guid, article.title, article.articleUrl,
             article.summary, article.published || null]
        );
    }
}

// ─── Routes ─────────────────────────────────────────────────────────────────

// POST /api/rss/feeds — add a new RSS feed
router.post('/feeds', async (req, res) => {
    try {
        const rawUrl = (req.body.url || '').trim();
        if (!rawUrl) return res.status(400).json({ error: 'url is required' });

        let normalizedUrl;
        try {
            normalizedUrl = validateFeedUrl(rawUrl);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }

        let text;
        try {
            text = await fetchRssText(normalizedUrl);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }

        let parsed;
        try {
            parsed = await parser.parseStringPromise(text);
        } catch (_) {
            return res.status(400).json({ error: 'Could not parse feed — URL may not point to valid RSS or Atom XML' });
        }

        let feedMeta;
        try {
            feedMeta = parseFeedXml(parsed);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }

        const favicon = faviconUrl(normalizedUrl);

        const insertResult = await db.pool.query(
            `INSERT INTO rss_feeds (user_id, feed_url, title, site_url, favicon_url)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (user_id, feed_url) DO NOTHING
             RETURNING *`,
            [req.userId, normalizedUrl, feedMeta.feedTitle, feedMeta.feedSiteUrl, favicon]
        );

        if (insertResult.rowCount === 0) {
            return res.status(409).json({ error: 'You are already subscribed to this feed' });
        }

        const feedRow = insertResult.rows[0];
        await upsertArticles(req.userId, feedRow.id, feedMeta.articles);

        res.status(201).json(feedRow);
    } catch (error) {
        console.error('Error adding RSS feed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/rss/feeds — list user's feeds with unread counts
router.get('/feeds', async (req, res) => {
    try {
        const result = await db.pool.query(
            `SELECT
               f.id, f.feed_url, f.title, f.site_url, f.favicon_url, f.added_at,
               COUNT(a.id) FILTER (WHERE a.is_read = FALSE) AS unread_count
             FROM rss_feeds f
             LEFT JOIN rss_articles a ON a.feed_id = f.id AND a.user_id = f.user_id
             WHERE f.user_id = $1
             GROUP BY f.id
             ORDER BY f.added_at DESC`,
            [req.userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching RSS feeds:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/rss/feeds/:feedId — remove a feed (articles cascade)
router.delete('/feeds/:feedId', async (req, res) => {
    try {
        const result = await db.pool.query(
            'DELETE FROM rss_feeds WHERE id = $1 AND user_id = $2',
            [req.params.feedId, req.userId]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: 'Feed not found' });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting RSS feed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/rss/articles — refresh all feeds and return latest articles
router.get('/articles', async (req, res) => {
    try {
        const feedsResult = await db.pool.query(
            'SELECT * FROM rss_feeds WHERE user_id = $1 ORDER BY added_at DESC',
            [req.userId]
        );
        const feeds = feedsResult.rows;

        // Refresh each feed; individual failures are silently skipped so one
        // broken feed does not block the rest
        await Promise.all(feeds.map(async (feed) => {
            try {
                const text = await fetchRssText(feed.feed_url);
                const parsed = await parser.parseStringPromise(text);
                const feedMeta = parseFeedXml(parsed);
                await upsertArticles(req.userId, feed.id, feedMeta.articles);
            } catch (err) {
                console.warn(`RSS refresh failed for feed ${feed.id} (${feed.feed_url}):`, err.message);
            }
        }));

        // Fetch articles joined with feed metadata
        const feedId = req.query.feed_id ? parseInt(req.query.feed_id, 10) : null;
        const limit = Math.min(parseInt(req.query.limit, 10) || 100, 200);
        const offset = parseInt(req.query.offset, 10) || 0;

        const params = [req.userId, limit, offset];
        let feedFilter = '';
        if (feedId) {
            feedFilter = 'AND a.feed_id = $4';
            params.push(feedId);
        }

        const articlesResult = await db.pool.query(
            `SELECT
               a.id, a.feed_id, a.article_guid, a.title, a.article_url,
               a.summary, a.published_at, a.is_read,
               f.title AS feed_title, f.site_url AS feed_site_url, f.favicon_url
             FROM rss_articles a
             JOIN rss_feeds f ON f.id = a.feed_id
             WHERE a.user_id = $1
             ${feedFilter}
             ORDER BY a.published_at DESC NULLS LAST
             LIMIT $2 OFFSET $3`,
            params
        );

        // Refresh unread counts on feeds
        const feedsWithCounts = await db.pool.query(
            `SELECT
               f.id, f.feed_url, f.title, f.site_url, f.favicon_url, f.added_at,
               COUNT(a.id) FILTER (WHERE a.is_read = FALSE) AS unread_count
             FROM rss_feeds f
             LEFT JOIN rss_articles a ON a.feed_id = f.id AND a.user_id = f.user_id
             WHERE f.user_id = $1
             GROUP BY f.id
             ORDER BY f.added_at DESC`,
            [req.userId]
        );

        res.json({
            articles: articlesResult.rows,
            feeds: feedsWithCounts.rows,
        });
    } catch (error) {
        console.error('Error fetching RSS articles:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PATCH /api/rss/articles/:articleId/read — mark article read/unread
router.patch('/articles/:articleId/read', async (req, res) => {
    try {
        const isRead = req.body.is_read !== undefined ? Boolean(req.body.is_read) : true;
        const result = await db.pool.query(
            `UPDATE rss_articles
             SET is_read = $1
             WHERE id = $2 AND user_id = $3
             RETURNING id, is_read`,
            [isRead, req.params.articleId, req.userId]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: 'Article not found' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating article read status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
