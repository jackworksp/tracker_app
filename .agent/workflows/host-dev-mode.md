---
description: Start backend and frontend in development mode
---

1. Kill all previous node processes
// turbo
taskkill /F /IM node.exe

1. Start the backend server
// turbo
cd backend; npm run dev

2. Start the frontend server (in a new terminal/background)
// turbo
cd frontend-web; npm run dev
