# Vela - Personal Learning Management System

> A full-stack study tracker for managing tasks, logging sessions, taking notes, and tracking goals across multiple subjects.

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-blue.svg)](https://neon.tech)
[![Mobile](https://img.shields.io/badge/Mobile-Android-green.svg)](https://capacitorjs.com)

## What is Vela?

Vela is an all-in-one study tracking application designed for students, lifelong learners, and anyone managing multiple learning paths. It combines task management, time tracking, note-taking, and goal setting into a single, cohesive platform.

**Key Features:**
- 📋 Task management with priorities and deadlines
- ⏱️ Study session logging with time tracking
- 📝 Rich note-taking with folders and linking
- 🎯 Goal tracking and monitoring
- 📎 File attachments and link management
- 📊 Progress analytics and statistics
- 📱 Android mobile app with native features
- 🔗 Quick capture via mobile share target

## Quick Links

- **📚 [FEATURES.md](FEATURES.md)** - User guide, features, and workflows
- **🛠️ [CLAUDE.md](CLAUDE.md)** - Technical documentation for developers
- **🔧 [Backend README](backend/README.md)** - API endpoints and setup
- **🎨 [Design System](frontend-web/src/design-system/README.md)** - UI components

## Getting Started

### For Users
See [FEATURES.md](FEATURES.md) for a complete guide on how to use Vela.

### For Developers

**Prerequisites:**
- Node.js 20+
- Neon PostgreSQL account (free tier available)
- Android Studio (for mobile builds)

**Quick Setup:**

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tracker_app
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   # Create .env with DATABASE_URL and JWT_SECRET
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend-web
   npm install
   npm run dev
   ```

4. **Access the app**
   - Web: http://localhost:5173
   - API: http://localhost:3000

**For detailed setup instructions, see [CLAUDE.md](CLAUDE.md)**

## Tech Stack

### Backend
- **Node.js** + **Express.js** - REST API server
- **PostgreSQL** (Neon) - Serverless database
- **JWT** - Authentication
- **Puppeteer** - Web scraping capabilities

### Frontend
- **React 19** - UI framework
- **Vite 5** - Build tool
- **Custom Design System** - Notion-inspired UI
- **Capacitor 8** - Mobile app wrapper

### DevOps
- **Docker** - Containerization
- **GitHub Actions** - CI/CD
- Deployed at subpath `/vela/`

## Project Structure

```
tracker_app/
├── backend/              # Express API server
│   ├── routes/           # API endpoints
│   ├── database.js       # PostgreSQL schema
│   └── server.js         # Entry point
├── frontend-web/         # React application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── design-system/ # UI library
│   │   ├── api.js        # API client
│   │   └── App.jsx       # Main app
│   └── vite.config.js
├── FEATURES.md           # User guide
├── CLAUDE.md             # Developer guide
└── Dockerfile            # Production build
```

## Available Scripts

### Backend
```bash
npm start       # Start production server
npm run dev     # Start with auto-reload (nodemon)
```

### Frontend
```bash
npm run dev     # Development server
npm run build   # Build for web (base: /vela/)
npm run build:mobile  # Build for mobile (base: ./)
npm test        # Run tests
```

### Docker
```bash
docker build -t vela .
docker run -p 3000:3000 --env-file backend/.env vela
```

## Key Features Explained

### Multi-Subject Organization
Create and switch between different subjects (courses, topics) with all data automatically filtered.

### Time Tracking
Log study sessions with activity types (Study, Watch, Read, Practice) and track total time spent.

### Task Management
Create tasks with priorities, deadlines, subtasks, and link them to specific subjects.

### Note-Taking
Rich text notes with folders, tags, and bidirectional linking for building your knowledge graph.

### File Attachments
Upload PDFs, images, or save links. Attach to sessions, notes, or tasks.

### Mobile Features
- Share from any app (YouTube, Chrome) directly to Vela
- Camera integration for quick captures
- Local notifications for task reminders
- Offline support

## Documentation

### For Users
- [FEATURES.md](FEATURES.md) - Complete user guide with workflows and tips

### For Developers
- [CLAUDE.md](CLAUDE.md) - Architecture, patterns, and conventions
- [backend/README.md](backend/README.md) - Backend setup and API docs
- [design-system/README.md](frontend-web/src/design-system/README.md) - UI components

## Database

Vela uses **Neon PostgreSQL** (serverless, free tier):
- 512 MB storage
- 0.5 GB data transfer
- Auto-scaling compute
- SSL required

**Setup:** See [backend/README.md](backend/README.md)

## Deployment

Vela is designed for subpath hosting at `/vela/`:
- Frontend served at `/vela/`
- API at `/vela/api/*`
- Health check at `/vela/health`

**Docker build:**
1. Build React frontend → `dist/`
2. Copy backend + frontend dist
3. Serve static files from Express

**CI/CD:** GitHub Actions automatically builds and deploys on push to main.

## Mobile App

Android app built with Capacitor:

```bash
cd frontend-web
npm run build:mobile
npx cap sync android
npx cap open android
```

**Features:**
- Share target integration
- Camera access
- File system
- Local notifications
- Background sync

## Contributing

1. Read [CLAUDE.md](CLAUDE.md) for architecture and conventions
2. Follow existing code patterns
3. Use the design system for UI
4. Test both web and mobile builds
5. Update documentation

## License

[Your License Here]

## Support

For questions or issues, please open a GitHub issue.

---

**Built with ❤️ for learners everywhere**

**Last Updated:** 2026-02-21
