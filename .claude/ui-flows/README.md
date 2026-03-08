# Vela UI Flow Documentation

This directory documents the complete UI interaction model for the Vela app.
Each file covers one feature area — read the relevant file before working on any component in that area.

## Index

| File | Covers |
|------|--------|
| [app-shell.md](app-shell.md) | App entry, auth flow, navigation, subject switching, share intent |
| [tasks.md](tasks.md) | Tasks tab — task list, swipe actions, task detail, notes on tasks |
| [attachments.md](attachments.md) | Attachments tab — card grid, swipe-to-delete, add note modal, add link modal |
| [notes.md](notes.md) | Notes section — folder sidebar, note cards, note editor, tags, search |
| [sessions.md](sessions.md) | Session tab — timeline, session cards, session detail modal, edit/delete |
| [profile.md](profile.md) | Profile tab — user settings, subjects, goals, stats |

## Golden Rules

1. **Always read the relevant flow doc before modifying any component.**
2. All URL opening: use `openUrl(url)` from `src/utils/linkUtils.js` — never `window.open()` directly.
3. Cards inside `BidirectionalSwipeCard`: always guard card `onClick` with `if (e.target.closest('button')) return;`.
4. Never use raw hex colors or hardcoded spacing — use `--nds-*` CSS variables.
5. All backend calls go through `src/api.js`.
