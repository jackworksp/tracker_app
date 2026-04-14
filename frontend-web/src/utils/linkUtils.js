const CURRENT_APP_PREFIX = '/vela';
const LEGACY_APP_PREFIXES = ['/trackapp'];

function normalizeAppAssetPath(pathname) {
  if (!pathname?.startsWith('/')) return pathname;

  if (pathname.startsWith(`${CURRENT_APP_PREFIX}/uploads/`)) {
    return pathname;
  }

  if (pathname.startsWith('/uploads/')) {
    return `${CURRENT_APP_PREFIX}${pathname}`;
  }

  for (const legacyPrefix of LEGACY_APP_PREFIXES) {
    if (pathname.startsWith(`${legacyPrefix}/uploads/`)) {
      return `${CURRENT_APP_PREFIX}${pathname.slice(legacyPrefix.length)}`;
    }
  }

  return pathname;
}

function resolveRelativeUrl(url) {
  if (!url || typeof window === 'undefined') return url;

  try {
    const resolved = new URL(url, window.location.origin);
    resolved.pathname = normalizeAppAssetPath(resolved.pathname);
    return resolved.toString();
  } catch {
    return url;
  }
}

/**
 * Resolves a URL for opening in browser.
 * Instagram reels/posts are redirected to imginn.com for desktop viewing
 * since instagram.com requires login and blocks embedded preview on desktop.
 */
export function resolveUrl(url) {
  if (!url) return url;

  const normalizedUrl = resolveRelativeUrl(url);

  try {
    const u = new URL(normalizedUrl);
    if (u.hostname === 'www.instagram.com' || u.hostname === 'instagram.com') {
      const match = u.pathname.match(/^\/(reel|p)\/([A-Za-z0-9_-]+)/);
      if (match) {
        const code = match[2];
        return `https://imginn.com/p/${code}/`;
      }
    }
  } catch {
    return normalizedUrl;
  }

  return normalizedUrl;
}

export function openUrl(url) {
  const resolvedUrl = resolveUrl(url);
  if (!resolvedUrl) return;
  window.open(resolvedUrl, '_blank', 'noopener,noreferrer');
}
