# Universal Study Tracker - API Guide

## 🎯 New Multi-Subject Architecture

The app now supports **unlimited subjects**! Create subjects for AWS, Docker, Python, or any topic you're learning.

## 📚 Quick Start

### 1. Create Your First Subject

```bash
# Create AWS Subject
curl -X POST http://localhost:3000/api/subjects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AWS Developer Associate",
    "description": "Preparing for AWS Certified Developer certification",
   "color": "#FF9900",
    "icon": "☁️"
  }'

# Returns: { "id": 1, "name": "AWS Developer Associate", ... }
```

### 2. Seed AWS Topics for the Subject

```bash
curl -X POST http://localhost:3000/api/subjects/1/seed
# Adds 15 AWS topics to subject ID 1
```

### 3. Create More Subjects

```bash
# Docker Certification
curl -X POST http://localhost:3000/api/subjects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Docker & Kubernetes",
    "description": "Container orchestration mastery",
    "color": "#2496ED",
    "icon": "🐳"
  }'

# Python Learning
curl -X POST http://localhost:3000/api/subjects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Python Advanced",
    "description": "Advanced Python techniques",
    "color": "#3776AB",
    "icon": "🐍"
  }'
```

## 🔌 API Endpoints

### Subjects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subjects` | List all subjects with stats |
| POST | `/api/subjects` | Create new subject |
| GET | `/api/subjects/:id` | Get subject with all data |
| PUT | `/api/subjects/:id` | Update subject |
| DELETE | `/api/subjects/:id` | Delete subject |

### Progress (per subject)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/progress/:subject_id` | Get all progress for subject |
| POST | `/api/progress/seed/:subject_id` | Seed AWS topics |

### Topics

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/progress/topics` | Create topic (requires subject_id) |
| PUT | `/api/progress/topics/:id` | Update topic completion |

### Study Sessions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/progress/sessions` | Add study session (requires subject_id) |

### Revision Items

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/progress/revisions` | Add revision item (requires subject_id) |
| PUT | `/api/progress/revisions/:id` | Mark as revised |
| DELETE | `/api/progress/revisions/:id` | Delete revision item |

## 📖 Example Workflows

### Complete Workflow Example

```bash
# 1. Create Subject
curl -X POST http://localhost:3000/api/subjects \
  -H "Content-Type: application/json" \
  -d '{"name": "AWS Developer", "icon": "☁️"}'

# 2. Add Custom Topic
curl -X POST http://localhost:3000/api/progress/topics \
  -H "Content-Type: application/json" \
  -d '{
    "subject_id": 1,
    "name": "Lambda Functions",
    "category": "Serverless"
  }'

# 3. Mark Topic Complete  
curl -X PUT http://localhost:3000/api/progress/topics/1 \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'

# 4. Add Study Session
curl -X POST http://localhost:3000/api/progress/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "subject_id": 1,
    "date": "2026-01-03",
    "day": "Friday",
    "activity": "Studied Lambda",
    "time_spent": 120,
    "topics_covered": "Lambda basics, triggers",
    "notes": "Great session!"
  }'

# 5. Add Revision Item
curl -X POST http://localhost:3000/api/progress/revisions \
  -H "Content-Type: application/json" \
  -d '{
    "subject_id": 1,
    "title": "Lambda pricing model",
    "category": "Serverless"
  }'
```

## 🎨 Subject Icons & Colors

Popular subject suggestions:

- **AWS**: ☁️ #FF9900
- **Docker**: 🐳 #2496ED  
- **Python**: 🐍 #3776AB
- **JavaScript**: 💛 #F7DF1E
- **React**: ⚛️ #61DAFB
- **Node.js**: 🟢 #339933
- **MongoDB**: 🍃 #47A248
- **PostgreSQL**: 🐘 #336791

## 🎯 Next: Update Frontend

The backend is ready! Now we need to update the frontend to:
1. Show subject selector
2. Allow creating new subjects
3. Switch between subjects
4. Display subject-specific data
