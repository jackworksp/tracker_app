---
description: Host backend and web app locally
---

# Host Backend and Web App Locally

This workflow guides you through starting the backend server and serving the web application for local development and testing.

## Prerequisites

Ensure you have:
- Node.js installed
- Dependencies installed (`npm install` in both `backend` and `frontend-web` directories)
- Environment variables configured (`.env` file in `backend` directory)

---

## Option A: Development Mode (Recommended for Development)

### 1. Start Backend Server
Navigate to the backend directory and start the server in development mode with auto-reload.

```bash
cd backend
npm run dev
```

**Expected Output:**
- `🚀 Universal Study Tracker API running on http://0.0.0.0:3000`
- Database connection confirmation

### 2. Start Frontend Dev Server
Open a **new terminal**, navigate to the frontend-web directory, and start the Vite dev server.

```bash
cd frontend-web
npm run dev
```

**Expected Output:**
- `VITE v5.x.x ready in XXX ms`
- `➜ Local: http://localhost:5173/`
- `➜ Network: http://192.168.x.x:5173/`

### 3. Access the Application
Open your browser and navigate to:
- **Web App:** `http://localhost:5173/`
- **API Health Check:** `http://localhost:3000/trackapp/health`

**Note:** In dev mode, Vite automatically proxies API requests to the backend (configured in `vite.config.js`).

---

## Option B: Production Mode (For Testing Production Build)

### 1. Start Backend Server
Navigate to the backend directory and start the server in production mode.

```bash
cd backend
npm start
```

**Expected Output:**
- `🚀 Universal Study Tracker API running on http://0.0.0.0:3000`

### 2. Build Frontend for Production
Open a **new terminal**, navigate to the frontend-web directory, and build the production bundle.

```bash
cd frontend-web
npm run build
```

**Expected Output:**
- Build artifacts created in `frontend-web/dist/`
- Build size summary

### 3. Serve Frontend (Optional - Using Backend)
If `NODE_ENV=production` is set, the backend automatically serves the frontend from `/trackapp/`.

To enable this:
```bash
cd backend
set NODE_ENV=production
npm start
```

### 4. Access the Application
Open your browser and navigate to:
- **Web App:** `http://localhost:3000/trackapp/`
- **API Health Check:** `http://localhost:3000/trackapp/health`

---

## Option C: Network Access (For Mobile Testing)

### 1. Get Your Local IP Address
Find your machine's local IP address.

// turbo
```powershell
ipconfig | findstr /i "IPv4"
```

**Note the IP address** (e.g., `192.168.1.5`)

### 2. Start Backend Server
Navigate to the backend directory and start the server.

```bash
cd backend
npm run dev
```

**Note:** The server binds to `0.0.0.0:3000`, making it accessible on your local network.

### 3. Start Frontend Dev Server
Open a **new terminal**, navigate to the frontend-web directory, and start the dev server.

```bash
cd frontend-web
npm run dev
```

### 4. Access from Mobile Device
Ensure your mobile device is on the **same Wi-Fi network**, then access:
- **Web App:** `http://YOUR_LOCAL_IP:5173/` (e.g., `http://192.168.1.5:5173/`)
- **API:** `http://YOUR_LOCAL_IP:3000/trackapp/health`

---

## Troubleshooting

### Backend Won't Start
- **Check if port 3000 is already in use:**
  ```powershell
  netstat -ano | findstr :3000
  ```
- **Kill the process if needed:**
  ```powershell
  taskkill /PID <PID> /F
  ```
- **Verify environment variables:** Ensure `.env` file exists in `backend/` with required variables

### Frontend Build Fails
- **Clear node_modules and reinstall:**
  ```bash
  cd frontend-web
  rm -rf node_modules package-lock.json
  npm install
  ```

### API Requests Fail from Frontend
- **Check CORS configuration:** Ensure backend allows requests from frontend origin
- **Verify API URL:** Check `VITE_API_URL` environment variable or default fallback in `src/api.js`
- **Check network connectivity:** Ensure both backend and frontend are running

### Mobile App Can't Connect
- **Verify firewall settings:** Ensure Windows Firewall allows Node.js connections
- **Check Wi-Fi network:** Ensure mobile device is on the same network
- **Rebuild mobile app with correct API URL:**
  ```bash
  cd frontend-web
  set VITE_API_URL=http://YOUR_LOCAL_IP:3000
  npm run build:mobile
  ```

---

## Stopping the Servers

### Stop Backend
In the backend terminal, press `Ctrl+C`

### Stop Frontend
In the frontend terminal, press `Ctrl+C`

---

## Quick Reference

| Component | Dev Command | Production Command | Default Port |
|-----------|-------------|-------------------|--------------|
| Backend | `npm run dev` | `npm start` | 3000 |
| Frontend | `npm run dev` | `npm run build` + serve | 5173 (dev) |

**API Base Path:** `/trackapp/api`  
**Web App Base Path:** `/trackapp/` (production only)
