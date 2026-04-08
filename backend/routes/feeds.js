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

function isChannelId(value) {
  return /^UC[\w-]{22}$/.test(value);
}

function isHandle(value) {
  return /^@[\w.-]{3,}$/.test(value);
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

function parseFeedEntries(feedData, channelId) {
  const feed = feedData?.feed;
  if (!feed) return [];

  const entries = Array.isArray(feed.entry)
    ? feed.entry
    : feed.entry
      ? [feed.entry]
      : [];

  return entries
    .map((entry) => {
      const videoId = entry['yt:videoId'];
      if (!videoId) return null;

      const thumbnail = entry['media:group']?.['media:thumbnail']?.url || null;
      const link = Array.isArray(entry.link)
        ? entry.link.find((candidate) => candidate.href)?.href
        : entry.link?.href;

      return {
        channel_id: channelId,
        video_id: videoId,
        title: entry.title || 'Untitled',
        thumbnail,
        published_at: entry.published || null,
        video_url: link || `https://www.youtube.com/watch?v=${videoId}`,
      };
    })
    .filter(Boolean);
}

async function fetchText(url) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'User-Agent': 'vela-feeds/1.0',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return {
    text: await response.text(),
    finalUrl: response.url,
  };
}

async function fetchFeed(channelId) {
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  const response = await fetch(feedUrl, {
    headers: {
      'User-Agent': 'vela-feeds/1.0',
      Accept: 'application/rss+xml, application/xml, text/xml',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch RSS for ${channelId}: ${response.status}`);
  }

  const xml = await response.text();
  const parsed = await parser.parseStringPromise(xml);
  const author = parsed?.feed?.author || {};
  const authorName = Array.isArray(author.name) ? author.name[0] : author.name;

  return {
    channelName: authorName || parsed?.feed?.title || null,
    videos: parseFeedEntries(parsed, channelId),
  };
}

async function resolveChannel(input) {
  const normalized = normalizeInput(input);
  if (!normalized) {
    throw new Error('Channel URL or ID is required');
  }

  if (isChannelId(normalized)) {
    return { channelId: normalized, channelName: null, channelThumbnail: null };
  }

  const directId = extractChannelIdFromUrl(normalized);
  if (directId) {
    return { channelId: directId, channelName: null, channelThumbnail: null };
  }

  const targetUrl = toChannelUrl(normalized);
  const { text, finalUrl } = await fetchText(targetUrl);
  const directFinalId = extractChannelIdFromUrl(finalUrl);
  const htmlMeta = extractChannelMetadataFromHtml(text);
  const channelId = directFinalId || htmlMeta.channelId;

  if (!channelId) {
    throw new Error('Could not resolve a YouTube channel ID from that input');
  }

  return {
    channelId,
    channelName: htmlMeta.channelName,
    channelThumbnail: htmlMeta.channelThumbnail,
  };
}

async function upsertVideos(userId, videos) {
  for (const video of videos) {
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
        video.channel_id,
        video.video_id,
        video.title,
        video.thumbnail,
        video.published_at,
        video.video_url,
      ]
    );
  }
}

router.get('/channels', async (req, res) => {
  try {
    const result = await db.pool.query(
      `
        SELECT id, channel_id, channel_name, channel_thumbnail, added_at
        FROM feeds_channels
        WHERE user_id = $1
        ORDER BY added_at DESC, channel_name ASC NULLS LAST
      `,
      [req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Failed to list feed channels:', error);
    res.status(500).json({ error: 'Failed to load subscribed channels' });
  }
});

router.post('/channels', async (req, res) => {
  const source = req.body?.url || req.body?.channel_id || req.body?.channelId;

  try {
    const resolved = await resolveChannel(source);
    const feed = await fetchFeed(resolved.channelId);
    const channelName = resolved.channelName || feed.channelName || resolved.channelId;

    const result = await db.pool.query(
      `
        INSERT INTO feeds_channels (user_id, channel_id, channel_name, channel_thumbnail)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, channel_id)
        DO UPDATE SET
          channel_name = COALESCE(EXCLUDED.channel_name, feeds_channels.channel_name),
          channel_thumbnail = COALESCE(EXCLUDED.channel_thumbnail, feeds_channels.channel_thumbnail)
        RETURNING id, channel_id, channel_name, channel_thumbnail, added_at
      `,
      [
        req.userId,
        resolved.channelId,
        channelName,
        resolved.channelThumbnail,
      ]
    );

    if (feed.videos.length > 0) {
      await upsertVideos(req.userId, feed.videos);
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Failed to add feed channel:', error);
    res.status(400).json({ error: error.message || 'Failed to add channel' });
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
      return res.status(404).json({ error: 'Channel not found' });
    }

    res.json({ success: true, channel_id: channelId });
  } catch (error) {
    console.error('Failed to delete feed channel:', error);
    res.status(500).json({ error: 'Failed to remove channel' });
  }
});

router.get('/videos', async (req, res) => {
  try {
    const channelsResult = await db.pool.query(
      `
        SELECT channel_id, channel_name, channel_thumbnail
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

    for (const channel of channels) {
      try {
        const feed = await fetchFeed(channel.channel_id);
        await upsertVideos(req.userId, feed.videos);

        if (feed.channelName && feed.channelName !== channel.channel_name) {
          await db.pool.query(
            'UPDATE feeds_channels SET channel_name = $3 WHERE user_id = $1 AND channel_id = $2',
            [req.userId, channel.channel_id, feed.channelName]
          );
          channel.channel_name = feed.channelName;
        }
      } catch (channelError) {
        console.error(`Failed to refresh feed ${channel.channel_id}:`, channelError.message);
      }
    }

    const videosResult = await db.pool.query(
      `
        SELECT
          fc.video_id,
          fc.channel_id,
          fc.title,
          fc.thumbnail,
          fc.published_at,
          fc.video_url,
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
      source: 'feed',
      type: 'url',
    }));

    res.json({ data, channels });
  } catch (error) {
    console.error('Failed to load feed videos:', error);
    res.status(500).json({ error: 'Failed to load feed videos' });
  }
});

module.exports = router;
