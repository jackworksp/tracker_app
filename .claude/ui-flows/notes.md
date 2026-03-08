# Notes Section — UI Flow

**Main file:** `frontend-web/src/components/NotesPage.jsx`
**CSS:** `NotesPage.css`
**Receives props:** `subjectId`
**Rendered from:** Attachments tab (Notes sub-tab) and potentially standalone

---

## Layout

```
NotesPage
  ├── Left: <FolderSidebar> (200px wide)
  │     ├── "All Notes" item (no folder filter)
  │     ├── Folder list (hierarchical, collapsible)
  │     └── "New Folder" button at bottom
  │
  └── Right: main content
        ├── Search bar + sort dropdown + tag filter chips
        ├── Masonry note card grid (CSS Grid)
        │     ├── "New Note" card (always first)
        │     └── NoteCard for each note
        └── (when editing) NoteEditor overlays or replaces grid
```

---

## FolderSidebar — Interactions

**File:** `frontend-web/src/components/FolderSidebar.jsx`
**CSS:** `FolderSidebar.css`

```
FolderSidebar
  ├── Width: 200px, transparent item backgrounds, subtle active state
  ├── Click "All Notes" → selectedFolder = null → load all notes
  ├── Click folder → selectedFolder = folder.id → load notes in that folder
  ├── Click "New Folder" → inline input appears → create folder → api.noteFolders.create()
  ├── Right-click folder → context menu: Rename, Delete
  └── Drag note card onto folder → move note to that folder (if implemented)
```

**Style rules:**
- Items: `background: transparent` — NOT box-like
- Active item: `color: var(--nds-text-primary)` + `font-weight: medium` — NOT teal/loud
- Header: small uppercase letter-spacing, secondary color
- Width fixed at 200px (was 250px, reduced for less overwhelm)

---

## Note Card Grid

**Masonry layout:** CSS Grid `repeat(auto-fill, minmax(240px, 1fr))` + `align-items: start`
(NOT `column-count` — use CSS Grid for even bottom spacing)

```
NoteCard (file: NoteCard.jsx)
  ├── Click card body → setEditorNote(note), setShowEditor(true) → opens NoteEditor
  ├── Right-click → context menu: Pin, Move to folder, Delete
  ├── Pin icon → api.notes.update({ is_pinned: !note.is_pinned })
  │     └── Pinned notes sort first
  └── Swipe LEFT (BidirectionalSwipeCard) → delete note

"New Note" card (always first in grid)
  └── Click → setEditorNote(null), setShowEditor(true) → opens blank NoteEditor
```

---

## NoteEditor

**File:** `frontend-web/src/components/NoteEditor.jsx`

```
NoteEditor opens (showEditor = true)
  ├── Renders as overlay or replaces grid (isFullscreen toggle)
  ├── Title input (top)
  ├── Tag input (comma-separated, shown as Badge chips)
  ├── Content area (rich text or plain textarea)
  ├── Linked notes panel (shows notes linked via noteLinks)
  │     └── Click linked note → navigate to that note
  ├── Auto-save on blur / debounced
  ├── "Fullscreen" toggle → isFullscreen = true → takes full viewport
  ├── "Back" / close → setShowEditor(false) → return to grid
  └── Delete button → setDeleteTarget({ noteId, source: 'editor' })
        └── <DeleteConfirmModal> → confirm → api.notes.delete() → back to grid
```

---

## Search & Filter

```
Search input (top of grid)
  └── Filters notes client-side: title, content, tags

Sort dropdown:
  ├── Pinned first (default) — pinned notes at top, then newest
  ├── Newest first
  ├── Oldest first
  └── A-Z

Tag filter chips:
  └── Click tag chip → activeTag = tag → filters to notes with that tag
      Click again → activeTag = null → clear filter
```

---

## Notes Data Flow

```
On mount / folder change:
  loadNotes() → api.notes.getAll(folderId, subjectId)
  loadFolders() → api.noteFolders.getAll()

Create note:
  api.notes.create({ title, content, subject_id, tags, folder_id })

Update note:
  api.notes.update(id, { title, content, tags, is_pinned, folder_id })

Delete note:
  api.notes.delete(id) → remove from state

Move to folder:
  api.notes.move(id, folderId) → note.folder_id updated

Link notes together:
  api.noteLinks.create({ note_id, linked_note_id }) — bidirectional
  api.noteLinks.linkToTask(taskId, noteId)
  api.noteLinks.linkToSession(sessionId, noteId)
```

---

## Context Menu (right-click on note card)

```
contextMenu state = { x, y, note }
  ├── "Pin" / "Unpin" → api.notes.update({ is_pinned })
  ├── "Move to folder" → opens folder picker
  ├── "Copy" → api.notes.copy(id, folderId)
  └── "Delete" → setDeleteTarget → confirm modal
```

---

## Key Components

| Component | Purpose |
|-----------|---------|
| `NotesPage.jsx` | Main container, state management, grid |
| `NoteCard.jsx` | Individual note preview card in grid |
| `NoteEditor.jsx` | Full note editing UI |
| `FolderSidebar.jsx` | Folder tree navigation (left panel) |
| `AddNoteModal.jsx` | Quick note creation modal (used from Tasks) |
| `NoteSelectorModal.jsx` | Pick note to link to task/session |
| `DeleteConfirmModal.jsx` | Confirm before delete |

---

## Styling Notes

- Grid: `display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; align-items: start;`
- Do NOT use `column-count` — it causes uneven bottom spacing
- Note cards: `break-inside: avoid` not needed with CSS Grid
- "New Note" card: must have `align-self: start` or it stretches to fill grid row height
