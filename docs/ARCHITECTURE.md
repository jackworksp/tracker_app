# Vela Architecture Overview

**Version:** 1.0
**Last Updated:** 2026-02-21
**Target Audience:** Developers, Architects, Tech Leads

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Diagrams](#architecture-diagrams)
4. [Backend Architecture](#backend-architecture)
5. [Frontend Architecture](#frontend-architecture)
6. [Database Architecture](#database-architecture)
7. [Security Architecture](#security-architecture)
8. [Mobile Architecture](#mobile-architecture)
9. [Deployment Architecture](#deployment-architecture)
10. [Key Design Patterns](#key-design-patterns)
11. [API Design Conventions](#api-design-conventions)
12. [Performance Considerations](#performance-considerations)

---

## System Overview

### High-Level Architecture

Vela is a full-stack personal learning management system built as a monorepo with three primary components:

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
├─────────────────────────────────────────────────────────────────┤
│  Web Application (React)     │    Mobile App (Capacitor)        │
│  - Vite bundler               │    - Android native              │
│  - Custom design system       │    - Share target integration    │
│  - Context-based state mgmt   │    - Camera, file system APIs    │
└──────────────────┬─────────────────────────────┬────────────────┘
                   │                             │
                   │         HTTPS/REST          │
                   │                             │
┌──────────────────┴─────────────────────────────┴────────────────┐
│                      Application Layer                          │
├─────────────────────────────────────────────────────────────────┤
│  Express.js Server (Node.js 20+)                                │
│  - JWT Authentication Middleware                                │
│  - Rate Limiting (Auth: 5/15min, API: 3000/15min)              │
│  - CORS Configuration                                           │
│  - RESTful API Routes                                           │
│  - Static File Serving                                          │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   │     PostgreSQL Protocol (SSL)
                   │
┌──────────────────┴──────────────────────────────────────────────┐
│                       Data Layer                                │
├─────────────────────────────────────────────────────────────────┤
│  Neon PostgreSQL (Serverless)                                   │
│  - 13 core tables + 4 junction tables                           │
│  - Foreign key constraints with CASCADE                         │
│  - Indexes for performance optimization                         │
│  - Auto-initialization on startup                               │
└─────────────────────────────────────────────────────────────────┘
```

### Deployment Model

- **Subpath Hosting:** All routes are served under `/vela/` prefix
- **Web Base Path:** `/vela/` for production web deployment
- **Mobile Base Path:** `./` (relative) for Capacitor file:// protocol
- **Container:** Docker multi-stage build (frontend + backend)
- **Database:** Neon PostgreSQL (serverless, free tier)

### Key Design Decisions

1. **Monolithic Backend:** Single Express.js server handles all API routes and serves static frontend
2. **No Global State Library:** Uses React Context + local state instead of Redux/Zustand for simplicity
3. **Raw SQL:** Direct PostgreSQL queries via `pg` library instead of ORM for fine-grained control
4. **Custom Design System:** Notion-inspired UI with CSS variables, avoiding heavy UI libraries
5. **JWT Authentication:** Stateless auth with 7-day token expiry
6. **Subpath Routing:** All routes prefixed with `/vela/` for flexible deployment
7. **Auto-Migration:** Database schema auto-initializes and migrates on server startup

---

## Technology Stack

### Backend Technologies

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Runtime** | Node.js | 20+ | JavaScript runtime environment |
| **Framework** | Express.js | ^4.18.0 | Web application framework |
| **Database** | PostgreSQL | 15+ (Neon) | Relational database |
| **DB Client** | pg (node-postgres) | ^8.11.0 | PostgreSQL client for Node.js |
| **Authentication** | JWT (jsonwebtoken) | ^9.0.0 | Token-based authentication |
| **Password Hashing** | bcryptjs | ^2.4.3 | Secure password hashing |
| **Security** | express-rate-limit | ^6.7.0 | API rate limiting |
| **CORS** | cors | ^2.8.5 | Cross-origin resource sharing |
| **File Upload** | multer | ^1.4.5-lts.1 | Multipart form data handling |
| **Web Scraping** | puppeteer | ^21.0.0 | Instagram content scraping |
| **Config Management** | AWS SSM SDK | ^3.x | Parameter Store integration |
| **Environment** | dotenv | ^16.0.0 | Environment variable loading |

### Frontend Technologies

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | React | 19 | UI library |
| **Build Tool** | Vite | 5 | Fast bundler and dev server |
| **UI System** | Custom Design System | - | Notion-inspired components |
| **Mobile Bridge** | Capacitor | 8 | Native mobile integration |
| **Styling** | CSS Variables | - | Design tokens and theming |
| **Icons** | Lucide React, React Icons | - | Icon libraries |
| **Animations** | Framer Motion | - | UI animations |
| **Testing** | Vitest + React Testing Library | - | Unit and component testing |
| **Legacy UI** | Ant Design | ^5.11.0 | Partial (being phased out) |

### DevOps Technologies

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Containerization** | Docker | Multi-stage builds |
| **CI/CD** | GitHub Actions | Automated deployment pipeline |
| **Cloud** | AWS (SSM Parameter Store) | Secure config management |
| **Database Host** | Neon | Serverless PostgreSQL |

---

## Architecture Diagrams

### Request Flow Diagram

```
┌──────────────┐
│   Browser    │
│   /Mobile    │
└──────┬───────┘
       │
       │ 1. HTTP(S) Request
       │ GET /vela/api/subjects
       │ Authorization: Bearer <token>
       │
       ▼
┌──────────────────────────────────────────┐
│         Express.js Server                 │
│  ┌────────────────────────────────────┐  │
│  │  1. CORS Middleware                │  │
│  └────────────┬───────────────────────┘  │
│               │                           │
│  ┌────────────▼───────────────────────┐  │
│  │  2. Request Logging                │  │
│  └────────────┬───────────────────────┘  │
│               │                           │
│  ┌────────────▼───────────────────────┐  │
│  │  3. Rate Limiter                   │  │
│  │     - Auth: 5 req/15min            │  │
│  │     - API: 3000 req/15min          │  │
│  └────────────┬───────────────────────┘  │
│               │                           │
│  ┌────────────▼───────────────────────┐  │
│  │  4. Route Handler                  │  │
│  │     /vela/api/subjects -> router   │  │
│  └────────────┬───────────────────────┘  │
│               │                           │
│  ┌────────────▼───────────────────────┐  │
│  │  5. JWT Auth Middleware            │  │
│  │     - Extract Bearer token         │  │
│  │     - Verify with JWT_SECRET       │  │
│  │     - Attach req.userId            │  │
│  └────────────┬───────────────────────┘  │
│               │                           │
│  ┌────────────▼───────────────────────┐  │
│  │  6. Route Logic                    │  │
│  │     - Validate input               │  │
│  │     - Execute DB queries           │  │
│  │     - Format response              │  │
│  └────────────┬───────────────────────┘  │
└───────────────┼────────────────────────┘
                │
                │ SQL Query (Parameterized)
                ▼
┌─────────────────────────────────────────┐
│        Neon PostgreSQL                  │
│  - Execute query with user_id filter   │
│  - Return result rows                   │
└────────────────┬────────────────────────┘
                 │
                 │ JSON Response
                 ▼
┌──────────────────────────────────────────┐
│  Response to Client                      │
│  {                                       │
│    "data": [...],                        │
│    "pagination": {...}                   │
│  }                                       │
└──────────────────────────────────────────┘
```

### Data Flow: Session Creation

```
┌──────────────┐
│   Frontend   │
└──────┬───────┘
       │
       │ POST /vela/api/progress/sessions
       │ {
       │   subject_id: 1,
       │   activity: "Study EC2",
       │   time_spent: 60,
       │   topics_covered: "Launch, Instances",
       │   url: "https://youtube.com/...",
       │   type: "WATCH"
       │ }
       │
       ▼
┌──────────────────────────────────────────┐
│  Backend: progress.js route              │
│  1. Validate subject_id exists           │
│  2. Insert into study_sessions table     │
│  3. Update subject timestamps            │
└──────┬───────────────────────────────────┘
       │
       │ INSERT INTO study_sessions
       │ (subject_id, date, activity, ...)
       │
       ▼
┌──────────────────────────────────────────┐
│  PostgreSQL: study_sessions table        │
│  ┌────────────────────────────────────┐  │
│  │ id: 42                             │  │
│  │ subject_id: 1 (FK -> subjects)     │  │
│  │ user_id: 5 (implicit via subject)  │  │
│  │ date: 2026-02-21                   │  │
│  │ activity: "Study EC2"              │  │
│  │ time_spent: 60                     │  │
│  │ topics_covered: "Launch, Instances"│  │
│  │ url: "https://youtube.com/..."     │  │
│  │ type: "WATCH"                      │  │
│  │ revision_count: 0                  │  │
│  │ folder_id: NULL                    │  │
│  │ goal_id: NULL                      │  │
│  └────────────────────────────────────┘  │
└──────┬───────────────────────────────────┘
       │
       │ RETURNING *
       │
       ▼
┌──────────────────────────────────────────┐
│  Backend: Return session object          │
│  Status: 201 Created                     │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│  Frontend: Update UI                     │
│  - Refresh timeline                      │
│  - Update stats (total time)             │
│  - Show success message                  │
└──────────────────────────────────────────┘
```

---

## Backend Architecture

### Server Initialization Flow

```javascript
// backend/server.js startup sequence

1. Load Environment Variables
   - dotenv.config() from .env file

2. Load Configuration (async)
   - aws-config.js: Load DATABASE_URL from AWS SSM or .env
   - Priority: AWS Parameter Store → .env file

3. Initialize Database
   - database.js: Test connection
   - initDB(): Create/migrate all tables
   - 13 core tables + 4 junction tables
   - Add indexes and constraints

4. Create Express App
   - Apply middleware: CORS, JSON parser, request logging
   - Configure rate limiters (auth & API)

5. Mount Routes
   - /vela/api/auth -> auth.js
   - /vela/api/subjects -> subjects.js
   - /vela/api/progress -> progress.js
   - /vela/api/tasks -> tasks.js
   - /vela/api/goals -> goals.js
   - /vela/api/journal -> journal.js
   - /vela/api/notes -> notes.js
   - /vela/api/note-folders -> note-folders.js
   - /vela/api/note-links -> note-links.js
   - /vela/api/attachments -> attachments.js
   - /vela/api/attachment-folders -> attachment-folders.js
   - /vela/api/scrape -> scraper.js

6. Serve Static Assets
   - /vela/uploads -> backend/uploads (file uploads)
   - /vela/* -> frontend-web/dist (React SPA)
   - /vela/app-release.apk -> mobile/app-release.apk

7. Health Check Endpoint
   - GET /vela/health -> Server status

8. Start HTTP Server
   - Listen on PORT (default: 3000)
   - Bind to 0.0.0.0 for container access
```

### Middleware Stack

The middleware stack processes requests in this order:

```javascript
// 1. Global Middleware (all requests)
app.use(cors({
  origin: true,           // Allow all origins (dev mode)
  credentials: true
}));

app.use(express.json()); // Parse JSON bodies

app.use((req, res, next) => {
  // Request logging
  console.log(`[${timestamp}] ${method} ${url} from ${ip}`);
  next();
});

// 2. Rate Limiters (mounted under /vela)
appRouter.use('/api/auth/login', authLimiter);   // 5 req/15min
appRouter.use('/api/auth/signup', authLimiter);  // 5 req/15min
appRouter.use('/api', apiLimiter);               // 3000 req/15min

// 3. Route-Level Middleware
// Most routes apply authenticateToken middleware:
router.use(authenticateToken);  // JWT verification

// 4. Route Handler (business logic)
router.get('/subjects', async (req, res) => {
  const userId = req.userId; // Set by authenticateToken
  // ... database query
});
```

### Route Organization

Each route file follows this pattern:

```javascript
// backend/routes/tasks.js (example)

const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

// Apply auth middleware to all routes in this router
router.use(authenticateToken);

// GET /api/tasks (global tasks)
router.get('/', async (req, res) => {
  // req.userId is available from auth middleware
  const { page = 1, limit = 50, goal_id } = req.query;

  const result = await db.query(
    `SELECT * FROM tasks
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [req.userId, limit, (page - 1) * limit]
  );

  res.json({
    data: result.rows,
    pagination: { page, limit, total, totalPages }
  });
});

// POST /api/tasks (create task)
router.post('/', async (req, res) => {
  const { subject_id, title, type, url, content } = req.body;

  // Validation
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  // Insert with parameterized query
  const result = await db.query(
    `INSERT INTO tasks (user_id, subject_id, title, type, url, content)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [req.userId, subject_id, title, type, url, content]
  );

  res.status(201).json(result.rows[0]);
});

module.exports = router;
```

### Authentication Flow

```
┌──────────────────────────────────────────────────────────────┐
│  1. User Login                                                │
│  POST /vela/api/auth/login                                    │
│  { email: "user@example.com", password: "secret123" }        │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  2. Backend: auth.js route handler                            │
│  - Validate input (email format, password length)             │
│  - Query database for user by email (user_id)                 │
│  - Compare bcrypt hash: bcrypt.compare(password, hash)        │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  3. Generate JWT Token                                        │
│  const token = jwt.sign(                                      │
│    { userId: user.id },                                       │
│    JWT_SECRET,                                                │
│    { expiresIn: '7d' }                                        │
│  );                                                           │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  4. Response to Client                                        │
│  {                                                            │
│    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",       │
│    "user": {                                                  │
│      "id": 5,                                                 │
│      "email": "user@example.com",                             │
│      "name": "John Doe",                                      │
│      "active_subject_id": 1                                   │
│    }                                                          │
│  }                                                            │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  5. Frontend: Store token in localStorage                     │
│  localStorage.setItem('authToken', token);                    │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  6. Subsequent API Requests                                   │
│  GET /vela/api/subjects                                       │
│  Headers: {                                                   │
│    Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI..."    │
│  }                                                            │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  7. Backend: authenticateToken middleware                     │
│  - Extract token from Authorization header                    │
│  - Verify token: jwt.verify(token, JWT_SECRET)                │
│  - Decode userId from token payload                           │
│  - Attach to request: req.userId = decoded.userId             │
│  - Call next() to proceed to route handler                    │
└──────────────────────────────────────────────────────────────┘
```

### Error Handling Pattern

```javascript
// Standard error handling in route handlers

router.get('/subjects', async (req, res) => {
  try {
    // Database operation
    const result = await db.query(
      'SELECT * FROM subjects WHERE user_id = $1',
      [req.userId]
    );

    // Success response
    res.json(result.rows);

  } catch (err) {
    // Error logging
    console.error('Error fetching subjects:', err);

    // Generic error response (don't expose internals)
    res.status(500).json({
      error: 'Failed to fetch subjects'
    });
  }
});

// Input validation errors
if (!title) {
  return res.status(400).json({
    error: 'Title is required'
  });
}

// Not found errors
if (result.rows.length === 0) {
  return res.status(404).json({
    error: 'Subject not found'
  });
}

// Authentication errors (from middleware)
return res.status(401).json({
  error: 'Invalid or expired token'
});
```

---

## Frontend Architecture

### Component Hierarchy

```
App.jsx (Root Component)
├── Providers
│   ├── UserContext (Authentication state)
│   └── GoalsContext (Goals data)
│
├── Desktop Sidebar (Desktop only)
│   └── Sidebar (Design System)
│       ├── SidebarItem (Tasks)
│       ├── SidebarItem (Attachments)
│       ├── SidebarItem (Session)
│       └── SidebarItem (Profile)
│
├── Header (Global header)
│   ├── Subject selector
│   └── Stats display
│
├── Main Content Area (Route-based rendering)
│   ├── Tasks Tab -> Tasks.jsx
│   │   ├── TaskCard (each task)
│   │   ├── AddTaskModal
│   │   ├── TaskDetailModal
│   │   └── TaskEditModal
│   │
│   ├── Attachments Tab -> AttachmentsHub.jsx
│   │   ├── AttachmentCard
│   │   ├── FolderTree
│   │   └── BulkActions
│   │
│   ├── Session Tab -> Timeline.jsx
│   │   ├── SessionCard
│   │   ├── SessionDetailModal
│   │   └── EditSessionModal
│   │
│   └── Profile Tab -> ProfilePage.jsx
│       ├── UserProfile
│       ├── SubjectManagement
│       └── GoalsPage (nested route)
│           ├── GoalCard
│           ├── GoalDetailView
│           └── JournalEntries
│
├── Bottom Navigation (Mobile only)
│   └── BottomNav
│
└── Global Modals
    ├── CreateSubjectModal
    ├── ManageSubjectsModal
    ├── AddSessionModal
    ├── LoginModal
    ├── SignupModal
    └── ShareConfirmModal (Capacitor share target)
```

### State Management Architecture

Vela uses a **Context + Local State** approach without global state libraries:

```javascript
// 1. Authentication State (UserContext)
const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        const userData = await api.auth.getCurrentUser();
        setUser(userData);
      }
      setIsCheckingAuth(false);
    };
    checkAuth();
  }, []);

  const login = async (credentials) => {
    const { token, user } = await api.auth.login(credentials);
    localStorage.setItem('authToken', token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, login, logout, isCheckingAuth }}>
      {children}
    </UserContext.Provider>
  );
}

// 2. Goals State (GoalsContext)
export function GoalsProvider({ children, isAuthenticated }) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadGoals = async () => {
    setLoading(true);
    const data = await api.goals.getAll();
    setGoals(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadGoals();
    }
  }, [isAuthenticated]);

  return (
    <GoalsContext.Provider value={{ goals, loadGoals, loading }}>
      {children}
    </GoalsContext.Provider>
  );
}

// 3. Component-Level State (Local)
function Tasks({ subjectId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch tasks when subject changes
  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      const data = await api.tasks.getBySubject(subjectId);
      setTasks(data.data);
      setLoading(false);
    };

    if (subjectId) {
      fetchTasks();
    }
  }, [subjectId]);

  // Local state mutations
  const handleComplete = async (taskId) => {
    await api.tasks.update(taskId, { completed: true });
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, completed: true } : t
    ));
  };

  return (
    // Component JSX
  );
}
```

### Custom Hooks

```javascript
// frontend-web/src/hooks/useSubjects.js
export default function useSubjects(user) {
  const [subjects, setSubjects] = useState([]);
  const [currentSubject, setCurrentSubject] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSubjects = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const data = await api.subjects.getAll();
    setSubjects(data);

    // Set active subject
    const active = data.find(s => s.id === user.active_subject_id) || data[0];
    setCurrentSubject(active);

    setLoading(false);
  }, [user]);

  const handleSubjectChange = async (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId);
    setCurrentSubject(subject);
    // Optionally update user's active subject in backend
  };

  return {
    subjects,
    currentSubject,
    loading,
    loadSubjects,
    handleSubjectChange
  };
}

// frontend-web/src/hooks/useModals.js
export default function useModals() {
  const [modalState, setModalState] = useState({
    createSubject: false,
    addSession: false,
    editSession: false,
    // ... other modals
    editingSession: null,       // Data for editing
    sessionInitialData: null,   // Prefill data
    pendingShareData: null      // Share target data
  });

  const openModal = (modalName, data = {}) => {
    setModalState(prev => ({
      ...prev,
      [modalName]: true,
      ...data
    }));
  };

  const closeModal = () => {
    setModalState({
      // Reset all to false
    });
  };

  return { modalState, openModal, closeModal };
}
```

### API Client Design

```javascript
// frontend-web/src/api.js

// Configuration: Base URL with intelligent detection
const isCapacitor = window.Capacitor?.isNativePlatform?.() || false;

let API_BASE = import.meta.env.VITE_API_URL ||
  (isCapacitor ? '' : '/vela/api');

// Auto-append /vela/api if just root URL provided
if (API_BASE && /^https?:\/\/[^\/]+:?\d*[\/]?$/.test(API_BASE)) {
  API_BASE = API_BASE.replace(/\/$/, '') + '/vela/api';
}

// Force relative path in development for Vite proxy
if (import.meta.env.DEV && !isCapacitor) {
  API_BASE = '/vela/api';
}

// Safe fetch wrapper with auto-auth
async function safeFetch(url, options = {}) {
  // Inject Authorization header
  const token = localStorage.getItem('authToken');
  const headers = { ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 15-second timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  const response = await fetch(url, {
    ...options,
    headers,
    signal: controller.signal
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'An error occurred'
    }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// API modules
export const subjectsApi = {
  getAll: () => safeFetch(`${API_BASE}/subjects`),
  getById: (id) => safeFetch(`${API_BASE}/subjects/${id}`),
  create: (data) => safeFetch(`${API_BASE}/subjects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  update: (id, data) => safeFetch(`${API_BASE}/subjects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  delete: (id) => safeFetch(`${API_BASE}/subjects/${id}`, {
    method: 'DELETE'
  })
};

// Export unified API object
export default {
  auth: authApi,
  subjects: subjectsApi,
  tasks: tasksApi,
  sessions: sessionsApi,
  goals: goalsApi,
  notes: notesApi,
  attachments: attachmentsApi
  // ... other modules
};
```

### Design System Integration

```javascript
// frontend-web/src/design-system/index.js

// Export all components
export { default as Button } from './components/Button/Button';
export { default as Input } from './components/Input/Input';
export { default as Card } from './components/Card/Card';
export { default as Modal } from './components/Modal/Modal';
export { default as Sidebar } from './components/Sidebar/Sidebar';
export { H1, H2, Paragraph, Caption } from './components/Typography/Typography';

// Auto-import CSS variables
import './styles/variables.css';
import './styles/global.css';

// Usage in components:
import { Button, Card, Input, H1 } from './design-system';

function MyComponent() {
  return (
    <Card>
      <H1>Title</H1>
      <Input placeholder="Enter text" />
      <Button variant="primary">Submit</Button>
    </Card>
  );
}

// CSS Variables (variables.css)
:root {
  /* Colors */
  --nds-text-primary: #1a1a1a;
  --nds-text-secondary: #6b7280;
  --nds-bg-primary: #ffffff;
  --nds-bg-secondary: #f3f4f6;
  --color-primary: #3b82f6;
  --color-danger: #ef4444;

  /* Spacing (4px grid) */
  --nds-spacing-1: 4px;
  --nds-spacing-2: 8px;
  --nds-spacing-3: 12px;
  --nds-spacing-4: 16px;
  --nds-spacing-6: 24px;
  --nds-spacing-8: 32px;

  /* Shadows */
  --nds-shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --nds-shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --nds-shadow-lg: 0 10px 15px rgba(0,0,0,0.1);

  /* Typography */
  --nds-font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto;
  --nds-font-size-base: 14px;
  --nds-font-size-lg: 16px;
}

// Using tokens in component CSS
.my-card {
  background: var(--nds-bg-primary);
  padding: var(--nds-spacing-4);
  box-shadow: var(--nds-shadow-md);
  color: var(--nds-text-primary);
}
```

### Routing Strategy

Vela uses **client-side routing via state** instead of React Router:

```javascript
// App.jsx routing pattern
function App() {
  const [activeTab, setActiveTab] = useState('tasks');

  const tabContent = {
    tasks: <Tasks />,
    attachments: <AttachmentsHub />,
    timeline: <Timeline />,
    profile: <ProfilePage />
  };

  return (
    <div className="app">
      <Sidebar>
        <SidebarItem
          label="Tasks"
          active={activeTab === 'tasks'}
          onClick={() => setActiveTab('tasks')}
        />
        <SidebarItem
          label="Attachments"
          active={activeTab === 'attachments'}
          onClick={() => setActiveTab('attachments')}
        />
        {/* ... other items */}
      </Sidebar>

      <main>
        {tabContent[activeTab]}
      </main>

      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
}
```

---

## Database Architecture

### Schema Overview

Vela's database consists of **13 core tables** and **4 junction tables** organized around the `user_settings` and `subjects` entities:

```
user_settings (Root Entity)
├── subjects (1:N)
│   ├── topics (1:N)
│   ├── study_sessions (1:N)
│   ├── tasks (1:N)
│   ├── notes (1:N)
│   └── attachments (1:N)
│
├── goals (1:N)
│   ├── journal_entries (1:N)
│   │   └── journal_sessions (M:N with study_sessions)
│   ├── tasks (linked via goal_id)
│   └── study_sessions (linked via goal_id)
│
├── note_folders (1:N, hierarchical)
│   └── notes (1:N)
│       ├── note_tasks (M:N with tasks)
│       └── note_sessions (M:N with study_sessions)
│
└── attachment_folders (1:N, hierarchical)
    ├── tasks (1:N via folder_id)
    ├── study_sessions (1:N via folder_id)
    └── attachments (1:N via folder_id)
```

### Core Tables

#### 1. user_settings (Users)

**Purpose:** Central user account and profile data

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing user ID |
| user_id | VARCHAR(100) | UNIQUE, NOT NULL | Email address (used for login) |
| name | VARCHAR(255) | | User's display name |
| password_hash | TEXT | | bcrypt hashed password |
| profile_photo_url | TEXT | | URL to uploaded profile photo |
| active_subject_id | INTEGER | FK → subjects(id) | Currently selected subject |
| created_at | TIMESTAMP | DEFAULT NOW() | Account creation time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last modification time |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE on `user_id`
- FOREIGN KEY on `active_subject_id`

---

#### 2. subjects (Study Subjects/Courses)

**Purpose:** Top-level organization for study topics (e.g., "AWS SAA", "React")

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing subject ID |
| user_id | INTEGER | FK → user_settings(id) ON DELETE CASCADE | Owner of the subject |
| name | VARCHAR(255) | NOT NULL | Subject name |
| description | TEXT | | Optional description |
| color | VARCHAR(50) | DEFAULT '#3b82f6' | UI color hex code |
| icon | VARCHAR(50) | DEFAULT 'BookOpen' | Lucide icon name |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last modification |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE on `(user_id, name)` (composite)
- FOREIGN KEY on `user_id`

---

#### 3. topics (Study Topics)

**Purpose:** Individual topics within a subject

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Topic ID |
| subject_id | INTEGER | FK → subjects(id) ON DELETE CASCADE | Parent subject |
| name | VARCHAR(255) | NOT NULL | Topic name |
| category | VARCHAR(100) | NOT NULL | Topic category/group |
| completed | BOOLEAN | DEFAULT FALSE | Completion status |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |

**Indexes:**
- PRIMARY KEY on `id`
- FOREIGN KEY on `subject_id`

---

#### 4. study_sessions (Study Sessions)

**Purpose:** Time-tracked study activities

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Session ID |
| subject_id | INTEGER | FK → subjects(id) ON DELETE CASCADE, NULLABLE | Parent subject (can be NULL for orphan sessions) |
| date | DATE | NOT NULL | Session date |
| day | VARCHAR(20) | NOT NULL | Day of week (e.g., "Monday") |
| activity | TEXT | NOT NULL | Activity description |
| time_spent | INTEGER | | Duration in minutes |
| topics_covered | TEXT | | Topics studied (comma-separated or free text) |
| notes | TEXT | | Session notes |
| revision_count | INTEGER | DEFAULT 0 | Number of times revised |
| type | VARCHAR(20) | DEFAULT 'STUDY' | Activity type (STUDY, WATCH, READ, PRACTICE, etc.) |
| url | TEXT | | Associated URL (YouTube, article, etc.) |
| folder_id | INTEGER | FK → attachment_folders(id) ON DELETE SET NULL | Organization folder |
| goal_id | INTEGER | FK → goals(id) ON DELETE SET NULL | Linked goal |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `url` WHERE `url IS NOT NULL`
- INDEX on `folder_id` WHERE `folder_id IS NOT NULL`
- FOREIGN KEYs on `subject_id`, `folder_id`, `goal_id`

---

#### 5. revision_items (Revision Tracking)

**Purpose:** Items marked for spaced repetition/revision

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Revision item ID |
| subject_id | INTEGER | FK → subjects(id) ON DELETE CASCADE | Parent subject |
| title | VARCHAR(255) | NOT NULL | Item title |
| category | VARCHAR(100) | | Item category |
| revision_count | INTEGER | DEFAULT 0 | Times revised |
| last_revised | DATE | | Last revision date |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |

---

#### 6. tasks (Task Management)

**Purpose:** Rich task system with subtasks, reminders, and attachments

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Task ID |
| user_id | INTEGER | FK → user_settings(id) ON DELETE CASCADE | Task owner |
| subject_id | INTEGER | FK → subjects(id) ON DELETE CASCADE, NULLABLE | Linked subject |
| parent_task_id | INTEGER | FK → tasks(id) ON DELETE CASCADE, NULLABLE | Parent task (for subtasks) |
| type | VARCHAR(20) | DEFAULT 'TASK' | Type (TASK, WATCH, READ, NOTE, PRACTICE) |
| title | VARCHAR(255) | NOT NULL | Task title |
| url | TEXT | | Associated URL (content link) |
| content | TEXT | | Task body/description |
| completed | BOOLEAN | DEFAULT FALSE | Completion flag |
| status | VARCHAR(20) | DEFAULT 'TODO' | Status (TODO, IN_PROGRESS, DONE, EXPLORATORY) |
| tags | TEXT[] | DEFAULT '{}' | Array of tags |
| rating | INTEGER | | User rating (1-5 stars) |
| reminder_time | TIMESTAMP | | Scheduled reminder time |
| alert_type | VARCHAR(20) | DEFAULT 'basic' | Reminder type (basic, persistent) |
| reminder_snoozed_until | TIMESTAMP | | Snooze until time |
| reminder_dismissed | BOOLEAN | DEFAULT FALSE | Dismissal flag |
| goal_id | INTEGER | FK → goals(id) ON DELETE SET NULL | Linked goal |
| attachment_url | TEXT | | File attachment URL (PDF, Excel, etc.) |
| folder_id | INTEGER | FK → attachment_folders(id) ON DELETE SET NULL | Organization folder |
| subtasks | JSONB | DEFAULT '[]' | JSON array of inline subtasks |
| resources | JSONB | DEFAULT '[]' | JSON array of resource links |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `reminder_time` WHERE `reminder_dismissed = FALSE`
- INDEX on `(user_id, attachment_url)` WHERE `attachment_url IS NOT NULL`
- INDEX on `(user_id, url)` WHERE `url IS NOT NULL`
- INDEX on `folder_id` WHERE `folder_id IS NOT NULL`
- INDEX on `parent_task_id` WHERE `parent_task_id IS NOT NULL`
- INDEX on `(user_id, parent_task_id)` WHERE `parent_task_id IS NULL` (top-level tasks)
- FOREIGN KEYs on `user_id`, `subject_id`, `parent_task_id`, `goal_id`, `folder_id`

---

#### 7. goals (Goal Tracking)

**Purpose:** Long-term goals with time tracking and journaling

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Goal ID |
| user_id | INTEGER | FK → user_settings(id) ON DELETE CASCADE | Goal owner |
| title | VARCHAR(255) | NOT NULL | Goal title |
| description | TEXT | | Goal description |
| category | VARCHAR(50) | DEFAULT 'PERSONAL' | Goal category |
| status | VARCHAR(50) | DEFAULT 'PLANNING' | Status (PLANNING, IN_PROGRESS, COMPLETED, etc.) |
| target_date | DATE | | Target completion date |
| target_hours | INTEGER | DEFAULT 100 | Target study hours |
| image_url | TEXT | | Goal image/banner URL |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |

**Indexes:**
- PRIMARY KEY on `id`
- FOREIGN KEY on `user_id`

---

#### 8. journal_entries (Goal Journal)

**Purpose:** Daily reflections and progress logs for goals

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Entry ID |
| user_id | INTEGER | FK → user_settings(id) ON DELETE CASCADE | Entry author |
| goal_id | INTEGER | FK → goals(id) ON DELETE CASCADE | Linked goal |
| entry_date | DATE | NOT NULL, DEFAULT CURRENT_DATE | Entry date |
| mood | VARCHAR(50) | | Mood/sentiment |
| thoughts | TEXT | | Journal entry text |
| link_sessions | BOOLEAN | DEFAULT FALSE | Auto-link sessions flag |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `goal_id`
- INDEX on `user_id`
- INDEX on `entry_date`
- FOREIGN KEYs on `user_id`, `goal_id`

---

#### 9. notes (Note-taking)

**Purpose:** Rich text notes with tagging and linking

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Note ID |
| user_id | INTEGER | FK → user_settings(id) ON DELETE CASCADE | Note author |
| subject_id | INTEGER | FK → subjects(id) ON DELETE SET NULL, NULLABLE | Linked subject |
| folder_id | INTEGER | FK → note_folders(id) ON DELETE SET NULL, NULLABLE | Parent folder |
| title | VARCHAR(255) | NOT NULL | Note title |
| content | TEXT | | Note body (rich text/markdown) |
| tags | TEXT[] | DEFAULT '{}' | Array of tags |
| is_pinned | BOOLEAN | DEFAULT FALSE | Pin to top flag |
| color | VARCHAR(50) | DEFAULT '#ffffff' | Note color |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

**Indexes:**
- PRIMARY KEY on `id`
- FOREIGN KEYs on `user_id`, `subject_id`, `folder_id`

---

#### 10. note_folders (Note Organization)

**Purpose:** Hierarchical folder structure for notes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Folder ID |
| user_id | INTEGER | FK → user_settings(id) ON DELETE CASCADE | Folder owner |
| name | VARCHAR(255) | NOT NULL | Folder name |
| parent_id | INTEGER | FK → note_folders(id) ON DELETE CASCADE, NULLABLE | Parent folder (for nesting) |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

**Indexes:**
- PRIMARY KEY on `id`
- FOREIGN KEYs on `user_id`, `parent_id`

---

#### 11. attachment_folders (Attachment Organization)

**Purpose:** Hierarchical folder structure for files/links

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Folder ID |
| user_id | INTEGER | FK → user_settings(id) ON DELETE CASCADE | Folder owner |
| name | VARCHAR(255) | NOT NULL | Folder name |
| parent_id | INTEGER | FK → attachment_folders(id) ON DELETE CASCADE, NULLABLE | Parent folder |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `user_id`
- INDEX on `parent_id` WHERE `parent_id IS NOT NULL`
- FOREIGN KEYs on `user_id`, `parent_id`

---

#### 12. attachments (Standalone Attachments)

**Purpose:** Files and links not tied to tasks/sessions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Attachment ID |
| user_id | INTEGER | FK → user_settings(id) ON DELETE CASCADE | Owner |
| subject_id | INTEGER | FK → subjects(id) ON DELETE SET NULL, NULLABLE | Linked subject |
| folder_id | INTEGER | FK → attachment_folders(id) ON DELETE SET NULL, NULLABLE | Parent folder |
| title | VARCHAR(500) | NOT NULL | Attachment title |
| url | TEXT | NOT NULL | File URL or link |
| type | VARCHAR(50) | DEFAULT 'link' | Type (link, pdf, image, video) |
| platform | VARCHAR(50) | | Platform (youtube, github, etc.) |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `folder_id` WHERE `folder_id IS NOT NULL`
- FOREIGN KEYs on `user_id`, `subject_id`, `folder_id`

---

### Junction Tables (Many-to-Many Relationships)

#### 13. note_tasks (Notes ↔ Tasks)

**Purpose:** Link notes to tasks (many-to-many)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Link ID |
| note_id | INTEGER | FK → notes(id) ON DELETE CASCADE | Note reference |
| task_id | INTEGER | FK → tasks(id) ON DELETE CASCADE | Task reference |
| created_at | TIMESTAMP | DEFAULT NOW() | Link creation time |

**Constraints:**
- UNIQUE on `(note_id, task_id)` (prevent duplicates)

**Indexes:**
- INDEX on `task_id`
- INDEX on `note_id`

---

#### 14. note_sessions (Notes ↔ Study Sessions)

**Purpose:** Link notes to study sessions (many-to-many)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Link ID |
| note_id | INTEGER | FK → notes(id) ON DELETE CASCADE | Note reference |
| session_id | INTEGER | FK → study_sessions(id) ON DELETE CASCADE | Session reference |
| created_at | TIMESTAMP | DEFAULT NOW() | Link creation time |

**Constraints:**
- UNIQUE on `(note_id, session_id)`

**Indexes:**
- INDEX on `session_id`
- INDEX on `note_id`

---

#### 15. journal_sessions (Journal Entries ↔ Study Sessions)

**Purpose:** Link journal entries to study sessions (many-to-many)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Link ID |
| journal_id | INTEGER | FK → journal_entries(id) ON DELETE CASCADE | Journal reference |
| session_id | INTEGER | FK → study_sessions(id) ON DELETE CASCADE | Session reference |
| created_at | TIMESTAMP | DEFAULT NOW() | Link creation time |

**Constraints:**
- UNIQUE on `(journal_id, session_id)`

**Indexes:**
- INDEX on `journal_id`
- INDEX on `session_id`

---

### Entity Relationship Diagram (ERD)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            user_settings                                │
│  id (PK) | user_id (email) | name | password_hash | active_subject_id  │
└────┬──────────────────────────────────────────────────┬─────────────────┘
     │ 1:N                                               │ 1:N
     │                                                   │
     ├───────────────┬───────────────────────────────────┤
     │               │                                   │
     ▼               ▼                                   ▼
┌─────────┐   ┌─────────────┐                     ┌─────────────┐
│ subjects│   │   goals     │                     │note_folders │
│  (1:N)  │   │   (1:N)     │                     │ (1:N, tree) │
└────┬────┘   └──────┬──────┘                     └──────┬──────┘
     │ 1:N           │ 1:N                                │ 1:N
     │               │                                    │
     ├───────┬───────┼────────┬──────────┐               │
     │       │       │        │          │               │
     ▼       ▼       ▼        ▼          ▼               ▼
┌────────┐ ┌────┐ ┌────┐ ┌───────┐ ┌────────┐      ┌────────┐
│ topics │ │task│ │sess│ │journal│ │attach- │      │ notes  │
│        │ │    │ │ion │ │entries│ │ ments  │      │        │
└────────┘ └──┬─┘ └──┬─┘ └───┬───┘ └────────┘      └───┬────┘
              │      │       │                          │
              │      │       │ M:N                      │ M:N
              │      │       ▼                          │
              │      │  ┌──────────────┐                │
              │      │  │journal_      │                │
              │      │  │sessions      │                │
              │      │  └──────────────┘                │
              │      │                                  │
              │      ▼ M:N                              ▼ M:N
              │  ┌──────────────┐              ┌──────────────┐
              │  │note_sessions │              │ note_tasks   │
              │  └──────────────┘              └──────────────┘
              │                                        ▲
              └────────────────────────────────────────┘

Additional Relationships:
- tasks.parent_task_id -> tasks.id (self-referencing for subtasks)
- tasks.goal_id -> goals.id
- study_sessions.goal_id -> goals.id
- tasks.folder_id -> attachment_folders.id
- study_sessions.folder_id -> attachment_folders.id
- attachments.folder_id -> attachment_folders.id
```

### Cascading Behavior

```
user_settings (deleted)
└─> CASCADE DELETE
    ├─> subjects
    │   └─> CASCADE DELETE
    │       ├─> topics
    │       ├─> study_sessions
    │       ├─> tasks
    │       ├─> notes (SET NULL on subject_id)
    │       └─> attachments (SET NULL on subject_id)
    │
    ├─> goals
    │   └─> CASCADE DELETE
    │       └─> journal_entries
    │           └─> CASCADE DELETE
    │               └─> journal_sessions (junction)
    │
    ├─> note_folders
    │   └─> CASCADE DELETE (recursive for nested folders)
    │       └─> notes (SET NULL on folder_id)
    │
    ├─> attachment_folders
    │   └─> CASCADE DELETE (recursive)
    │       ├─> tasks (SET NULL on folder_id)
    │       ├─> study_sessions (SET NULL on folder_id)
    │       └─> attachments (SET NULL on folder_id)
    │
    └─> tasks, notes, attachments (CASCADE DELETE)
        └─> note_tasks, note_sessions (CASCADE DELETE)
```

### Database Initialization

The database schema auto-initializes on server startup:

```javascript
// backend/database.js

const initDB = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create user_settings table first
    await client.query(`CREATE TABLE IF NOT EXISTS user_settings ...`);

    // 2. Create subjects table
    await client.query(`CREATE TABLE IF NOT EXISTS subjects ...`);

    // 3. Create dependent tables (topics, sessions, tasks, etc.)
    // ...

    // 4. Run migrations (DO $$ blocks for adding columns)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='tasks' AND column_name='status'
        ) THEN
          ALTER TABLE tasks ADD COLUMN status VARCHAR(20) DEFAULT 'TODO';
        END IF;
      END $$;
    `);

    // 5. Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_reminder_time
      ON tasks(reminder_time)
      WHERE reminder_dismissed = FALSE;
    `);

    await client.query('COMMIT');
    console.log('✅ Database tables initialized successfully');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error initializing database:', err);
  } finally {
    client.release();
  }
};
```

---

## Security Architecture

### Authentication & Authorization

#### 1. JWT-Based Authentication

```
Registration Flow:
1. User submits email + password
2. Backend validates format (email regex, password >= 6 chars)
3. Check if email already exists
4. Hash password: bcrypt.hash(password, 10 rounds)
5. Insert into user_settings: (user_id=email, password_hash)
6. Generate JWT: jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
7. Return token + user data to client
8. Client stores token in localStorage

Login Flow:
1. User submits email + password
2. Backend queries user by email (user_id)
3. Verify password: bcrypt.compare(password, password_hash)
4. Generate JWT token
5. Return token + user data
6. Client stores token

Authenticated Requests:
1. Client sends: Authorization: Bearer <token>
2. Middleware extracts token from header
3. Verify: jwt.verify(token, JWT_SECRET)
4. Decode userId from payload
5. Attach to request: req.userId = decoded.userId
6. Route handler uses req.userId for queries
```

#### 2. Authorization Model

```javascript
// All protected routes use per-user data isolation via WHERE clauses

// Example: Get tasks
router.get('/tasks', authenticateToken, async (req, res) => {
  const result = await db.query(
    'SELECT * FROM tasks WHERE user_id = $1',
    [req.userId]  // From JWT token
  );
  res.json(result.rows);
});

// Users can only access their own data
// No additional role-based access control (RBAC)
// Single-user application model
```

### SQL Injection Prevention

```javascript
// ALWAYS use parameterized queries ($1, $2, $3 placeholders)

// ❌ DANGEROUS (SQL injection vulnerable)
const query = `SELECT * FROM tasks WHERE title = '${userInput}'`;

// ✅ SAFE (parameterized query)
const result = await db.query(
  'SELECT * FROM tasks WHERE title = $1 AND user_id = $2',
  [userInput, req.userId]
);

// All queries in Vela use parameterized format
// The pg library automatically escapes parameters
```

### Rate Limiting

```javascript
// backend/server.js

const rateLimit = require('express-rate-limit');

// Auth endpoints: 5 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 requests
  message: { error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

// API endpoints: 3000 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 3000,                  // 3000 requests
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply to routes
appRouter.use('/api/auth/login', authLimiter);
appRouter.use('/api/auth/signup', authLimiter);
appRouter.use('/api', apiLimiter);
```

### CORS Configuration

```javascript
// backend/server.js

app.use(cors({
  origin: true,           // Allow all origins (development mode)
  credentials: true       // Allow cookies and authorization headers
}));

// Production recommendation:
// Restrict to specific origins:
// origin: ['https://yourdomain.com', 'capacitor://localhost']
```

### Password Security

```javascript
// Password hashing with bcrypt

// Signup: Hash password before storage
const saltRounds = 10;  // Computational cost factor
const passwordHash = await bcrypt.hash(password, saltRounds);

// Login: Compare plain password with hash
const isValid = await bcrypt.compare(password, storedHash);

// Password requirements:
// - Minimum 6 characters (validated in backend)
// - Email format validation: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
```

### Secure File Uploads

```javascript
// backend/routes/auth.js

const multer = require('multer');

const upload = multer({
  storage: multer.diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, 'profile-' + uniqueSuffix + ext);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },  // 5MB limit
  fileFilter: (req, file, cb) => {
    // Only allow images
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Files stored at: backend/uploads/profile-[timestamp]-[random].[ext]
// Served at: /vela/uploads/profile-*.jpg
```

### Environment Variable Security

```javascript
// Sensitive data stored in environment variables

// .env file (NOT committed to Git)
DATABASE_URL=postgresql://user:pass@host/db
JWT_SECRET=super-secret-key-change-in-production
AWS_REGION=us-east-1
DB_SSM_PARAM_NAME=/vela/db/url

// .gitignore
.env
.env.local
.env.mobile

// Production: Use AWS SSM Parameter Store
// backend/aws-config.js loads from SSM if DB_SSM_PARAM_NAME is set
```

### SSL/TLS Encryption

```javascript
// Database connections use SSL

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false  // Required for Neon serverless
  }
});

// Neon enforces SSL connections
// All data in transit is encrypted
```

---

## Mobile Architecture

### Capacitor Integration

Vela uses **Capacitor 8** to wrap the React web app into a native Android application.

```
┌─────────────────────────────────────────────────────────┐
│                   Android APK                           │
├─────────────────────────────────────────────────────────┤
│  Capacitor WebView (Chromium-based)                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │  React App (frontend-web/dist)                    │  │
│  │  - Base path: ./ (relative for file:// protocol) │  │
│  │  - API calls: http://YOUR_SERVER_IP:3000/vela/api│  │
│  └───────────────────────────────────────────────────┘  │
│                         │                                │
│         Capacitor Bridge (JavaScript ↔ Native)           │
│                         │                                │
│  ┌────────────────┬─────┴─────────┬──────────────────┐  │
│  │  Camera Plugin │ Share Target  │ Local Notif      │  │
│  │  File System   │ Status Bar    │ Splash Screen    │  │
│  └────────────────┴───────────────┴──────────────────┘  │
│                                                          │
│  Android Native APIs                                     │
└─────────────────────────────────────────────────────────┘
```

### Build Modes

```javascript
// frontend-web/vite.config.js

export default defineConfig(({ mode }) => ({
  // Web build: base = '/vela/' (for subpath hosting)
  // Mobile build: base = './' (for file:// protocol)
  base: mode === 'mobile' ? './' : '/vela/',

  server: {
    proxy: {
      '/vela/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
}));

// Build commands:
// npm run build        -> Web (base: /vela/)
// npm run build:mobile -> Mobile (base: ./)
```

### Native Plugin Usage

#### 1. Share Target (Receive shared content)

```javascript
// App.jsx

import { CapacitorShareTarget } from '@capgo/capacitor-share-target';

useEffect(() => {
  if (window.Capacitor) {
    CapacitorShareTarget.addListener('shareReceived', (result) => {
      // result.texts: Array of shared text (URLs, titles)
      // result.files: Array of shared files

      const sharedText = result.texts[0];
      const urlRegex = /(https?:\/\/[^\s]+)/;
      const urlMatch = sharedText.match(urlRegex);

      if (urlMatch) {
        // Extract URL and title
        const url = urlMatch[0];
        const title = sharedText.replace(url, '').trim() || 'Shared Link';

        // Show modal to user: Save as Session or Task?
        openShareConfirmModal({ url, title });
      }
    });
  }
}, []);

// AndroidManifest.xml configuration:
// <intent-filter>
//   <action android:name="android.intent.action.SEND" />
//   <category android:name="android.intent.category.DEFAULT" />
//   <data android:mimeType="text/plain" />
// </intent-filter>
```

#### 2. Camera (Take photos for tasks/notes)

```javascript
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

const takePhoto = async () => {
  const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: true,
    resultType: CameraResultType.Uri,  // Returns file:// URI
    source: CameraSource.Camera        // Or CameraSource.Photos for gallery
  });

  const imageUrl = image.webPath;
  // Upload to backend or save locally
};
```

#### 3. File System (Save/read files)

```javascript
import { Filesystem, Directory } from '@capacitor/filesystem';

// Write file
await Filesystem.writeFile({
  path: 'notes/my-note.txt',
  data: noteContent,
  directory: Directory.Documents,
  encoding: Encoding.UTF8
});

// Read file
const contents = await Filesystem.readFile({
  path: 'notes/my-note.txt',
  directory: Directory.Documents,
  encoding: Encoding.UTF8
});
```

#### 4. Local Notifications

```javascript
import { LocalNotifications } from '@capacitor/local-notifications';

// Schedule notification
await LocalNotifications.schedule({
  notifications: [
    {
      title: "Task Reminder",
      body: "Time to review AWS EC2 notes!",
      id: 1,
      schedule: { at: new Date(Date.now() + 3600000) },  // 1 hour from now
      sound: null,
      attachments: null,
      actionTypeId: "",
      extra: { taskId: 42 }
    }
  ]
});

// Handle notification tap
LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
  const taskId = notification.notification.extra.taskId;
  // Navigate to task detail
});
```

### Mobile-Specific Configuration

```javascript
// frontend-web/capacitor.config.json

{
  "appId": "com.vela.studytracker",
  "appName": "Vela",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#1a1a1a",
      "showSpinner": true
    },
    "StatusBar": {
      "style": "dark",
      "backgroundColor": "#1a1a1a"
    },
    "CapacitorShareTarget": {
      "enabled": true
    }
  },
  "server": {
    "androidScheme": "https"
  }
}
```

### Mobile Build Process

```bash
# 1. Set environment variable for API URL
export VITE_API_URL=http://192.168.1.5:3000

# 2. Build React app for mobile
cd frontend-web
npm run build:mobile  # Sets base to './'

# 3. Sync to Capacitor
npx cap sync android

# 4. Open in Android Studio
npx cap open android

# 5. Build APK in Android Studio
# Build > Build Bundle(s) / APK(s) > Build APK(s)

# 6. APK output location:
# android/app/build/outputs/apk/debug/app-debug.apk
# or
# android/app/build/outputs/apk/release/app-release.apk
```

### Mobile-Specific Code Patterns

```javascript
// Detect if running on mobile
const isMobile = window.Capacitor?.isNativePlatform?.() || false;

// Conditional rendering
{isMobile && <MobileOnlyFeature />}
{!isMobile && <WebOnlyFeature />}

// API URL configuration
const API_BASE = import.meta.env.VITE_API_URL ||
  (isMobile ? '' : '/vela/api');

// File paths
const basePath = isMobile ? './' : '/vela/';
```

---

## Deployment Architecture

### Docker Multi-Stage Build

```dockerfile
# Stage 1: Build React frontend
FROM node:20-slim AS frontend-builder

WORKDIR /build
COPY frontend-web/package*.json ./
RUN npm install

COPY frontend-web/ ./
RUN npm run build  # Outputs to dist/

# Stage 2: Node.js backend + compiled frontend
FROM node:20-slim

WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --only=production

# Copy backend source
COPY backend/ ./

# Copy compiled frontend from Stage 1
COPY --from=frontend-builder /build/dist ../frontend-web/dist

# Copy mobile APK (if available)
COPY mobile/ ../mobile/

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "server.js"]
```

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml

name: Deploy Vela

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Build Mobile APK
        run: |
          cd frontend-web
          npm install
          npm run build:mobile
          npx cap sync android
          # Build APK with Gradle
          cd ../android
          ./gradlew assembleRelease
          mkdir -p ../mobile
          cp app/build/outputs/apk/release/app-release.apk ../mobile/

      - name: Build Docker Image
        run: |
          docker build -t vela:latest .

      - name: Push to Container Registry
        run: |
          docker tag vela:latest registry.example.com/vela:latest
          docker push registry.example.com/vela:latest

      - name: Deploy to Server
        run: |
          ssh user@server 'docker pull registry.example.com/vela:latest && docker-compose up -d'
```

### Environment Configuration

```
Production Deployment:
┌─────────────────────────────────────────────────────┐
│  Docker Container                                   │
│  ┌────────────────────────────────────────────────┐ │
│  │  Node.js Server (Express)                      │ │
│  │  - Serves /vela/api/* (REST API)               │ │
│  │  - Serves /vela/* (Static React SPA)           │ │
│  │  - Port 3000 (internal)                        │ │
│  └────────────────────────────────────────────────┘ │
└────────────────┬────────────────────────────────────┘
                 │ Port 3000
                 ▼
┌─────────────────────────────────────────────────────┐
│  Reverse Proxy (Nginx/Caddy)                        │
│  - Listen on port 80/443                            │
│  - SSL termination                                  │
│  - Proxy /vela/* -> http://localhost:3000/vela/*    │
└────────────────┬────────────────────────────────────┘
                 │ HTTPS
                 ▼
┌─────────────────────────────────────────────────────┐
│  Internet Users / Mobile Apps                       │
│  - https://yourdomain.com/vela/                     │
│  - Mobile API: https://yourdomain.com/vela/api      │
└─────────────────────────────────────────────────────┘

External Services:
┌─────────────────────────────────────────────────────┐
│  Neon PostgreSQL (Serverless)                       │
│  - SSL connection                                   │
│  - Connection string from env var / AWS SSM         │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  AWS Parameter Store (Optional)                     │
│  - Stores DATABASE_URL securely                     │
│  - Fetched on server startup                        │
└─────────────────────────────────────────────────────┘
```

### Subpath Routing Configuration

All routes are served under `/vela/` prefix:

```
Web URLs:
https://yourdomain.com/vela/                  -> React SPA
https://yourdomain.com/vela/api/subjects      -> API endpoint
https://yourdomain.com/vela/health            -> Health check
https://yourdomain.com/vela/app-release.apk   -> Mobile APK download
https://yourdomain.com/vela/uploads/file.jpg  -> Uploaded files

Backend routing:
app.use('/vela', appRouter);
appRouter.use('/api/subjects', subjectsRoutes);
appRouter.get('/health', ...);
appRouter.use(express.static('../frontend-web/dist'));

Frontend base path:
<base href="/vela/" />
Vite config: base: '/vela/'
```

---

## Key Design Patterns

### 1. Repository Pattern (Implicit)

All database queries are centralized in route handlers:

```javascript
// backend/routes/subjects.js acts as a repository

const getSubjects = (userId) => {
  return db.query('SELECT * FROM subjects WHERE user_id = $1', [userId]);
};

const createSubject = (userId, data) => {
  return db.query(
    'INSERT INTO subjects (user_id, name, description) VALUES ($1, $2, $3) RETURNING *',
    [userId, data.name, data.description]
  );
};
```

### 2. Middleware Chain Pattern

Express.js middleware chain for request processing:

```javascript
// Request flows through middleware stack
app.use(cors());                    // 1. Enable CORS
app.use(express.json());            // 2. Parse JSON
app.use(requestLogger);             // 3. Log request
appRouter.use('/api', rateLimiter); // 4. Rate limiting
router.use(authenticateToken);      // 5. JWT verification
router.get('/tasks', handler);      // 6. Route handler
```

### 3. Custom Hook Pattern (React)

Encapsulate logic in reusable hooks:

```javascript
// useSubjects: Manages subject state and operations
// useProgress: Fetches and filters progress data
// useModals: Manages modal state
// useUser: Authentication state management
```

### 4. Context Provider Pattern

Global state via React Context:

```javascript
<UserProvider>
  <GoalsProvider>
    <App />
  </GoalsProvider>
</UserProvider>
```

### 5. Higher-Order Component Pattern (Design System)

Reusable UI components with prop-based variants:

```javascript
<Button variant="primary" size="large" />
<Card elevated hoverable />
<Modal visible={isOpen} onClose={close} />
```

### 6. Token Bucket Rate Limiting

```javascript
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15-minute window
  max: 100,                   // 100 tokens per window
  standardHeaders: true       // Return RateLimit-* headers
});
```

### 7. Optimistic UI Updates

```javascript
// Update UI immediately, revert on error
const handleComplete = async (taskId) => {
  // Optimistically update local state
  setTasks(prev => prev.map(t =>
    t.id === taskId ? { ...t, completed: true } : t
  ));

  try {
    // Send to backend
    await api.tasks.update(taskId, { completed: true });
  } catch (error) {
    // Revert on failure
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, completed: false } : t
    ));
    message.error('Failed to update task');
  }
};
```

### 8. Auto-Migration Pattern

Database schema auto-migrates on startup:

```javascript
// Check if column exists, add if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='tasks' AND column_name='status'
  ) THEN
    ALTER TABLE tasks ADD COLUMN status VARCHAR(20) DEFAULT 'TODO';
  END IF;
END $$;
```

---

## API Design Conventions

### RESTful Endpoint Naming

```
Resource: Subjects
GET    /api/subjects           -> List all subjects
POST   /api/subjects           -> Create subject
GET    /api/subjects/:id       -> Get subject by ID
PUT    /api/subjects/:id       -> Update subject
DELETE /api/subjects/:id       -> Delete subject

Resource: Tasks
GET    /api/tasks              -> List all tasks (global)
GET    /api/tasks/:subjectId   -> List tasks by subject
POST   /api/tasks              -> Create task
PUT    /api/tasks/:id          -> Update task
DELETE /api/tasks/:id          -> Delete task

Special endpoints:
POST   /api/tasks/:id/reminder         -> Set reminder
POST   /api/tasks/:id/reminder/snooze  -> Snooze reminder
DELETE /api/tasks/:id/reminder         -> Remove reminder
GET    /api/tasks/reminders/pending    -> Get pending reminders
```

### Request/Response Formats

```javascript
// Standard successful response (200 OK)
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 123,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}

// Creation response (201 Created)
{
  "id": 42,
  "title": "Study AWS EC2",
  "created_at": "2026-02-21T10:30:00Z",
  ...
}

// Error response (4xx, 5xx)
{
  "error": "Task not found"
}

// Validation error (400 Bad Request)
{
  "error": "Title is required"
}
```

### Pagination Pattern

```javascript
// Query parameters
GET /api/tasks?page=2&limit=50

// Backend implementation
const page = parseInt(req.query.page) || 1;
const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Max 100
const offset = (page - 1) * limit;

const result = await db.query(
  'SELECT * FROM tasks WHERE user_id = $1 LIMIT $2 OFFSET $3',
  [req.userId, limit, offset]
);

const countResult = await db.query(
  'SELECT COUNT(*) FROM tasks WHERE user_id = $1',
  [req.userId]
);

res.json({
  data: result.rows,
  pagination: {
    page,
    limit,
    total: parseInt(countResult.rows[0].count),
    totalPages: Math.ceil(total / limit),
    hasNextPage: page < Math.ceil(total / limit),
    hasPrevPage: page > 1
  }
});
```

### Filtering Pattern

```javascript
// Query parameters
GET /api/tasks?goal_id=5&status=TODO&search=AWS

// Backend implementation
let query = 'SELECT * FROM tasks WHERE user_id = $1';
const params = [req.userId];

if (req.query.goal_id) {
  params.push(req.query.goal_id);
  query += ` AND goal_id = $${params.length}`;
}

if (req.query.status) {
  params.push(req.query.status);
  query += ` AND status = $${params.length}`;
}

if (req.query.search) {
  params.push(`%${req.query.search}%`);
  query += ` AND title ILIKE $${params.length}`;
}

const result = await db.query(query, params);
```

---

## Performance Considerations

### Database Indexing

```sql
-- Indexes for efficient queries

-- 1. User-based queries (most common)
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_subjects_user_id ON subjects(user_id);

-- 2. Reminder queries
CREATE INDEX idx_tasks_reminder_time
  ON tasks(reminder_time)
  WHERE reminder_dismissed = FALSE;

-- 3. Attachment queries
CREATE INDEX idx_tasks_user_attachments
  ON tasks(user_id, attachment_url)
  WHERE attachment_url IS NOT NULL;

-- 4. Hierarchical queries
CREATE INDEX idx_tasks_parent
  ON tasks(parent_task_id)
  WHERE parent_task_id IS NOT NULL;

-- 5. Join table queries
CREATE INDEX idx_note_tasks_task_id ON note_tasks(task_id);
CREATE INDEX idx_note_tasks_note_id ON note_tasks(note_id);
```

### Query Optimization

```javascript
// ✅ Efficient: Single query with JOIN
const result = await db.query(`
  SELECT t.*,
         COALESCE(nt.note_count, 0)::integer as linked_notes_count
  FROM tasks t
  LEFT JOIN (
    SELECT task_id, COUNT(*) as note_count
    FROM note_tasks
    GROUP BY task_id
  ) nt ON t.id = nt.task_id
  WHERE t.user_id = $1
`, [userId]);

// ❌ Inefficient: N+1 queries
const tasks = await db.query('SELECT * FROM tasks WHERE user_id = $1', [userId]);
for (const task of tasks.rows) {
  const notes = await db.query('SELECT COUNT(*) FROM note_tasks WHERE task_id = $1', [task.id]);
  task.note_count = notes.rows[0].count;
}
```

### Frontend Performance

```javascript
// 1. Lazy loading components
const ProfilePage = lazy(() => import('./components/ProfilePage'));
const GoalsPage = lazy(() => import('./components/GoalsPage'));

// 2. Memoization for expensive computations
const filteredTasks = useMemo(() => {
  return tasks.filter(t => t.status === filterStatus);
}, [tasks, filterStatus]);

// 3. Debounced search
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 500);

useEffect(() => {
  if (debouncedSearch) {
    fetchTasks({ search: debouncedSearch });
  }
}, [debouncedSearch]);

// 4. Pagination to limit data fetching
const [page, setPage] = useState(1);
const [limit] = useState(50);

useEffect(() => {
  fetchTasks({ page, limit });
}, [page]);
```

### Caching Strategy

```javascript
// Client-side caching in localStorage
const cachedSubjects = localStorage.getItem('subjects');
if (cachedSubjects && isCacheFresh(cachedSubjects)) {
  setSubjects(JSON.parse(cachedSubjects));
} else {
  const data = await api.subjects.getAll();
  localStorage.setItem('subjects', JSON.stringify(data));
  setSubjects(data);
}

// Server-side: Neon connection pooling
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,  // Max 20 connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
```

### Bundle Size Optimization

```javascript
// Vite code splitting (automatic)
// Output: dist/assets/[name]-[hash].js

// Tree shaking: Only import what's needed
import { Button, Card } from './design-system';  // Not entire library

// Dynamic imports for large libraries
const loadPuppeteer = async () => {
  const puppeteer = await import('puppeteer');
  return puppeteer.launch();
};
```

---

## Conclusion

Vela is architected as a **monolithic full-stack application** with clear separation between:

- **Backend:** Express.js REST API with JWT authentication and PostgreSQL persistence
- **Frontend:** React SPA with custom design system and context-based state management
- **Mobile:** Capacitor-wrapped Android app with native integrations
- **Database:** Serverless PostgreSQL with auto-migration and multi-user isolation

Key architectural strengths:
1. **Security-first:** JWT auth, bcrypt hashing, parameterized queries, rate limiting
2. **Scalable database:** Indexed queries, efficient joins, cascading deletes
3. **Mobile-ready:** Capacitor plugins for share target, camera, notifications
4. **Developer-friendly:** Auto-migrations, clear conventions, comprehensive error handling
5. **Production-ready:** Docker deployment, CI/CD pipeline, health checks

For development workflows, troubleshooting, and feature guides, refer to:
- **CLAUDE.md** - Development guide and conventions
- **FEATURES.md** - User workflows and feature documentation
- **README.md** - Quick start and setup instructions

---

**Maintained By:** Vela Development Team
**Repository:** tracker_app
**License:** Proprietary
