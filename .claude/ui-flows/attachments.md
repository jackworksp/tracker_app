# Attachments Tab — UI Flow

**Main file:** `frontend-web/src/components/AttachmentsHub.jsx`
**CSS:** `AttachmentsHub.css`
**Receives props:** `subjectId`

---

## Layout

```
AttachmentsHub
  ├── Sticky header
  │     ├── Title ("Attachments" + paperclip icon)
  │     ├── Sub-tab switcher: [Overview] [Notes]
  │     ├── "Add Link" button (overview tab only)
  │     └── Attachment count badge
  │
  ├── activeTab = 'overview' → attachment card grid
  └── activeTab = 'notes'    → embedded <NotesPage subjectId={subjectId}>
```

---

## Overview Grid

Cards are rendered as: `BidirectionalSwipeCard > AttachmentCard`

```
Grid (CSS masonry — repeat(auto-fill, minmax(280px, 1fr)))
  └── For each attachment:
        BidirectionalSwipeCard
          └── AttachmentCard
```

---

## AttachmentCard — Types & Rendering

**File:** `frontend-web/src/components/AttachmentCard.jsx`
**CSS:** `AttachmentCard.css`

| `attachment.type` | Rendering |
|-------------------|-----------|
| `url` + YouTube URL | Edge-to-edge thumbnail image (mqdefault.jpg from YouTube) + play overlay on hover |
| `url` + Instagram URL | Edge-to-edge gradient placeholder (purple→red→orange) + Instagram icon |
| `url` + plain link | Link icon + truncated URL text |
| `note` | FileText icon + note content preview + tags |

---

## AttachmentCard — Interactions

```
Card body click → handleCardClick(e)
  ├── Guard: if (e.target.closest('button')) return;   ← NEVER remove this
  ├── type = 'note' → onViewNote(attachment.note_data) → switch to Notes tab
  └── type = 'url'  → onOpenUrl(attachment.url) → openUrl() → window.open(resolveUrl(url))

Hover on card → reveals:
  ├── Delete button (top-right, red) → onDelete(attachment.id) → confirm → api.attachments.delete()
  └── Footer action buttons become visible

Footer buttons (always present, not hover-only):
  ├── StickyNote icon → onAddNote(attachment) → opens Add Note modal (see below)
  ├── ExternalLink icon (URL cards only) → onOpenUrl(attachment.url)
  └── Source badge (Task/Session label):
        └── click → onNavigateToSource(source, sourceId) → currently shows info toast

Swipe RIGHT (via BidirectionalSwipeCard) → delete attachment
  └── onSwipeRight → handleDelete(attachment.id)
```

**CRITICAL — Framer Motion event caveat:**
`BidirectionalSwipeCard` uses Framer Motion `drag="x"` + `whileTap`. Native pointer events fire independently of React synthetic events.
- `e.stopPropagation()` on child buttons does NOT reliably prevent `handleCardClick` from firing.
- The `if (e.target.closest('button')) return;` guard in `handleCardClick` is the correct fix.
- **Never remove this guard. Never rely on child `stopPropagation()` alone.**

---

## Add Link Modal

**File:** `frontend-web/src/components/AddFileLinkModal.jsx`

```
"Add Link" button → isAddLinkModalOpen = true → <AddFileLinkModal>
  ├── URL input (required) — auto-detects YouTube / Instagram / generic
  ├── Title input (optional, defaults to URL)
  └── Submit → api.attachments.create({ title, url, subject_id, platform })
        └── onLinkAdded() → loadAttachments() → grid refreshes
```

---

## Add Note Modal (from card)

```
StickyNote icon button on card → handleOpenAddNote(attachment)
  └── Pre-fills title: "Notes on: [attachment.title]"
  └── noteModal state set → inline modal renders (inside AttachmentsHub, not a portal)

Add Note Modal (inline JSX in AttachmentsHub):
  ├── Title input (pre-filled, editable)
  ├── Content textarea
  ├── Cancel → setNoteModal(null)
  └── "Save Note" → handleSaveNote()
        └── api.notes.create({ title, content, subject_id, tags: [] })
              └── message.success → modal closes
              (note appears in Notes tab)
```

---

## Attachment Data Structure

```js
{
  id: "task-123" | "session-456" | "standalone-789",  // composite ID
  type: "url" | "note",
  source: "task" | "session" | "standalone",
  source_id: number,          // task ID or session ID
  title: string,
  url: string | null,
  note_data: {                // only if type = 'note'
    id: number,
    title: string,
    content: string,
    tags: string[]
  },
  subject_id: number,
  subject_name: string,
  created_at: string,
  metadata: object
}
```

---

## Attachment Sources

Attachments are aggregated from 5 sources via SQL UNION:
1. `tasks.attachment_url` — URL field on tasks
2. `tasks.url` — content URL field on tasks
3. `study_sessions.url` — URL logged with sessions
4. `note_tasks` — notes linked to tasks
5. `note_sessions` — notes linked to sessions

---

## URL Opening Rule

**ALL URL opening in this component goes through `linkUtils.js`:**
```js
import { openUrl } from '../utils/linkUtils';
openUrl(url); // resolves Instagram → imginn.com, then window.open()
```
Never use `window.open(url)` directly.

---

## Key CSS Classes

| Class | Purpose |
|-------|---------|
| `.attachment-card` | Card wrapper, `position: relative`, no border |
| `.attachment-card::after` | Inset border overlay (2px solid, z-index 10) — renders over media |
| `.attachment-media` | Edge-to-edge top media, `border-radius: 10px 10px 0 0`, `overflow: hidden` |
| `.attachment-media--instagram` | Instagram gradient placeholder |
| `.attachment-card-body` | Padded content below media |
| `.attachment-delete-btn` | `opacity: 0`, shown via `.attachment-card:hover` |
| `.note-modal-backdrop` | Fixed full-screen overlay, `z-index: 1000` |
