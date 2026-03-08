# Profile Tab — UI Flow

**Main files:**
- `frontend-web/src/components/ProfilePage.jsx` — user settings
- `frontend-web/src/components/GoalsPage.jsx` — goals management
- `frontend-web/src/components/GoalCard.jsx` — individual goal card
**Rendered from:** `App.jsx` tabContent['profile'] (inline JSX wrapping both)

---

## Layout

```
Profile tab (activeTab = 'profile')
  ├── <ProfilePage user={user} onUpdateUser={updateUser} onLogout={logout} />
  └── <GoalsPage onBack={() => setActiveTab('tasks')} />
```

Both components are rendered together in the profile tab — ProfilePage first, GoalsPage below.

---

## ProfilePage — Interactions

**File:** `ProfilePage.jsx`

```
ProfilePage
  ├── User avatar + name + email (display)
  ├── "Edit Profile" → inline form: name, email, password change
  │     └── Submit → api.auth.updateProfile() → updateUser() context
  │
  ├── Subjects section:
  │     ├── Active subject badge
  │     ├── "Create Subject" → <CreateSubjectModal>
  │     │     └── Submit → api.subjects.create() → loadSubjects()
  │     └── "Manage Subjects" → <ManageSubjectsModal>
  │           ├── Edit subject name → api.subjects.update()
  │           └── Delete subject → api.subjects.delete() (cascades all data)
  │
  ├── Appearance / Theme toggle:
  │     └── Toggle dark/light → sets data-theme="light" on root element
  │
  ├── Security settings → <SecuritySettings>
  │     └── App lock PIN setup / biometric
  │
  └── "Log Out" button → logout() → user = null → shows LandingPage
```

---

## GoalsPage — Interactions

**File:** `GoalsPage.jsx`
**State:** via `useGoals()` context (GoalsProvider wraps AppContent in App.jsx)

```
GoalsPage
  ├── Goals grid: <GoalCard> for each goal
  ├── "Add Goal" button → setAddModalVisible(true) → <AddGoalModal>
  │     ├── Goal name, description, target date, linked subject
  │     └── Submit → addGoal(goalData) → api.goals.create()
  │
  └── Each GoalCard:
        ├── Click → setDetailModalGoal(goal) → <GoalDetailModal>
        │     ├── Shows goal details + progress
        │     ├── "Edit" → setEditingGoal(goal) + setAddModalVisible(true) → <AddGoalModal> (edit mode)
        │     └── "Delete" → setDeleteConfirmVisible → <DeleteConfirmModal>
        │           └── confirmDelete() → deleteGoal(id) → api.goals.delete()
        │
        ├── Edit icon → handleEditGoal(goal) → opens AddGoalModal pre-filled
        └── Delete icon → handleDeleteGoal(goalId) → opens DeleteConfirmModal
```

---

## GoalCard

**File:** `GoalCard.jsx`

```
GoalCard
  ├── Goal name (title)
  ├── Progress bar (if target set)
  ├── Target date badge
  ├── Linked subject badge
  ├── Edit icon button
  └── Delete icon button
```

---

## Goals Context

Goals are managed via `GoalsContext` (not local state):

```js
// In any component:
import { useGoals } from '../contexts/GoalsContext';
const { goals, loading, addGoal, updateGoal, deleteGoal } = useGoals();
```

- Goals load on mount and after auth
- Available app-wide — Tasks tab uses goals for the goal filter dropdown
- `GoalsProvider` wraps `AppContent` in `App.jsx`

---

## Stats / Overview

```
Profile tab also shows:
  ├── <StatsGrid> — summary stats (total sessions, hours, tasks completed)
  ├── <OverviewCards> — subject overview cards
  └── <Dashboard> — charts / activity breakdown (if implemented)
```

---

## Subject Flow (detailed)

```
User selects subject from Header dropdown (top of app)
  └── handleSubjectChange(subject) → currentSubject = subject
        └── All tabs re-render with new subjectId:
              Tasks.loadTasksBySubject(subjectId)
              AttachmentsHub loads attachments for subjectId
              NotesPage loads notes for subjectId

Create new subject:
  CreateSubjectModal → api.subjects.create({ name, color })
  → loadSubjects() → new subject appears in Header dropdown

Delete subject (from ManageSubjectsModal):
  api.subjects.delete(id) → cascades: topics, sessions, tasks, notes all deleted
  → loadSubjects() → if deleted was current, switch to first remaining subject
```

---

## AppLock / Security

**File:** `AppLock.jsx`, `SecuritySettings.jsx`

```
AppLock
  └── If PIN set and app resumed from background → shows PIN entry screen
        └── Correct PIN → dismiss lock screen, resume app
        └── Biometric (Capacitor plugin) → dismiss on success

SecuritySettings (inside ProfilePage)
  ├── Enable/disable app lock
  ├── Set/change PIN
  └── Toggle biometric authentication
```

---

## Key Components

| Component | Purpose |
|-----------|---------|
| `ProfilePage.jsx` | User info, subject management, logout |
| `GoalsPage.jsx` | Goals list with add/edit/delete |
| `GoalCard.jsx` | Single goal display card |
| `GoalDetailModal.jsx` | Full goal detail view |
| `AddGoalModal.jsx` | Create / edit goal form |
| `CreateSubjectModal.jsx` | Create new subject |
| `ManageSubjectsModal.jsx` | Edit/delete existing subjects |
| `StatsGrid.jsx` | Summary stats display |
| `OverviewCards.jsx` | Per-subject overview cards |
| `SecuritySettings.jsx` | PIN / biometric settings |
| `AppLock.jsx` | Lock screen overlay |
| `DeleteConfirmModal.jsx` | Reusable delete confirmation |
