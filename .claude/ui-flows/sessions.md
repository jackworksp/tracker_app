# Session Tab — UI Flow

**Main files:**
- `frontend-web/src/components/Timeline.jsx` — session list
- `frontend-web/src/components/Timesheet.jsx` — time/stats view
- `frontend-web/src/components/SessionDetailModal.jsx` — session detail
**CSS:** `Timeline.css`, `Timesheet.css`

---

## Layout

```
Session tab (activeTab = 'timeline')
  └── <div className="timeline-wrapper">
        └── <Timeline
              sessions={progress.sessions}   // from useProgress hook in App.jsx
              onUpdate={refreshProgress}
              onAddSession={() => openModal('addSession')}
              onEdit={handleEditSession}
              onDelete={handleDeleteSession}
              onRevise={handleReviseSession}
              onSessionClick={setSelectedSession}
            />
```

Sessions data is fetched by `useProgress` hook in App.jsx, not by Timeline itself.
Timeline is a **display component** — it receives pre-fetched sessions as props.

---

## Timeline — Interactions

```
Timeline
  ├── Header: "Sessions" title + "Add Session" button
  │     └── "Add Session" → onAddSession() → App opens <AddSessionModal>
  │
  ├── Session list (chronological, newest first)
  │     └── Each session row:
  │           ├── Click → onSessionClick(session) → selectedSession set in App.jsx
  │           │     └── <SessionDetailModal> opens
  │           ├── Edit icon → onEdit(session) → App opens <EditSessionModal>
  │           ├── Delete icon → onDelete(sessionId) → confirm → api.sessions.delete()
  │           └── Revise icon → onRevise(sessionId) → api.sessions.incrementRevision()
  │
  └── (Optional) Timesheet view toggle — shows hours grid / weekly breakdown
```

---

## SessionDetailModal

**File:** `SessionDetailModal.jsx`

```
Open: onSessionClick(session) → selectedSession = session in App.jsx
  └── <SessionDetailModal session={selectedSession} onClose={() => setSelectedSession(null)}>

SessionDetailModal
  ├── Header: session date, type badge, duration
  ├── Activity: session.activity (title of what was studied)
  ├── URL field (if session.url):
  │     └── Click → window.open(resolveUrl(session.url), '_blank')  ← uses resolveUrl()
  ├── Notes field: session.notes text
  ├── Topics covered: session.topics_covered
  ├── Revision count badge
  ├── Linked notes section:
  │     ├── Lists notes linked via note_sessions table
  │     ├── Click note → opens NoteEditor
  │     └── "Link Note" button → opens NoteSelectorModal
  ├── Attachments section:
  │     └── "Add Attachment" → opens AddSessionAttachmentModal
  ├── "Edit Session" button → onEdit(session) → App opens EditSessionModal
  └── "Delete Session" button → onDelete(session.id) → modal closes
```

**URL Opening Rule:** ALL URLs in SessionDetailModal use `resolveUrl()` from `linkUtils.js`:
```js
import { resolveUrl } from '../utils/linkUtils';
window.open(resolveUrl(session.url), '_blank', 'noopener,noreferrer');
```

---

## Add Session Modal

**File:** `AddSessionModal.jsx`

```
"Add Session" button → App.jsx openModal('addSession') → <AddSessionModal>
  ├── Subject (defaults to currentSubject)
  ├── Activity type: Study / Watch / Read / Practice / Notes / Listen
  ├── Activity title
  ├── URL (optional) — for YouTube, Instagram, etc.
  ├── Time spent (hours/minutes slider or input)
  ├── Date picker
  ├── Topics covered (comma-separated)
  ├── Notes textarea
  └── Submit → handleAddSession() → api.sessions.create() → refreshProgress()
```

Pre-filling from share intent:
```js
sessionInitialData = { activity, url, notes }
// Passed as prop, pre-fills corresponding fields
```

---

## Edit Session Modal

**File:** `EditSessionModal.jsx`

```
Edit icon on session → handleEditSession(session) → openModal('editSession', { editingSession: session })
  └── <EditSessionModal session={modalState.editingSession}>
        ├── Same fields as AddSessionModal, pre-filled
        └── Submit → handleUpdateSession() → api.sessions.update(id, data) → refreshProgress()
```

---

## Session Data Structure

```js
{
  id: number,
  subject_id: number,
  type: 'STUDY' | 'WATCH' | 'READ' | 'PRACTICE' | 'NOTES' | 'LISTEN',
  activity: string,          // what was studied
  url: string | null,        // resource URL
  time_spent: number,        // minutes
  date: string,              // YYYY-MM-DD
  day: string,               // 'Monday', 'Tuesday', etc.
  topics_covered: string,    // comma-separated
  notes: string,
  revision_count: number,
  created_at: string
}
```

---

## Auto-Session Creation (from Tasks)

When a task is completed (swipe right or checkbox click):
```
Tasks.handleToggle(task) → task.completed = true
  └── api.sessions.create({
        subject_id: subjectId,
        type: task.type === 'WATCH' ? 'WATCH' : 'STUDY',
        activity: task.title,
        url: task.url,
        time_spent: 15-60 mins (defaults by type),
        date: today,
        notes: `Completed: ${task.title}`
      })
  └── onSessionCreated() → refreshProgress() in App.jsx
```

---

## Key Components

| Component | Purpose |
|-----------|---------|
| `Timeline.jsx` | Session list display, triggers for edit/delete/add |
| `Timesheet.jsx` | Time grid / weekly stats view |
| `SessionDetailModal.jsx` | Full session detail with linked notes & attachments |
| `AddSessionModal.jsx` | Create new session |
| `EditSessionModal.jsx` | Edit existing session |
| `AddSessionAttachmentModal.jsx` | Add attachment to session |
| `AddRevisionModal.jsx` | Add revision item to session |
| `SessionsGraphModal.jsx` | Visual graph of session history |
