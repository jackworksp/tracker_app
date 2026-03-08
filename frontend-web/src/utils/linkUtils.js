/**
 * Resolves a URL for opening in browser.
 * Instagram reels/posts are redirected to imginn.com for desktop viewing
 * since instagram.com requires login and blocks embedded preview on desktop.
 */
export function resolveUrl(url) {
  if (!url) return url;

  try {
    const u = new URL(url);
    if (u.hostname === 'www.instagram.com' || u.hostname === 'instagram.com') {
      // Match /reel/CODE/ or /p/CODE/
      const match = u.pathname.match(/^\/(reel|p)\/([A-Za-z0-9_-]+)/);
      if (match) {
        const code = match[2];
        return `https://imginn.com/p/${code}/`;
      }
    }
  } catch {
    // not a valid URL, return as-is
  }

  return url;
}

export function openUrl(url) {
  window.open(resolveUrl(url), '_blank', 'noopener,noreferrer');
}
