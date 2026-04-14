const crypto = require('crypto');
const express = require('express');
const { Parser } = require('xml2js');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const parser = new Parser({
  explicitArray: false,
  mergeAttrs: true,
  trim: true,
});

router.use(authenticateToken);

function normalizeInput(value) {
  return (value || '').trim();
}

function shaId(value) {
  return crypto.createHash('sha256').update(value).digest('hex').slice(0, 40);
}

function isChannelId(value) {
  return /^UC[\w-]{22}$/.test(value);
}

function isHandle(value) {
  return /^@[\w.-]{3,}$/.test(value);
}

function isYouTubeUrl(value) {
  try {
    const url = new URL(value);
    return /(^|\.)youtube\.com$/i.test(url.hostname) || /(^|\.)youtu\.be$/i.test(url.hostname);
  } catch (_) {
    return false;
  }
}

function looksLikeGenericFeedUrl(value) {
  try {
    const url = new URL(value);
    if (isYouTubeUrl(value)) return false;

    return (
      /\/feed\/?$/i.test(url.pathname) ||
      /\.(xml|rss|atom)$/i.test(url.pathname) ||
      url.searchParams.has('feed')
    );
  } catch (_) {
    return false;
  }
}

function toChannelUrl(input) {
  if (isChannelId(input)) return `https://www.youtube.com/channel/${input}`;
  if (isHandle(input)) return `https://www.youtube.com/${input}`;
  if (/^https?:\/\//i.test(input)) return input;
  if (/^(www\.)?(youtube\.com|m\.youtube\.com)\//i.test(input)) return `https://${input.replace(/^https?:\/\//i, '')}`;
  if (/^[\w.-]+$/.test(input)) return `https://www.youtube.com/@${input}`;
  return input;
}

function extractChannelIdFromUrl(urlString) {
  try {
    const url = new URL(urlString);
    const pathname = url.pathname.replace(/\/+$/, '');
    const match = pathname.match(/\/channel\/(UC[\w-]{22})$/i);
    if (match) return match[1];

    const feedId = url.searchParams.get('channel_id');
    if (feedId && isChannelId(feedId)) return feedId;
  } catch (_) {
    return null;
  }

  return null;
}

function extractChannelMetadataFromHtml(html) {
  if (!html) return {};

  const channelId =
    html.match(/"externalId":"(UC[\w-]{22})"/)?.[1] ||
    html.match(/https:\/\/www\.youtube\.com\/channel\/(UC[\w-]{22})/)?.[1] ||
    html.match(/"channelUrl":"https:\\\/\\\/www\.youtube\.com\\\/channel\\\/(UC[\w-]{22})"/)?.[1] ||
    html.match(/"channelId":"(UC[\w-]{22})"/)?.[1] ||
    null;

  const channelName =
    html.match(/<meta property="og:title" content="([^"]+)"/i)?.[1] ||
    html.match(/<title>([^<]+)<\/title>/i)?.[1]?.replace(/\s*-\s*YouTube$/i, '') ||
    null;

  const channelThumbnail =
    html.match(/<meta property="og:image" content="([^"]+)"/i)?.[1] ||
    null;

  return { channelId, channelName, channelThumbnail };
}

function ensureArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function cleanText(value) {
  if (typeof value !== 'string') return value || null;
  const withoutTags = value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return withoutTags || null;
}

function absoluteUrl(base, value) {
  if (!value) return null;
  try {
    return new URL(value, base).toString();
  } catch (_) {
    return value;
  }
}

function pickImageUrl(entry, baseUrl) {
  const candidates = [
    entry['media:group']?.['media:thumbnail']?.url,
    entry['media:thumbnail']?.url,
    entry['media:content']?.url,
    entry.enclosure?.url,
    entry.image?.url,
    entry.thumbnail,
  ];

  const htmlSources = [
    entry.description,
    entry.summary?._,
    entry.content?._,
    entry.content,
  ];

  for (const candidate of candidates) {
    if (candidate && /\.(png|jpe?g|gif|webp|avif)(\?|$)/i.test(candidate)) {
      return absoluteUrl(baseUrl, candidate);
    }
  }

  for (const source of htmlSources) {
    if (typeof source !== 'string') continue;
    const match = source.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match) return absoluteUrl(baseUrl, match[1]);
  }

  return null;
}

function pickEntryLink(entry, baseUrl) {
  const linkField = entry.link;
  const links = ensureArray(linkField);

  for (const link of links) {
    if (typeof link === 'string' && link.trim()) return absoluteUrl(baseUrl, link.trim());
    if (link?.href && (!link.rel || link.rel === 'alternate')) return absoluteUrl(baseUrl, link.href);
  }

  return absoluteUrl(baseUrl, entry.guid?._ || entry.guid || entry.id || entry.url || null);
}

function parseYouTubeEntries(feedData, channelId) {
  const feed = feedData?.feed;
  if (!feed) return [];

  const entries = ensureArray(feed.entry);

  return entries
    .map((entry) => {
      const videoId = entry['yt:videoId'];
      if (!videoId) return null;

      const link = Array.isArray(entry.link)
        ? entry.link.find((candidate) => candidate.href)?.href
        : entry.link?.href;

      return {
        channel_id: channelId,
        item_id: videoId,
        title: entry.title || 'Untitled',
        thumbnail: entry['media:group']?.['media:thumbnail']?.url || null,
        published_at: entry.published || null,
        item_url: link || `https://www.youtube.com/watch?v=${videoId}`,
        source_type: 'youtube',
      };
    })
    .filter(Boolean);
}

function parseGenericFeed(xml, sourceUrl) {
  return parser.parseStringPromise(xml).then((parsed) => {
    const rssChannel = parsed?.rss?.channel;
    const atomFeed = parsed?.feed;
    const channel = rssChannel || atomFeed;

    if (!channel) {
      throw new Error('The URL did not return a valid RSS or Atom feed');
    }

    const isAtom = Boolean(atomFeed);
    const entries = ensureArray(isAtom ? atomFeed.entry : rssChannel.item);
    const feedTitle = cleanText(channel.title?._ || channel.title) || sourceUrl;
    const feedThumbnail = absoluteUrl(
      sourceUrl,
      channel.image?.url || channel.logo || channel.icon || channel['itunes:image']?.href || null
    );

    const items = entries
      .map((entry) => {
        const itemUrl = pickEntryLink(entry, sourceUrl);
        const rawId = entry.guid?._ || entry.guid || entry.id || itemUrl || entry.title;
        if (!rawId) return null;

        return {
          channel_id: `rss:${shaId(sourceUrl)}`,
          item_id: shaId(`${sourceUrl}:${rawId}`),
          title: cleanText(entry.title?._ || entry.title) || 'Untitled',
          thumbnail: pickImageUrl(entry, sourceUrl),
          published_at: entry.pubDate || entry.published || entry.updated || entry.issued || null,
          item_url: itemUrl,
          source_type: 'rss',
        };
      })
      .filter(Boolean);

    return {
      channelId: `rss:${shaId(sourceUrl)}`,
      channelName: feedTitle,
      channelThumbnail: feedThumbnail,
      sourceUrl,
      sourceType: 'rss',
      items,
    };
  });
}

function discoverFeedUrl(html, pageUrl) {
  const matches = [...html.matchAll(/<link[^>]+type=["']application\/(?:rss|atom)\+xml["'][^>]+href=["']([^"']+)["'][^>]*>/gi)];
  if (matches[0]?.[1]) return absoluteUrl(pageUrl, matches[0][1]);

  const reverseMatches = [...html.matchAll(/<link[^>]+href=["']([^"']+)["'][^>]+type=["']application\/(?:rss|atom)\+xml["'][^>]*>/gi)];
  if (reverseMatches[0]?.[1]) return absoluteUrl(pageUrl, reverseMatches[0][1]);

  return null;
}

async function fetchText(url) {
  let response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'User-Agent': 'vela-feeds/1.0',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Cache-Control': 'no-cache, no-store, max-age=0',
      Pragma: 'no-cache',
    },
  });

  if (response.status === 304) {
    const retryUrl = new URL(url);
    retryUrl.searchParams.set('_vela_ts', Date.now().toString());
    response = await fetch(retryUrl.toString(), {
      redirect: 'follow',
      headers: {
        'User-Agent': 'vela-feeds/1.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Cache-Control': 'no-cache, no-store, max-age=0',
        Pragma: 'no-cache',
      },
    });
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return {
    text: await response.text(),
    finalUrl: response.url,
    contentType: response.headers.get('content-type') || '',
  };
}

async function fetchYouTubeFeed(channelId) {
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  let response = await fetch(feedUrl, {
    headers: {
      'User-Agent': 'vela-feeds/1.0',
      Accept: 'application/rss+xml, application/xml, text/xml',
      'Cache-Control': 'no-cache, no-store, max-age=0',
      Pragma: 'no-cache',
    },
  });

  if (response.status === 304) {
    response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'vela-feeds/1.0',
        Accept: 'application/rss+xml, application/xml, text/xml',
        'Cache-Control': 'no-cache, no-store, max-age=0',
        Pragma: 'no-cache',
      },
    });
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch RSS for ${channelId}: ${response.status}`);
  }

  const xml = await response.text();
  const parsed = await parser.parseStringPromise(xml);
  const author = parsed?.feed?.author || {};
  const authorName = Array.isArray(author.name) ? author.name[0] : author.name;

  return {
    sourceType: 'youtube',
    channelId,
    channelName: authorName || parsed?.feed?.title || null,
    channelThumbnail: null,
    sourceUrl: feedUrl,
    items: parseYouTubeEntries(parsed, channelId),
  };
}

async function fetchGenericFeedByUrl(feedUrl) {
  const { text, finalUrl } = await fetchText(feedUrl);
  return parseGenericFeed(text, finalUrl);
}

async function resolveFeedSource(input) {
  const normalized = normalizeInput(input);
  if (!normalized) {
    throw new Error('A YouTube channel or RSS/Atom feed URL is required');
  }

  if (isChannelId(normalized)) {
    return { sourceType: 'youtube', channelId: normalized, channelName: null, channelThumbnail: null, sourceUrl: null };
  }

  const directId = extractChannelIdFromUrl(normalized);
  if (directId) {
    return { sourceType: 'youtube', channelId: directId, channelName: null, channelThumbnail: null, sourceUrl: null };
  }

  if (isHandle(normalized) || isYouTubeUrl(normalized) || /^[\w.-]+$/.test(normalized)) {
    const targetUrl = toChannelUrl(normalized);
    const { text, finalUrl } = await fetchText(targetUrl);
    const directFinalId = extractChannelIdFromUrl(finalUrl);
    const htmlMeta = extractChannelMetadataFromHtml(text);
    const channelId = directFinalId || htmlMeta.channelId;

    if (!channelId) {
      throw new Error('Could not resolve a YouTube channel ID from that input');
    }

    return {
      sourceType: 'youtube',
      channelId,
      channelName: htmlMeta.channelName,
      channelThumbnail: htmlMeta.channelThumbnail,
      sourceUrl: null,
    };
  }

  if (/^https?:\/\//i.test(normalized)) {
    if (looksLikeGenericFeedUrl(normalized)) {
      return fetchGenericFeedByUrl(normalized);
    }

    const { text, finalUrl, contentType } = await fetchText(normalized);
    const looksXml = /(?:rss|atom|xml)/i.test(contentType) || /^\s*<\?xml/i.test(text) || /^\s*<(rss|feed)\b/i.test(text);

    if (looksXml) {
      return parseGenericFeed(text, finalUrl);
    }

    const discoveredFeedUrl = discoverFeedUrl(text, finalUrl);
    if (discoveredFeedUrl) {
      return fetchGenericFeedByUrl(discoveredFeedUrl);
    }
  }

  throw new Error('Enter a YouTube channel, RSS feed URL, or a page that exposes an RSS/Atom feed');
}

async function refreshSource(source) {
  if (source.source_type === 'rss') {
    if (!source.source_url) {
      throw new Error(`Feed ${source.channel_id} is missing source_url`);
    }
    return fetchGenericFeedByUrl(source.source_url);
  }

  return fetchYouTubeFeed(source.channel_id);
}

async function upsertItems(userId, items) {
  for (const item of items) {
    await db.pool.query(
      `
        INSERT INTO feeds_cache (
          user_id,
          channel_id,
          video_id,
          title,
          thumbnail,
          published_at,
          video_url
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (user_id, video_id)
        DO UPDATE SET
          channel_id = EXCLUDED.channel_id,
          title = EXCLUDED.title,
          thumbnail = EXCLUDED.thumbnail,
          published_at = EXCLUDED.published_at,
          video_url = EXCLUDED.video_url
      `,
      [
        userId,
        item.channel_id,
        item.item_id,
        item.title,
        item.thumbnail,
        item.published_at,
        item.item_url,
      ]
    );
  }
}

router.get('/channels', async (req, res) => {
  try {
    const result = await db.pool.query(
      `
        SELECT id, channel_id, source_type, source_url, channel_name, channel_thumbnail, added_at
        FROM feeds_channels
        WHERE user_id = $1
        ORDER BY added_at DESC, channel_name ASC NULLS LAST
      `,
      [req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Failed to list feed channels:', error);
    res.status(500).json({ error: 'Failed to load subscribed feeds' });
  }
});

router.post('/channels', async (req, res) => {
  const source = req.body?.url || req.body?.channel_id || req.body?.channelId;

  try {
    const resolved = await resolveFeedSource(source);
    const feed = resolved.items ? resolved : await refreshSource({
      channel_id: resolved.channelId,
      source_type: resolved.sourceType,
      source_url: resolved.sourceUrl,
    });

    const channelId = resolved.channelId || feed.channelId;
    const sourceType = resolved.sourceType || feed.sourceType;
    const sourceUrl = resolved.sourceUrl || feed.sourceUrl || null;
    const channelName = resolved.channelName || feed.channelName || channelId;
    const channelThumbnail = resolved.channelThumbnail || feed.channelThumbnail || null;

    const result = await db.pool.query(
      `
        INSERT INTO feeds_channels (user_id, channel_id, source_type, source_url, channel_name, channel_thumbnail)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id, channel_id)
        DO UPDATE SET
          source_type = EXCLUDED.source_type,
          source_url = COALESCE(EXCLUDED.source_url, feeds_channels.source_url),
          channel_name = COALESCE(EXCLUDED.channel_name, feeds_channels.channel_name),
          channel_thumbnail = COALESCE(EXCLUDED.channel_thumbnail, feeds_channels.channel_thumbnail)
        RETURNING id, channel_id, source_type, source_url, channel_name, channel_thumbnail, added_at
      `,
      [
        req.userId,
        channelId,
        sourceType,
        sourceUrl,
        channelName,
        channelThumbnail,
      ]
    );

    if (feed.items.length > 0) {
      await upsertItems(req.userId, feed.items);
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Failed to add feed channel:', error);
    res.status(400).json({ error: error.message || 'Failed to add feed source' });
  }
});

router.delete('/channels/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;

    await db.pool.query(
      'DELETE FROM feeds_cache WHERE user_id = $1 AND channel_id = $2',
      [req.userId, channelId]
    );

    const result = await db.pool.query(
      'DELETE FROM feeds_channels WHERE user_id = $1 AND channel_id = $2 RETURNING channel_id',
      [req.userId, channelId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Feed source not found' });
    }

    res.json({ success: true, channel_id: channelId });
  } catch (error) {
    console.error('Failed to delete feed channel:', error);
    res.status(500).json({ error: 'Failed to remove feed source' });
  }
});

router.get('/videos', async (req, res) => {
  try {
    const channelsResult = await db.pool.query(
      `
        SELECT channel_id, source_type, source_url, channel_name, channel_thumbnail
        FROM feeds_channels
        WHERE user_id = $1
        ORDER BY added_at DESC
      `,
      [req.userId]
    );

    const channels = channelsResult.rows;
    if (channels.length === 0) {
      return res.json({ data: [], channels: [] });
    }

    await Promise.allSettled(
      channels.map(async (channel) => {
        try {
          const feed = await refreshSource(channel);
          await upsertItems(req.userId, feed.items);

          const nextName = feed.channelName || channel.channel_name;
          const nextThumb = feed.channelThumbnail || channel.channel_thumbnail;
          const nextSourceUrl = feed.sourceUrl || channel.source_url;

          if (
            nextName !== channel.channel_name ||
            nextThumb !== channel.channel_thumbnail ||
            nextSourceUrl !== channel.source_url
          ) {
            await db.pool.query(
              `
                UPDATE feeds_channels
                SET channel_name = $3, channel_thumbnail = $4, source_url = $5
                WHERE user_id = $1 AND channel_id = $2
              `,
              [req.userId, channel.channel_id, nextName, nextThumb, nextSourceUrl]
            );
            channel.channel_name = nextName;
            channel.channel_thumbnail = nextThumb;
            channel.source_url = nextSourceUrl;
          }
        } catch (channelError) {
          console.error(`Failed to refresh feed ${channel.channel_id}:`, channelError.message);
        }
      })
    );

    const videosResult = await db.pool.query(
      `
        SELECT
          fc.video_id,
          fc.channel_id,
          fc.title,
          fc.thumbnail,
          fc.published_at,
          fc.video_url,
          ch.source_type,
          ch.source_url,
          ch.channel_name,
          ch.channel_thumbnail
        FROM feeds_cache fc
        LEFT JOIN feeds_channels ch
          ON ch.user_id = fc.user_id
         AND ch.channel_id = fc.channel_id
        WHERE fc.user_id = $1
        ORDER BY fc.published_at DESC NULLS LAST, fc.id DESC
        LIMIT 100
      `,
      [req.userId]
    );

    const data = videosResult.rows.map((row) => ({
      id: `feed-${row.video_id}`,
      video_id: row.video_id,
      channel_id: row.channel_id,
      channel_name: row.channel_name,
      channel_thumbnail: row.channel_thumbnail,
      title: row.title,
      thumbnail: row.thumbnail,
      published_at: row.published_at,
      created_at: row.published_at,
      url: row.video_url,
      source: row.source_type === 'rss' ? 'rss_feed' : 'youtube_feed',
      sourceLabel: row.source_type === 'rss' ? 'RSS' : 'YouTube',
      source_type: row.source_type,
      source_url: row.source_url,
      type: 'url',
    }));

    res.json({ data, channels });
  } catch (error) {
    console.error('Failed to load feed videos:', error);
    res.status(500).json({ error: 'Failed to load feed videos' });
  }
});

module.exports = router;
