# Tasks Tab — UI Flow

**Main file:** `frontend-web/src/components/Tasks.jsx`
**CSS:** `Tasks.css`
**Receives props:** `subjectId`, `onLogTime`, `onAddTask`, `refreshKey`, `onSessionCreated`

---

## Task List Layout

```
Tasks
  ├── Header row: title + filter (goal filter dropdown) + "Add Task" button
  ├── Inline quick-add form (type selector + title + url/content fields)
  └── Task list: BidirectionalSwipeCard > task row (or SwipeableTaskCard on mobile)
```

---

## Task Types

| Type | Icon | Description |
|------|------|-------------|
| `TASK` | CheckSquare | General task |
| `WATCH` | Youtube | Video to watch |
| `READ` | BookOpen | Content to read |
| `NOTE` | StickyNote | Note/reference item |

---

## Task Row Interactions

```
Task row
  ├── Swipe RIGHT (via BidirectionalSwipeCard) → mark complete (green checkmark overlay)
  │     └── handleToggle() → api.tasks.update({completed: true})
  │           └── auto-creates study session (api.sessions.create) + calls onSessionCreated()
  │
  ├── Swipe LEFT → delete task (red trash overlay)
  │     └── handleDelete() → api.tasks.delete()
  │
  ├── Click checkbox (circle icon) → toggle complete (same as swipe right)
  │
  ├── Click task title/body → opens TaskDetailModal
  │     └── selectedTask = task → <TaskDetailModal> renders
  │
  ├── Click bell icon → opens ReminderPicker (inline, not a modal)
  │     └── Set reminder → notificationService.scheduleReminder()
  │
  ├── Click edit icon → opens TaskFormModal (edit mode)
  │     └── taskToEdit = task, isEditModalOpen = true → <TaskFormModal>
  │
  └── Click note icon → opens AddNoteModal
        └── isNoteModalOpen = true → <AddNoteModal>
              └── creates note and links it to task via api.noteLinks.linkToTask()
```

**IMPORTANT — Framer Motion event caveat:**
`BidirectionalSwipeCard` uses Framer Motion `drag`. Card `onClick` handlers MUST use:
```js
if (e.target.closest('button')) return;
```
Do NOT rely on `e.stopPropagation()` from child buttons — it won't work reliably here.

---

## Add Task Flow

```
"Add Task" button (header) → onAddTask prop → App.jsx opens <AddTaskModal>

AddTaskModal
  ├── Type selector (TASK / WATCH / READ / NOTE)
  ├── Title, URL (optional), Content (optional), Tags, Goal link, Priority
  ├── Note linking:
  │     ├── "Link existing note" → opens NoteSelectorModal
  │     └── "Create new note" → inline note fields
  └── Submit → handleAddTask() in App.jsx
        ├── api.tasks.create()
        ├── api.notes.create() + api.noteLinks.linkToTask() (if note was created)
        └── setTasksRefreshKey(prev + 1) → Tasks re-fetches
```

---

## TaskDetailModal

**File:** `TaskDetailModal.jsx`

```
Open: click task body row → selectedTask = task
  TaskDetailModal
    ├── Shows: title, type, URL (opens via openUrl()), content, tags, goal, priority, deadline
    ├── "Edit" button → closes detail, opens TaskFormModal
    ├── "Delete" button → api.tasks.delete() → reload tasks
    ├── "Log Time" button → onLogTime() → App opens AddSessionModal
    ├── Linked notes section:
    │     ├── Lists notes linked to this task
    │     ├── Click note → opens NoteEditor
    │     └── "Link Note" → opens NoteSelectorModal
    └── Attachments section:
          ├── Shows task.attachment_url (original URL field)
          └── "Add Attachment" → opens AddAttachmentModal
```

---

## Swipe Behavior Detail

- Swipe RIGHT threshold 120px → complete action (green)
- Swipe LEFT threshold 120px → delete action (red)
- Snap back if threshold not reached
- `disabled` prop on `BidirectionalSwipeCard` prevents swipe during edit mode

---

## Goal Filter

- Dropdown at top filters tasks by linked goal
- `goalFilter` state → passed to `api.tasks.getBySubject(subjectId, { goal_id })` or `api.tasks.getAll()`
- Clearing filter → shows all tasks for subject

---

## Share Intent Integration

When user shares a URL from another app (mobile):
```
initialShareData prop → pre-fills quick-add form
  ├── type = 'WATCH' if YouTube URL, else 'TASK'
  ├── title = parsed from shared text
  └── url = extracted URL
```

---

## Key Components Used

| Component | Purpose |
|-----------|---------|
| `BidirectionalSwipeCard` | Swipe gestures on each task row |
| `SwipeableTaskCard` | Mobile-specific swipe variant |
| `TaskDetailModal` | Full task detail view |
| `TaskFormModal` | Edit task form (modal) |
| `AddTaskModal` | Create new task (modal, opened from App.jsx) |
| `AddNoteModal` | Create note linked to task |
| `NoteSelectorModal` | Pick existing note to link |
| `ReminderPicker` | Inline date/time picker for notifications |
| `DeleteConfirmModal` | Confirm before delete |
