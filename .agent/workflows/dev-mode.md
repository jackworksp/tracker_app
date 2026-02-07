---
description: Start backend and frontend in development mode
---

# Development Mode Workflow

This workflow starts both the backend server and frontend dev server for local development with hot-reload enabled.

## Prerequisites

- Node.js installed
- Dependencies installed in both `backend` and `frontend-web` directories
- `.env` file configured in `backend` directory

---

## Steps

### 1. Start Backend Server
Navigate to the backend directory and start the development server with auto-reload.

// turbo
```bash
cd backend && npm run dev
```

**Expected Output:**
- `🚀 Universal Study Tracker API running on http://0.0.0.0:3000`
- Database connection confirmation

**Note:** This command will keep running. You'll need to open a new terminal for the next step.

---

### 2. Start Frontend Dev Server
In a **new terminal**, navigate to the frontend-web directory and start the Vite dev server.

// turbo
```bash
cd frontend-web && npm run dev
```

**Expected Output:**
- `VITE v5.x.x ready in XXX ms`
- `➜ Local: http://localhost:5173/`
- `➜ Network: http://192.168.x.x:5173/`

---

## Access Points

Once both servers are running, you can access:

- **Web Application:** http://localhost:5173/
- **API Health Check:** http://localhost:3000/trackapp/health
- **API Base URL:** http://localhost:3000/trackapp/api

**Note:** Vite automatically proxies API requests to the backend (configured in `vite.config.js`).

---

## Stopping the Servers

- **Backend:** Press `Ctrl+C` in the backend terminal
- **Frontend:** Press `Ctrl+C` in the frontend terminal

---

## Troubleshooting

### Port Already in Use

If port 3000 or 5173 is already in use:

```powershell
# Check what's using the port
netstat -ano | findstr :3000
netstat -ano | findstr :5173

# Kill the process (replace <PID> with the process ID)
taskkill /PID <PID> /F
```

### Backend Won't Start

- Verify `.env` file exists in `backend/` directory
- Check database connection settings
- Ensure all dependencies are installed: `cd backend && npm install`

### Frontend Won't Start

- Clear cache and reinstall dependencies:
  ```bash
  cd frontend-web
  rm -rf node_modules package-lock.json
  npm install
  ```

### API Requests Fail

- Verify both servers are running
- Check `vite.config.js` proxy configuration
- Ensure CORS is properly configured in backend
