# Vela Backend

Backend API for Vela with **Neon PostgreSQL** (Free Serverless Database)

## Prerequisites
- Node.js 16+ installed
- Neon account (free): https://neon.tech

## Setup Instructions

### 1. Create Neon Database (Free)
1. Go to https://console.neon.tech
2. Sign up or log in (free account)
3. Click "Create Project"
4. Copy your connection string (looks like: `postgresql://...@ep-xxx.neon.tech/...`)

### 2. Configure Environment
1. Open `.env` file in this directory
2. Replace `DATABASE_URL` with your Neon connection string

Example:
```
DATABASE_URL=postgresql://alex:AbC123@ep-cool-123.neon.tech/neondb?sslmode=require
GROQ_API_KEY=gsk_your_groq_api_key_here
```

`GROQ_API_KEY` is required for the Ask feature. Keep it only in your local or deployed `.env`; never commit a real key.

### 3. Install Dependencies
```bash
npm install
```

### 4. Start the Server
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

### 5. Initialize Database
Once server is running, seed the initial topics:
```bash
curl -X POST http://localhost:3000/api/progress/seed
```

Or visit in browser: http://localhost:3000/api/progress/seed

## API Endpoints

### Get All Progress
```
GET /api/progress
```

### Update Topic
```
PUT /api/progress/topics/:id
Body: { "completed": true }
```

### Add Study Session
```
POST /api/progress/sessions
Body: {
  "date": "2026-01-03",
  "day": "Friday",
  "activity": "Studied Lambda",
  "time_spent": 120,
  "topics_covered": "Lambda basics",
  "notes": "Great session"
}
```

### Add Revision Item
```
POST /api/progress/revisions
Body: {
  "title": "DynamoDB Indexes",
  "category": "Database"
}
```

### Mark as Revised
```
PUT /api/progress/revisions/:id
```

### Delete Revision Item
```
DELETE /api/progress/revisions/:id
```

## Testing

Visit http://localhost:3000/health to check if server is running

### Database Verification Scripts

#### Verify Tables
Check that all database tables are created correctly:
```bash
node backend/verify_tables.js
```

#### Verify Indexes
Comprehensive index verification with statistics and usage analysis:
```bash
node backend/verify-indexes.js
```

The index verification script provides:
- ✅ Color-coded output (green for existing, red for missing)
- 📊 Index statistics (size, scan count, tuples read/fetched)
- 🎯 Priority levels (HIGH, MEDIUM, LOW) for missing indexes
- 📝 SQL statements to create missing indexes
- 📈 Coverage percentage and summary report
- 🏆 Top 10 most used indexes

Example output:
```
✅ idx_tasks_reminder_time
   Priority: HIGH    Type: btree
   Columns: reminder_time
   Condition: WHERE reminder_dismissed = FALSE
   Size: 16 kB  |  Scans: 0  |  Tuples: 0
```

## Free Tier Limits (Neon)
- ✅ 512 MB storage
- ✅ 0.5 GB data transfer
- ✅ Perfect for personal projects!

## Next Steps
Update your frontend to use this API instead of localStorage!
