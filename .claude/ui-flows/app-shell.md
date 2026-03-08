# App Shell — UI Flow

**File:** `frontend-web/src/App.jsx`
**Entry point** for the entire app. Controls auth state, navigation, subject context, and global modals.

---

## Auth Flow (unauthenticated user)

```
App loads
  └── isCheckingAuth = true → show spinner "Verifying account..."
  └── isCheckingAuth = false, no user:
        authView = 'landing' → <LandingPage>
          ├── "Get Started" button → authView = 'signup' → <AuthPage mode=signup>
          └── "Sign In" button   → authView = 'login'  → <AuthPage mode=login>
        <AuthPage>
          ├── Successful login  → user set → App re-renders → main app shell
          └── "Back" button     → authView = 'landing'
```

**Components:**
- `LandingPage.jsx` — public marketing page, two CTAs
- `AuthPage.jsx` — wraps `LoginForm.jsx` and `SignupForm.jsx`
- `LoginModal.jsx` / `SignupModal.jsx` — modal variants (used in some contexts)

---

## Main App Shell (authenticated)

```
App (authenticated)
  ├── Desktop: <Sidebar> (left rail, always visible)
  │     ├── Tasks         → activeTab = 'tasks'
  │     ├── Attachments   → activeTab = 'attachments'
  │     ├── Session       → activeTab = 'timeline'
  │     ├── Search        → activeTab = 'search'
  │     └── Profile icon  → activeTab = 'profile'
  │
  ├── Mobile: <BottomNav> (fixed bottom bar)
  │     └── Same tabs, icon-only
  │
  └── Main content area → renders tabContent[activeTab]
```

**Tab → Component mapping (`tabContent` object in App.jsx):**

| Tab key | Component | Notes |
|---------|-----------|-------|
| `tasks` | `<Tasks>` | receives `subjectId`, `onLogTime`, `onAddTask`, `refreshKey`, `onSessionCreated` |
| `timeline` | `<Timeline>` | receives sessions array from `useProgress` hook |
| `attachments` | `<AttachmentsHub>` | receives `subjectId` |
| `search` | `<SearchPage>` | receives `onNavigate` to switch tabs |
| `profile` | Inline JSX | renders `<ProfilePage>` + goals section + `<GoalsPage>` |

**Adding a new tab:** update both `tabContent` object AND `<Sidebar>` / `<BottomNav>` items.

---

## Subject Switching

- `currentSubject` is held in `useSubjects` hook, loaded on auth
- Subject switcher is in `<Header>` — changing subject calls `handleSubjectChange`
- All page components (`Tasks`, `AttachmentsHub`, `NotesPage`) receive `subjectId` as a prop and re-fetch when it changes
- Creating a new subject: `<CreateSubjectModal>` → `handleCreateSubject` → `loadSubjects()`
- Managing subjects: `<ManageSubjectsModal>` → edit/delete subjects

---

## Global Modals (managed by `useModals` hook)

| Modal key | Component | Trigger |
|-----------|-----------|---------|
| `addSession` | `<AddSessionModal>` | "Log Session" from Tasks or Timeline header |
| `editSession` | `<EditSessionModal>` | Edit button inside `SessionDetailModal` |
| `addTask` | `<AddTaskModal>` | "Add Task" button in Tasks, or share intent |
| `shareConfirm` | `<ShareConfirmModal>` | Android share intent received |

---

## Share Intent Flow (Mobile/Capacitor only)

```
User shares URL from another app (YouTube, Instagram, etc.)
  └── CapacitorShareTarget fires 'shareReceived' event
        └── App parses URL, title, detects if YouTube
        └── setShareData(data) → opens <ShareConfirmModal>
              ├── "Add to Session" → openModal('addSession') with pre-filled data
              ├── "Add as Task"    → setActiveTab('tasks') + openModal('addTask') with pre-filled data
              └── "Add to Attachments" → api.attachmentsApi.create() → setActiveTab('attachments')
```

---

## Error & Loading States

- `isCheckingAuth` → full-screen spinner
- `loading` (subjects loading) → full-screen spinner "Loading Vela..."
- `error` → full-screen error panel with debug info + "Retry Connection" button

---

## State Architecture

- **Global state in App.jsx:** `activeTab`, `selectedSession`, `tasksRefreshKey`, `authView`
- **Hooks:** `useUser`, `useGoals` (Context), `useSubjects`, `useProgress`, `useModals`
- **No Redux/Zustand** — prop drilling to child components
- `GoalsProvider` wraps `AppContent` so `useGoals()` is available everywhere
