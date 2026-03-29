# Vela Developer Setup Guide

Welcome to the Vela development team! This guide will walk you through setting up your local development environment for the Vela study tracking application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Repository Setup](#repository-setup)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Database Management](#database-management)
6. [Common Development Tasks](#common-development-tasks)
7. [Mobile Development](#mobile-development)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed on your development machine:

### Required Software

1. **Node.js 20+** (recommended: v20 LTS or higher)
   ```bash
   node --version  # Should show v20.x.x or higher
   ```
   Download from: https://nodejs.org/

2. **npm** (comes with Node.js)
   ```bash
   npm --version  # Should show v9.x.x or higher
   ```

3. **Git**
   ```bash
   git --version
   ```
   Download from: https://git-scm.com/

4. **A code editor** (recommended: VS Code)
   - VS Code: https://code.visualstudio.com/

### Optional (for mobile development)

5. **Android Studio** (for mobile app development)
   - Download from: https://developer.android.com/studio
   - Ensure you have Android SDK installed

6. **Java Development Kit (JDK) 11+** (for Android builds)
   ```bash
   java --version
   ```

---

## Repository Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd studytracker
```

### 2. Understand the Workspace Structure

The repository is a monorepo with the following structure:

```
studytracker/
├── backend/              # Express.js API server
│   ├── routes/          # API route handlers
│   ├── middleware/      # Authentication middleware
│   ├── utils/           # Utility functions
│   ├── server.js        # Main entry point
│   └── database.js      # Database schema & connection
├── frontend-web/         # React web application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── design-system/  # UI component library
│   │   └── api.js       # API client
│   └── vite.config.js   # Vite configuration
├── docs/                 # Documentation
├── .github/              # CI/CD workflows
└── package.json          # Root workspace config
```

---

## Backend Setup

The backend is a Node.js Express server that connects to a PostgreSQL database (Neon serverless).

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Express.js (web framework)
- pg (PostgreSQL client)
- bcryptjs (password hashing)
- jsonwebtoken (JWT authentication)
- dotenv (environment variables)
- And more...

### 3. Set Up Neon PostgreSQL Database

Vela uses **Neon PostgreSQL**, a free serverless database perfect for development.

#### Create a Neon Account & Database

1. Go to https://console.neon.tech
2. Sign up for a free account (no credit card required)
3. Click **"Create Project"**
4. Choose a project name (e.g., "vela-dev")
5. Select a region close to you
6. Click **Create Project**

#### Get Your Connection String

After creating the project, you'll see a connection string that looks like:

```
postgresql://username:password@ep-xxxxx.neon.tech/dbname?sslmode=require
```

Copy this connection string - you'll need it in the next step.

### 4. Create Environment Configuration

Create a `.env` file in the `backend/` directory:

```bash
# From the backend/ directory
touch .env
```

Add the following configuration to `.env`:

```env
# Database Connection
DATABASE_URL=postgresql://your-username:your-password@ep-xxxxx.neon.tech/neondb?sslmode=require

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Configuration
PORT=3000
NODE_ENV=development

# Optional: AWS SSM Parameter Store (for production)
# DB_SSM_PARAM_NAME=/vela/database-url
```

**Important:** Replace `DATABASE_URL` with your actual Neon connection string!

**Security Tip:** Generate a secure JWT_SECRET using:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Start the Backend Server

#### For Development (with auto-reload):

```bash
npm run dev
```

This uses `nodemon` to automatically restart the server when you make changes.

#### For Production Mode:

```bash
npm start
```

### 6. Verify Backend is Running

Open your browser and visit:

```
http://localhost:3000/health
```

You should see a JSON response indicating the server is healthy.

### 7. Initialize Database Schema

The database schema is automatically created when the server starts! On first run, you'll see:

```
✅ Connected to Neon PostgreSQL at: <timestamp>
✅ Database tables initialized successfully
```

This creates all necessary tables:
- `user_settings` - User accounts and preferences
- `subjects` - Study subjects/courses
- `topics` - Individual topics within subjects
- `study_sessions` - Study session logs
- `tasks` - Task management
- `goals` - Goal tracking
- `notes` - Note-taking
- `note_folders` - Note organization
- And more...

---

## Frontend Setup

The frontend is a React 19 application built with Vite.

### 1. Navigate to Frontend Directory

```bash
# From the root directory
cd frontend-web
```

### 2. Install Dependencies

```bash
npm install
```

This installs:
- React 19
- Vite 5 (build tool)
- Capacitor (mobile support)
- Lucide React (icons)
- Framer Motion (animations)
- Vitest (testing)
- And more...

### 3. Environment Configuration

For web development, no `.env` file is needed - Vite will proxy API requests to the backend automatically.

For mobile development, a `.env.mobile` file is already provided:

```env
# Mobile API endpoint
VITE_API_URL=https://seiyul.in/vela/api

# For local development with mobile only:
# VITE_API_URL=http://192.168.1.8:3000/vela/api
```

### 4. Start the Development Server

```bash
npm run dev
```

The development server will start on:

```
http://localhost:5173
```

**Important:** Make sure the backend is running on port 3000 before accessing the frontend!

### 5. Verify Frontend is Working

1. Open http://localhost:5173 in your browser
2. You should see the Vela login screen
3. API requests to `/api/*` are automatically proxied to `http://localhost:3000`

### 6. Run Tests

Vela uses Vitest for unit testing:

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch
```

### 7. Lint Code

```bash
npm run lint
```

---

## Database Management

### Verification Scripts

The backend includes several utility scripts for database management:

#### 1. Verify Database Tables

Check all tables exist and count rows:

```bash
# From backend/ directory
node verify_tables.js
```

Output example:
```
Connected to DB
Tables found: [ 'user_settings', 'subjects', 'tasks', 'notes', ... ]
user_settings: 1 rows
subjects: 5 rows
tasks: 12 rows
...
```

#### 2. List All Users

```bash
node list-users.js
```

Shows all registered users with their settings.

#### 3. List All Tasks

```bash
node list-tasks.js
```

Shows all tasks in the database.

#### 4. List User Sessions

```bash
node list-user-sessions.js
```

Shows all study sessions.

### Seeding Sample Data

To populate your database with sample data for testing:

**Method 1: Via API**

With the server running, visit:
```
http://localhost:3000/api/progress/seed
```

Or use curl:
```bash
curl -X POST http://localhost:3000/api/progress/seed
```

**Method 2: Via Script**

```bash
# From backend/ directory
node seed-sessions.js
```

### Database Migrations

The database schema is managed through `backend/database.js`. When you start the server:

1. It connects to PostgreSQL
2. Runs all `CREATE TABLE IF NOT EXISTS` statements
3. Runs migration blocks (DO $$ blocks) to add new columns/constraints
4. Creates indexes for performance

**Adding a new column?** Edit `database.js` and add a migration block like:

```javascript
await client.query(`
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name='tasks' AND column_name='my_new_column'
        ) THEN
            ALTER TABLE tasks ADD COLUMN my_new_column TEXT;
        END IF;
    END $$;
`);
```

### Resetting the Database

**Warning:** This will delete all data!

```bash
# From backend/ directory
node reset-database.js
```

---

## Common Development Tasks

### Making Changes to the API

1. **Add a new endpoint:**
   - Edit or create a file in `backend/routes/`
   - Example: `backend/routes/tasks.js`

   ```javascript
   router.get('/my-endpoint', authMiddleware, async (req, res) => {
       const userId = req.user.id;
       try {
           const result = await db.query(
               'SELECT * FROM tasks WHERE user_id = $1',
               [userId]
           );
           res.json(result.rows);
       } catch (error) {
           res.status(500).json({ error: 'Internal server error' });
       }
   });
   ```

2. **Mount the route in `server.js`:**

   ```javascript
   const tasksRouter = require('./routes/tasks');
   app.use('/api/tasks', tasksRouter);
   ```

3. **Add API call in frontend:**
   - Edit `frontend-web/src/api.js`

   ```javascript
   export const getMyData = async () => {
       return await api('/tasks/my-endpoint');
   };
   ```

4. **Test your changes:**
   - Backend will auto-reload (if using `npm run dev`)
   - Frontend will hot-reload automatically
   - Test in browser at http://localhost:5173

### Making Changes to the UI

1. **Edit existing components:**
   - Components are in `frontend-web/src/components/`
   - Example: `frontend-web/src/components/Tasks.jsx`

2. **Use the Design System:**

   ```javascript
   import { Button, Card, Input, Modal } from '../design-system';

   function MyComponent() {
       return (
           <Card>
               <Input placeholder="Enter text" />
               <Button variant="primary">Submit</Button>
           </Card>
       );
   }
   ```

3. **Use CSS Variables:**

   ```css
   .my-component {
       color: var(--nds-text-primary);
       padding: var(--nds-spacing-4);
       background: var(--nds-bg-secondary);
       box-shadow: var(--nds-shadow-md);
   }
   ```

### Adding a New Database Table

1. **Edit `backend/database.js`:**

   ```javascript
   await client.query(`
       CREATE TABLE IF NOT EXISTS my_table (
           id SERIAL PRIMARY KEY,
           user_id INTEGER NOT NULL REFERENCES user_settings(id) ON DELETE CASCADE,
           name VARCHAR(255) NOT NULL,
           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
       )
   `);
   ```

2. **Restart the backend server:**
   ```bash
   npm run dev
   ```

3. **Verify table was created:**
   ```bash
   node verify_tables.js
   ```

4. **Create API routes** for the new table in `backend/routes/`

5. **Update frontend** to use the new API

### Running Both Frontend & Backend

**Option 1: Two Terminal Windows**

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend-web
npm run dev
```

**Option 2: Using a Process Manager**

Install `concurrently` (optional):
```bash
npm install -g concurrently
```

Then from the root directory:
```bash
concurrently "cd backend && npm run dev" "cd frontend-web && npm run dev"
```

### Debugging Tips

#### Backend Debugging

1. **Check server logs** in the terminal running `npm run dev`
2. **Add console.log statements:**
   ```javascript
   console.log('Debug:', variable);
   ```
3. **Use VS Code debugger:**
   - Add breakpoints in your code
   - Press F5 or use Run > Start Debugging

#### Frontend Debugging

1. **Use browser DevTools:**
   - Open Chrome DevTools (F12)
   - Check Console tab for errors
   - Check Network tab for API requests

2. **React DevTools:**
   - Install React DevTools extension
   - Inspect component state and props

3. **API debugging:**
   - Check Network tab in DevTools
   - Look for failed requests (red)
   - Check request/response payloads

#### Database Debugging

1. **Check connection:**
   ```bash
   node backend/verify_tables.js
   ```

2. **View database in Neon Console:**
   - Go to https://console.neon.tech
   - Select your project
   - Use SQL Editor to run queries

3. **Enable query logging:**
   In your backend code, add:
   ```javascript
   pool.on('query', (e) => console.log('Query:', e.query));
   ```

---

## Mobile Development

Vela includes a Capacitor-based Android app.

### Prerequisites

- Android Studio installed
- Android SDK configured
- JDK 11+ installed

### 1. Build for Mobile

```bash
cd frontend-web
npm run build:mobile
```

This builds the frontend with:
- Base path: `./` (relative, for file:// URLs)
- Optimized for mobile performance

### 2. Sync with Capacitor

```bash
npx cap sync android
```

This copies the web build to the Android project and updates plugins.

### 3. Open in Android Studio

```bash
npx cap open android
```

Android Studio will open with the mobile project.

### 4. Build APK

In Android Studio:
1. Build > Build Bundle(s) / APK(s) > Build APK(s)
2. Wait for build to complete
3. APK location: `frontend-web/android/app/build/outputs/apk/`

### 5. Run on Device/Emulator

In Android Studio:
1. Select a device or emulator
2. Click Run (green play button)

### Mobile-Specific Features

The mobile app includes:
- **Camera access** - Take photos for attachments
- **File system** - Store files locally
- **Local notifications** - Task reminders
- **Share target** - Share links from other apps to Vela
- **Splash screen** - Custom loading screen

### Mobile API Configuration

For local testing with mobile, update `frontend-web/.env.mobile`:

```env
# Use your computer's local IP address
VITE_API_URL=http://192.168.1.8:3000/vela/api
```

Find your local IP:
- **Windows:** `ipconfig` (look for IPv4 Address)
- **Mac/Linux:** `ifconfig` (look for inet address)

---

## Troubleshooting

### Backend Issues

#### Database connection fails

**Symptom:**
```
❌ Database connection error: connect ECONNREFUSED
```

**Solutions:**
1. Check your `DATABASE_URL` in `.env`
2. Ensure Neon database is accessible
3. Verify SSL mode is set: `?sslmode=require`
4. Check if Neon project is active (not suspended)

#### Port 3000 already in use

**Symptom:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions:**
1. Kill the process using port 3000:
   ```bash
   # Find process
   lsof -i :3000
   # Kill it
   kill -9 <PID>
   ```

2. Or use a different port in `.env`:
   ```env
   PORT=3001
   ```

#### JWT secret missing

**Symptom:**
```
Error: JWT secret not configured
```

**Solution:**
Add `JWT_SECRET` to your `.env` file:
```env
JWT_SECRET=your-secret-here
```

### Frontend Issues

#### Backend API not accessible

**Symptom:**
- Network errors in console
- `Failed to fetch` errors

**Solutions:**
1. Ensure backend is running on port 3000
2. Check proxy config in `vite.config.js`
3. Clear browser cache
4. Check CORS settings in `backend/server.js`

#### Vite build fails

**Symptom:**
```
[vite] error while building...
```

**Solutions:**
1. Delete `node_modules` and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Clear Vite cache:
   ```bash
   rm -rf node_modules/.vite
   ```

#### Login not working

**Symptom:**
- Can't login after entering credentials
- Token errors in console

**Solutions:**
1. Check browser localStorage (DevTools > Application > Local Storage)
2. Clear localStorage and try again
3. Verify JWT_SECRET matches between attempts
4. Check backend logs for authentication errors

### Database Issues

#### Tables not created

**Symptom:**
- Queries fail with "relation does not exist"

**Solutions:**
1. Check backend startup logs for errors
2. Run verification script:
   ```bash
   node backend/verify_tables.js
   ```
3. Restart backend server to re-run migrations

#### Migration errors

**Symptom:**
```
Error initializing database: ...
```

**Solutions:**
1. Check PostgreSQL version (Neon uses PostgreSQL 14+)
2. Review migration syntax in `database.js`
3. Check for conflicting constraints
4. Use Neon SQL Editor to manually inspect schema

### Mobile Build Issues

#### Capacitor sync fails

**Symptom:**
```
[error] Capacitor could not find the web assets directory
```

**Solutions:**
1. Run build first:
   ```bash
   npm run build:mobile
   ```
2. Then sync:
   ```bash
   npx cap sync android
   ```

#### Android build errors

**Symptom:**
- Gradle build failures
- SDK version errors

**Solutions:**
1. Update Android Studio and SDK
2. Sync Gradle files in Android Studio
3. Check `build.gradle` for correct SDK versions
4. Clean and rebuild project in Android Studio

#### App crashes on launch

**Symptom:**
- App closes immediately after opening

**Solutions:**
1. Check API URL in `.env.mobile` is reachable
2. Review Android Logcat in Android Studio
3. Ensure WebView is working (check Capacitor config)
4. Test with debug APK first

---

## Additional Resources

### Documentation
- **Project Guide:** `CLAUDE.md` - Comprehensive project documentation
- **Features Guide:** `FEATURES.md` - User features and workflows
- **Backend README:** `backend/README.md` - API endpoints reference
- **Design System:** `frontend-web/src/design-system/README.md`

### External Resources
- **Neon Docs:** https://neon.tech/docs
- **Capacitor Docs:** https://capacitorjs.com/docs
- **Vite Docs:** https://vitejs.dev
- **React 19:** https://react.dev
- **Express.js:** https://expressjs.com

### Development Tools

**Recommended VS Code Extensions:**
- ESLint
- Prettier
- GitLens
- Thunder Client (API testing)
- PostgreSQL (database management)

### Getting Help

1. **Read the docs:** Start with `CLAUDE.md` and this guide
2. **Check existing issues:** Search GitHub issues
3. **Review logs:** Backend terminal, browser console, Android Logcat
4. **Use verification scripts:** `verify_tables.js`, `list-*.js`
5. **Ask the team:** Reach out on Slack/Discord/GitHub

---

## Quick Reference

### Essential Commands

```bash
# Backend
cd backend
npm install                    # Install dependencies
npm run dev                    # Start with auto-reload
node verify_tables.js          # Verify database
node list-users.js             # List all users

# Frontend
cd frontend-web
npm install                    # Install dependencies
npm run dev                    # Start dev server
npm test                       # Run tests
npm run lint                   # Lint code
npm run build                  # Build for web
npm run build:mobile           # Build for mobile

# Mobile
npx cap sync android           # Sync with Capacitor
npx cap open android           # Open in Android Studio
```

### Default Ports

- Backend API: `http://localhost:3000`
- Frontend Dev: `http://localhost:5173`
- Production Web: `https://yourdomain.com/vela/`

### Environment Files

- `backend/.env` - Backend configuration (DATABASE_URL, JWT_SECRET)
- `frontend-web/.env.mobile` - Mobile API endpoint

### Key Files

- `backend/server.js` - Express server entry point
- `backend/database.js` - Database schema and migrations
- `frontend-web/src/App.jsx` - Main React component
- `frontend-web/src/api.js` - API client
- `frontend-web/vite.config.js` - Build configuration

---

## Next Steps

1. **Set up your environment** following this guide
2. **Read `CLAUDE.md`** for architecture and patterns
3. **Read `FEATURES.md`** to understand user workflows
4. **Explore the codebase** - start with `App.jsx` and `server.js`
5. **Run verification scripts** to test your setup
6. **Make a small change** to familiarize yourself with the workflow
7. **Run tests** to ensure everything works
8. **Build the mobile app** if you'll be doing mobile development

**Welcome to the Vela team! Happy coding!** 🚀

---

**Last Updated:** 2026-02-21
**Version:** 1.0
**Maintainer:** Vela Development Team
