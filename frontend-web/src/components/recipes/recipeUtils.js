// Detect a recipe's source platform from its URL.
export function detectSource(url) {
  if (!url) return 'written';
  const u = url.toLowerCase();
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  if (u.includes('instagram.com')) return 'instagram';
  if (u.includes('tiktok.com')) return 'tiktok';
  return 'link';
}

// Extract YouTube video ID from various URL shapes (watch, youtu.be, shorts, embed).
export function getYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

// Best-effort thumbnail: stored thumbnail_url > YouTube thumbnail > null.
export function getThumbnail(recipe) {
  if (recipe.thumbnail_url) return recipe.thumbnail_url;
  const yt = getYouTubeId(recipe.source_url);
  if (yt) return `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`;
  return null;
}

export const SEED_CATEGORIES = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snacks',
  'Desserts',
  'Drinks',
  'Quick',
  'Vegetarian',
  'Non-Veg',
];

export const COOK_TIME_PRESETS = [15, 30, 45, 60, 90];

// Fetch oEmbed metadata (title, thumbnail) for a YouTube URL.
export async function fetchYouTubeMeta(url) {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return {
      title: data.title || null,
      thumbnail: data.thumbnail_url || null,
    };
  } catch {
    return null;
  }
}

export const SOURCE_LABEL = {
  youtube: 'YouTube',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  link: 'Link',
  written: 'Written',
};
