# CLAUDE.md - Vela Development Guide

## Project Overview

**Vela** is a full-stack web and mobile application for tracking study progress, managing tasks, taking notes, and monitoring goals. It's designed as a personal learning management system with support for multiple subjects, study sessions, and revision tracking.

- **Type**: Full-stack monorepo (backend + frontend-web)
- **Primary Use**: Study progress tracking, task management, note-taking
- **Deployment**: Docker container with subpath hosting at `/vela/`
- **Database**: Neon PostgreSQL (serverless, free tier)
- **Mobile Support**: Capacitor-based Android app

## Quick Start - Features at a Glance

**For detailed user documentation and workflows, see [FEATURES.md](FEATURES.md)**

### Main Navigation Tabs
1. **Tasks** 📋 - Task management with priorities, deadlines, subtasks
2. **Attachments** 📎 - File/link hub for all study materials
3. **Session** 📅 - Study session logging and timeline
4. **Profile** 👤 - User settings, subjects, and goals

### Core Features
- ✅ **Multi-subject organization** - Switch between courses/topics
- ⏱️ **Time tracking** - Log study sessions with duration and activity types
- 📋 **Task management** - Create, prioritize, and track tasks with subtasks
- 📝 **Note-taking** - Rich notes with folders, tags, and inter-note linking
- 🎯 **Goal tracking** - Set and monitor learning objectives
- 📎 **File management** - Upload PDFs, images, save links
- 📊 **Analytics** - View study time stats and progress
- 📱 **Mobile app** - Android app with share target, camera, notifications
- 🔗 **Quick capture** - Share YouTube videos/links from any app to Vela

### Activity Types Supported
- 📚 Study, 📺 Watch, 📖 Read, 💻 Practice, 📝 Notes, 🎧 Listen

### User Journey Example
1. Create subject (e.g., "AWS SAA")
2. Add tasks ("Study EC2", "Practice VPC")
3. Study → Log session with time, topics, attachments
4. Take notes → Organize in folders, link related concepts
5. Set goals → Track progress toward certification
6. Review stats → See total study time and completed tasks

**Quick answer to "What is this app?":**
Vela is a personal learning management system that helps students and learners track study time, manage tasks, organize notes, and monitor goals across multiple subjects.

## Tech Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: PostgreSQL (Neon serverless)
- **ORM/Query**: pg (node-postgres) with raw SQL
- **Authentication**: JWT with bcryptjs
- **Security**: express-rate-limit, CORS
- **Config Management**: AWS SSM Parameter Store + dotenv fallback
- **Additional**: Puppeteer for web scraping, Multer for file uploads

### Frontend (frontend-web/)
- **Framework**: React 19
- **Build Tool**: Vite 5
- **UI Library**: Custom Notion-inspired design system (replaced Ant Design)
- **Mobile**: Capacitor 8 (Android support)
- **Styling**: CSS with design tokens (CSS variables)
- **Icons**: Lucide React, React Icons
- **Animations**: Framer Motion
- **Testing**: Vitest + React Testing Library

### DevOps
- **Containerization**: Docker (multi-stage build)
- **CI/CD**: GitHub Actions (.github/workflows/deploy.yml)
- **Deployment**: Subpath hosting at `/vela/`

## Repository Structure

```
tracker_app/
├── backend/                      # Express API server
│   ├── server.js                 # Main entry point
│   ├── database.js               # PostgreSQL connection & schema
│   ├── aws-config.js             # AWS SSM Parameter Store config loader
│   ├── routes/                   # API route handlers
│   │   ├── auth.js               # User authentication (signup, login)
│   │   ├── subjects.js           # Subject CRUD operations
│   │   ├── progress.js           # Study sessions, topics, revisions
│   │   ├── tasks.js              # Task management
│   │   ├── goals.js              # Goal tracking
│   │   ├── notes.js              # Note management
│   │   ├── note-folders.js       # Note folder organization
│   │   ├── note-links.js         # Note linking system
│   │   └── scraper.js            # Instagram scraping utilities
│   ├── middleware/
│   │   └── auth.js               # JWT authentication middleware
│   ├── utils/
│   │   └── instagramScraper.js   # Puppeteer-based scraper
│   ├── package.json
│   └── README.md
├── frontend-web/                 # React web application
│   ├── src/
│   │   ├── App.jsx               # Main app component (routing, state)
│   │   ├── api.js                # API client with token management
│   │   ├── components/           # React components
│   │   │   ├── Tasks.jsx         # Task management (large, 46KB)
│   │   │   ├── NotesPage.jsx     # Note-taking interface
│   │   │   ├── GoalsPage.jsx     # Goal tracking
│   │   │   ├── Timeline.jsx      # Study session timeline
│   │   │   ├── Timesheet.jsx     # Time tracking view
│   │   │   └── ...               # 40+ components total
│   │   ├── design-system/        # Custom UI component library
│   │   │   ├── tokens/           # CSS variables (colors, spacing, etc.)
│   │   │   ├── components/       # Reusable UI components
│   │   │   │   ├── Button/
│   │   │   │   ├── Card/
│   │   │   │   ├── Input/
│   │   │   │   ├── Modal/
│   │   │   │   ├── Tabs/
│   │   │   │   ├── Typography/
│   │   │   │   └── ...
│   │   │   └── README.md         # Design system docs
│   │   ├── services/
│   │   │   └── notificationService.js  # Local notification handling
│   │   ├── utils/                # Helper functions
│   │   └── test/                 # Test setup and test files
│   ├── vite.config.js            # Vite configuration (subpath, proxy)
│   ├── package.json
│   └── capacitor.config.json     # Mobile app configuration
├── .github/
│   └── workflows/
│       └── deploy.yml            # CI/CD pipeline
├── Dockerfile                    # Multi-stage Docker build
├── package.json                  # Root workspace dependencies
└── README.md
```

## Key Architecture Patterns

### Backend Patterns

1. **Database Schema**: PostgreSQL with foreign key relationships
   - Multi-user support (user_id references)
   - Subject-based organization (subjects → topics, sessions, tasks)
   - Cascading deletes for data integrity
   - Location: backend/database.js:1

2. **API Routes**: RESTful endpoints with JWT authentication
   - All routes mounted under `/api/` prefix
   - Rate limiting: 5 req/15min for auth, 100 req/15min for API
   - CORS enabled for cross-origin requests
   - Subpath routing: `/vela/api/*`

3. **Configuration Loading**: AWS SSM + fallback to .env
   - Priority: AWS Parameter Store → .env file
   - Located in: backend/aws-config.js:1

4. **Authentication Flow**:
   - JWT tokens stored in localStorage (frontend)
   - Token sent via Authorization header
   - Middleware validates on protected routes: backend/middleware/auth.js:1

### Frontend Patterns

1. **Component Architecture**: Large, stateful components
   - App.jsx handles routing and global state (37KB)
   - Tasks.jsx is the largest component (46KB)
   - Components manage their own state with useState/useEffect

2. **API Communication**: Centralized in api.js
   - Token management (auto-attach to headers)
   - Base URL configuration (env-based)
   - Error handling and response parsing
   - Location: frontend-web/src/api.js:1

3. **Design System**: Custom Notion-inspired UI
   - CSS variables with `--nds-` prefix
   - Tokens: colors, spacing (4px grid), typography, shadows
   - Components: Button, Card, Input, Modal, Tabs, Typography, etc.
   - Location: frontend-web/src/design-system/

4. **State Management**: Local component state (no Redux/Zustand)
   - Props drilling for shared state
   - useEffect for data fetching
   - localStorage for persistence (auth tokens, user preferences)

5. **Mobile Support**: Capacitor for native features
   - Camera, file system, local notifications, share target
   - Build modes: `npm run build` (web), `npm run build:mobile` (mobile)
   - Base path: relative (`./`) for mobile, `/vela/` for web

## Development Workflows

### Backend Development

```bash
cd backend
npm install
# Create .env with DATABASE_URL=postgresql://...
npm run dev          # Start with nodemon (auto-reload)
npm start            # Production mode
```

**Environment Variables Required**:
- `DATABASE_URL`: Neon PostgreSQL connection string
- `JWT_SECRET`: Secret for token signing
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: production or development
- `DB_SSM_PARAM_NAME`: (Optional) AWS Parameter Store path

**Database Initialization**:
- Tables auto-created on server start: backend/database.js:23
- Seed data: `POST /api/progress/seed`

### Frontend Development

```bash
cd frontend-web
npm install
npm run dev          # Start Vite dev server (proxy to backend)
npm run build        # Build for web (base: /vela/)
npm run build:mobile # Build for Capacitor (base: ./)
npm test             # Run Vitest tests
npm run lint         # ESLint
```

**Environment Files**:
- `.env.mobile`: Mobile-specific config (API endpoints)

**Development Server**:
- Runs on http://localhost:5173 (Vite default)
- Proxies `/api` requests to backend at http://localhost:3000

### Testing

**Frontend Tests**:
- Framework: Vitest with jsdom
- Testing Library: @testing-library/react
- Setup: frontend-web/src/test/setup.js
- Run: `npm test`
- Examples: LoginModal.test.jsx, SignupModal.test.jsx

**Backend Tests**:
- No formal test suite currently
- Manual testing scripts:
  - backend/list-users.js
  - backend/list-tasks.js
  - backend/verify_tables.js

### Deployment

**Docker Build**:
```bash
docker build -t study-tracker .
docker run -p 3000:3000 --env-file backend/.env study-tracker
```

**Multi-stage Build**:
1. Stage 1: Build React frontend (outputs to dist/)
2. Stage 2: Copy backend + frontend dist, install production deps
3. Serve frontend static files from backend under `/vela/`

**CI/CD**: GitHub Actions (.github/workflows/deploy.yml)
- Trigger: Push to main branch
- Build Docker image, push to registry, deploy

**Important**: App is hosted at subpath `/vela/`, not root!
- Frontend base: `/vela/`
- API routes: `/vela/api/*`
- Health check: `/vela/health`

## Key Conventions for AI Assistants

### Documentation Maintenance

**CRITICAL REQUIREMENT**: Documentation must be updated with every check-in (commit) to ensure accuracy.

**When making ANY code changes, you MUST:**

1. **Update CLAUDE.md** if:
   - Architecture patterns change
   - New dependencies are added
   - File structure is modified
   - API endpoints are added/changed
   - Deployment process changes
   - New features are implemented
   - Technology stack is updated

2. **Update relevant documentation** in `docs/`:
   - **FEATURES.md**: User-facing feature changes
   - **API_REFERENCE.md**: New or modified API endpoints
   - **MOBILE_BUILD_GUIDE.md**: Mobile build process changes
   - **DEPLOYMENT_GUIDE.md**: Deployment or infrastructure changes
   - **DEVELOPER_SETUP.md**: Development setup changes

3. **Update component READMEs** if:
   - Design system components are modified
   - Component usage patterns change
   - New props or APIs are added

4. **Update inline code comments** for:
   - Complex logic that's not self-evident
   - Database schema changes
   - API contracts and data structures

**Documentation Quality Standards**:
- Keep examples current with actual code
- Update version numbers and dates
- Remove outdated information immediately
- Ensure code snippets are tested and work
- Maintain consistency across all docs
- Use clear, concise language

**Before every commit, ask yourself:**
- "Does this change affect any documentation?"
- "Would a new developer understand this change from the docs?"
- "Are all examples still accurate?"

**Stale documentation is worse than no documentation.** Treat docs as first-class code.

### Code Style

1. **JavaScript**: ES6+ with CommonJS (backend), ESM (frontend)
2. **Indentation**: 4 spaces (backend), 2 spaces (frontend)
3. **Quotes**: Single quotes preferred
4. **Naming**:
   - Components: PascalCase (e.g., AddTaskModal.jsx)
   - Files: camelCase for scripts, PascalCase for components
   - Database: snake_case (e.g., study_sessions, user_id)
   - API routes: kebab-case (e.g., /api/note-folders)

### Component Patterns

1. **File Structure**: Component + CSS in same directory
   ```
   components/
   ├── Tasks.jsx
   ├── Tasks.css
   ├── AddTaskModal.jsx
   └── AddTaskModal.css
   ```

2. **Props**: PropTypes validation (see existing components)
3. **State**: useState for local, props for shared
4. **Effects**: useEffect for API calls, cleanup in return
5. **Styling**: CSS classes, design system tokens via CSS variables

### API Patterns

1. **Route Structure**:
   ```javascript
   router.get('/endpoint', authMiddleware, async (req, res) => {
       const userId = req.user.id; // From JWT
       // ... logic
       res.json({ data });
   });
   ```

2. **Error Handling**:
   ```javascript
   try {
       // ... database operations
   } catch (error) {
       console.error('Error:', error);
       res.status(500).json({ error: 'Internal server error' });
   }
   ```

3. **Database Queries**: Raw SQL with parameterized queries
   ```javascript
   const result = await pool.query(
       'SELECT * FROM tasks WHERE user_id = $1',
       [userId]
   );
   ```

### Design System Usage

**Import components**:
```javascript
import { Button, Card, Input, Modal, H1, Paragraph } from './design-system';
```

**Use design tokens in CSS**:
```css
.my-component {
    color: var(--nds-text-primary);
    padding: var(--nds-spacing-4);
    background: var(--nds-bg-secondary);
    box-shadow: var(--nds-shadow-md);
}
```

**Button variants**: default, primary, outline, subtle, danger

## Common Tasks

### Adding a New API Endpoint

1. Create route handler in `backend/routes/` or add to existing file
2. Add authentication middleware if needed
3. Mount route in `backend/server.js` (appRouter)
4. Add corresponding API call in `frontend-web/src/api.js`
5. Test with backend/list-*.js scripts or curl

### Adding a New React Component

1. Create component file: `frontend-web/src/components/MyComponent.jsx`
2. Create styles: `frontend-web/src/components/MyComponent.css`
3. Use design system components and tokens
4. Import and use in parent component (likely App.jsx)
5. Add PropTypes validation

### Adding a Database Table

1. Add CREATE TABLE in `backend/database.js` initDB()
2. Add foreign keys and constraints
3. Create corresponding route handlers
4. Update API client in frontend
5. Test with backend/verify_tables.js

### Mobile Build

1. Make code changes in frontend-web/
2. Build: `npm run build:mobile`
3. Sync to Capacitor: `npx cap sync android`
4. Open Android Studio: `npx cap open android`
5. Build APK in Android Studio

### OTA Updates (Capgo)

Vela uses **Capgo** for over-the-air JS bundle updates — the Capacitor equivalent of CodePush.

**How it works:**
- Every push to `main` uploads a new JS bundle to Capgo via CI/CD
- Existing app installs silently download and apply the update on next launch
- Only full native rebuilds (new permissions, native modules) require a fresh APK install

**CI/CD flow per push:**
1. APK is built and uploaded to GitHub Releases (creates a permanent download URL)
2. Email with the download link is sent to `gbnathworkspace@gmail.com`
3. JS bundle is pushed to Capgo's `production` channel for existing installs

**Required GitHub Secrets:**
| Secret | Description |
|--------|-------------|
| `CAPGO_TOKEN` | API key from [app.capgo.app](https://app.capgo.app) → Account → API Keys |
| `GMAIL_USERNAME` | Gmail address used to send build notification emails |
| `GMAIL_PASSWORD` | Gmail **App Password** (not account password) — [generate here](https://myaccount.google.com/apppasswords) |

**First-time Capgo setup:**
```bash
# 1. Create account at https://app.capgo.app
# 2. Create a new app with appId: com.vela.app
# 3. Copy API key → add as CAPGO_TOKEN GitHub secret
# 4. On first deploy, Capgo creates the 'production' channel automatically
```

**Key files:**
- `frontend-web/capacitor.config.json` — `CapacitorUpdater` plugin config
- `frontend-web/src/utils/capacitor.js` — `initCapgoUpdater()` calls `notifyAppReady()`
- `.github/workflows/deploy.yml` — "Push OTA bundle to Capgo" step

## Important Files Reference

| File | Purpose | Lines | Notes |
|------|---------|-------|-------|
| backend/server.js | Express app entry point | 144 | Loads config, mounts routes, starts server |
| backend/database.js | DB schema & migrations | 450+ | All table definitions, auto-runs on startup |
| backend/routes/progress.js | Study sessions API | 400+ | Topics, sessions, revisions endpoints |
| backend/routes/tasks.js | Task management API | 310+ | CRUD for tasks with subject linking |
| backend/routes/auth.js | Authentication | 250+ | Signup, login, JWT generation |
| frontend-web/src/App.jsx | Main React component | 1100+ | Routing, state, tab management |
| frontend-web/src/api.js | API client | 380+ | All frontend→backend communication |
| frontend-web/src/components/Tasks.jsx | Task UI (largest) | 1200+ | Complex task management interface |
| frontend-web/src/design-system/index.js | Design system exports | - | Central import point for UI components |
| vite.config.js | Build configuration | 25 | Subpath config, proxy, test setup |
| Dockerfile | Container build | 50 | Multi-stage: frontend build + backend runtime |
| frontend-web/src/utils/capacitor.js | Capacitor native utils | 450+ | Camera, filesystem, OTA init (Capgo) |
| frontend-web/capacitor.config.json | Capacitor + Capgo config | - | OTA update settings, plugin config |

## Security Considerations

1. **Authentication**: JWT tokens, bcrypt password hashing
2. **Rate Limiting**: Applied to auth (5/15min) and API (100/15min) endpoints
3. **SQL Injection**: Protected via parameterized queries ($1, $2, etc.)
4. **CORS**: Enabled but should be restricted in production
5. **Environment Variables**: Never commit .env files, use .gitignore
6. **SSL**: Required for Neon database connections

## Database Schema Summary

**Core Tables**:
- `user_settings`: User configuration, active subject
- `subjects`: Study subjects/courses
- `topics`: Individual topics within subjects
- `study_sessions`: Study session logs
- `tasks`: Task management with priority, deadlines
- `goals`: Long-term goal tracking
- `notes`: Rich text notes with tags
- `note_folders`: Hierarchical note organization
- `note_links`: Graph-based note connections

**Key Relationships**:
- subjects (1) → (many) topics, study_sessions, tasks, notes
- notes (1) → (many) note_links (bidirectional)
- note_folders (1) → (many) notes

## Troubleshooting

### Backend Won't Start
- Check `DATABASE_URL` in .env
- Verify Neon database is accessible
- Run `backend/verify_tables.js` to test connection

### Frontend API Calls Fail
- Ensure backend is running on port 3000
- Check token in localStorage
- Verify proxy config in vite.config.js
- Check CORS settings in backend/server.js

### Docker Build Fails
- Ensure `mobile/` directory exists (for APK)
- Check Dockerfile COPY paths
- Verify NODE_ENV is set

### Mobile App Issues
- Re-run `npm run build:mobile` after changes
- Sync Capacitor: `npx cap sync android`
- Check base path is `./` for mobile builds
- Verify Capacitor plugins in package.json

### Deployment Issues (EC2 Disk Space)
- **Error**: `no space left on device` during Docker pull
- **Cause**: EC2 instance runs out of disk space (Puppeteer's Chrome is ~500MB)
- **Fix**: SSH into EC2 and run cleanup commands:
  ```bash
  docker container prune -f
  docker image prune -a -f
  docker volume prune -f
  docker builder prune -a -f
  df -h  # Check available space
  ```
- **Prevention**: Updated deployment workflow automatically cleans up before pulling new images
- **Long-term**: Consider removing Puppeteer if Instagram scraping is unused, or increase EC2 storage

## Next Steps for AI Assistants

When working on this codebase:

1. **Read before writing**: Always read existing code before making changes
2. **Follow patterns**: Match existing code style and architecture
3. **Use design system**: Import from design-system, use CSS tokens
4. **Test database changes**: Use verify_tables.js, list-*.js scripts
5. **Check both modes**: Test web (base: /vela/) and mobile (base: ./)
6. **Update docs**: Keep this CLAUDE.md and component READMEs current
7. **Security first**: Never expose sensitive data, validate all inputs
8. **Mobile considerations**: Some features (camera, notifications) are Capacitor-only

## Resources

### Project Documentation
- **📚 FEATURES.md**: User guide - features, workflows, and how to use the app
- **🛠️ CLAUDE.md**: This file - technical architecture and development guide
- **Backend README**: backend/README.md (API endpoints, Neon setup)
- **Design System**: frontend-web/src/design-system/README.md

### External Documentation
- **Neon Docs**: https://neon.tech/docs
- **Capacitor Docs**: https://capacitorjs.com/docs
- **Vite Docs**: https://vitejs.dev
- **React 19**: https://react.dev

---

**Last Updated**: 2026-02-21
**Maintained By**: AI Development Team
**Repository**: tracker_app
