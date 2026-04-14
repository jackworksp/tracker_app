import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { resolveUrl, openUrl } from './linkUtils';

describe('linkUtils', () => {
  const originalOpen = window.open;

  beforeEach(() => {
    vi.restoreAllMocks();
    window.open = vi.fn();
    window.history.replaceState({}, '', 'https://seiyul.in/vela');
  });

  afterEach(() => {
    window.open = originalOpen;
  });

  it('normalizes upload paths under the current app prefix', () => {
    expect(resolveUrl('/uploads/file.pdf')).toBe('https://seiyul.in/vela/uploads/file.pdf');
    expect(resolveUrl('/trackapp/uploads/file.pdf')).toBe('https://seiyul.in/vela/uploads/file.pdf');
    expect(resolveUrl('/vela/uploads/file.pdf')).toBe('https://seiyul.in/vela/uploads/file.pdf');
  });

  it('preserves standard external links', () => {
    expect(resolveUrl('https://example.com/file.pdf')).toBe('https://example.com/file.pdf');
  });

  it('redirects instagram posts for desktop viewing', () => {
    expect(resolveUrl('https://www.instagram.com/reel/ABC123/?utm_source=ig_web_copy_link')).toBe('https://imginn.com/p/ABC123/');
  });

  it('opens the resolved url in a new tab', () => {
    openUrl('/uploads/file.pdf');
    expect(window.open).toHaveBeenCalledWith(
      'https://seiyul.in/vela/uploads/file.pdf',
      '_blank',
      'noopener,noreferrer'
    );
  });
});
