# Vela API Reference

Complete API documentation for the Vela backend API.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [Endpoints](#endpoints)
  - [Authentication](#authentication-endpoints)
  - [Subjects](#subjects-endpoints)
  - [Progress/Sessions](#progresssessions-endpoints)
  - [Tasks](#tasks-endpoints)
  - [Goals](#goals-endpoints)
  - [Notes](#notes-endpoints)
  - [Note Folders](#note-folders-endpoints)
  - [Note Links](#note-links-endpoints)
  - [Attachments](#attachments-endpoints)
  - [Attachment Folders](#attachment-folders-endpoints)
  - [Journal](#journal-endpoints)

---

## Overview

**Base URL (Production)**: `/vela/api`
**Base URL (Development)**: `http://localhost:3000/vela/api`

All API requests should be prefixed with the base URL. For example:
- Production: `https://yourdomain.com/vela/api/subjects`
- Development: `http://localhost:3000/vela/api/subjects`

**Content Type**: All requests and responses use `application/json`

---

## Authentication

Vela uses JWT (JSON Web Tokens) for authentication.

### How to Authenticate

1. **Signup or Login** to obtain a JWT token
2. **Include the token** in all subsequent requests using the `Authorization` header:

```http
Authorization: Bearer <your-jwt-token>
```

### Token Details

- **Expires in**: 7 days
- **Stored in**: Client-side (localStorage recommended)
- **JWT Secret**: Configured via `JWT_SECRET` environment variable

### Authentication Errors

| Status Code | Error Message | Description |
|-------------|---------------|-------------|
| 401 | No token provided | Authorization header missing |
| 401 | Invalid or expired token | Token is malformed or expired |
| 401 | Token expired. Please login again. | Token has exceeded 7-day validity |

---

## Rate Limiting

Vela implements rate limiting to prevent abuse:

| Endpoint Type | Rate Limit | Window |
|--------------|------------|---------|
| Auth endpoints (`/auth/login`, `/auth/signup`) | 5 requests | 15 minutes |
| All other API endpoints | 3000 requests | 15 minutes |

When rate limit is exceeded, the API returns:

```json
{
  "error": "Too many requests, please try again later"
}
```

**HTTP Status**: `429 Too Many Requests`

---

## Error Handling

### Standard Error Response Format

```json
{
  "error": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes

| Status Code | Meaning | When Used |
|-------------|---------|-----------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input or missing required fields |
| 401 | Unauthorized | Authentication required or failed |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists or duplicate entry |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error occurred |

---

## Endpoints

---

## Authentication Endpoints

### POST /api/auth/signup

Create a new user account.

**Authentication Required**: No

**Request Body**:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Validation**:
- `name`: Required, non-empty string
- `email`: Required, valid email format
- `password`: Required, minimum 6 characters

**Success Response** (201 Created):

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "user_id": "john@example.com",
    "email": "john@example.com",
    "name": "John Doe",
    "active_subject_id": null,
    "profile_photo_url": null
  }
}
```

**Error Responses**:
- `400`: "Name, email, and password are required"
- `400`: "Invalid email format"
- `400`: "Password must be at least 6 characters long"
- `400`: "User with this email already exists"

---

### POST /api/auth/login

Authenticate an existing user.

**Authentication Required**: No

**Request Body**:

```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Success Response** (200 OK):

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "user_id": "john@example.com",
    "email": "john@example.com",
    "name": "John Doe",
    "active_subject_id": 2,
    "profile_photo_url": "/vela/uploads/profile-123.jpg"
  }
}
```

**Error Responses**:
- `400`: "Email and password are required"
- `401`: "Invalid email or password"
- `401`: "Please sign up to create a password for your account"

---

### GET /api/auth/me

Get current authenticated user's profile.

**Authentication Required**: Yes

**Success Response** (200 OK):

```json
{
  "id": 1,
  "user_id": "john@example.com",
  "email": "john@example.com",
  "name": "John Doe",
  "active_subject_id": 2,
  "profile_photo_url": "/vela/uploads/profile-123.jpg"
}
```

**Error Responses**:
- `401`: "No token provided"
- `401`: "Invalid or expired token"
- `404`: "User not found"

---

### POST /api/auth/upload-photo

Upload a profile photo.

**Authentication Required**: Yes

**Request Type**: `multipart/form-data`

**Form Data**:
- `photo`: Image file (JPG, JPEG, PNG, GIF, WebP)

**File Constraints**:
- Max size: 5MB
- Accepted formats: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`

**Success Response** (200 OK):

```json
{
  "message": "Photo uploaded successfully",
  "profile_photo_url": "/trackapp/uploads/profile-1234567890-123456789.jpg"
}
```

**Error Responses**:
- `400`: "No file uploaded"
- `400`: "Only image files are allowed!"
- `401`: "No token provided"

---

## Subjects Endpoints

### GET /api/subjects

Get all subjects for the authenticated user with pagination.

**Authentication Required**: Yes

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)

**Success Response** (200 OK):

```json
{
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "name": "AWS Solutions Architect",
      "description": "Prepare for AWS SAA certification",
      "color": "#3b82f6",
      "icon": "📚",
      "created_at": "2026-01-15T10:30:00.000Z",
      "updated_at": "2026-01-15T10:30:00.000Z",
      "topic_count": "15",
      "completed_count": "8",
      "session_count": "42"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 3,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

---

### GET /api/subjects/:id

Get a single subject with all related data.

**Authentication Required**: Yes

**URL Parameters**:
- `id`: Subject ID

**Query Parameters**:
- `page` (optional): Page number for nested data (default: 1)
- `limit` (optional): Items per page (default: 100, max: 200)

**Success Response** (200 OK):

```json
{
  "subject": {
    "id": 1,
    "user_id": 1,
    "name": "AWS Solutions Architect",
    "description": "Prepare for AWS SAA certification",
    "color": "#3b82f6",
    "icon": "📚",
    "created_at": "2026-01-15T10:30:00.000Z",
    "updated_at": "2026-01-15T10:30:00.000Z"
  },
  "topics": [
    {
      "id": 1,
      "subject_id": 1,
      "name": "EC2",
      "category": "Compute",
      "completed": false
    }
  ],
  "sessions": [
    {
      "id": 1,
      "subject_id": 1,
      "date": "2026-01-15",
      "day": "Monday",
      "activity": "Studied EC2 Instances",
      "time_spent": 120,
      "topics_covered": "Instance types, pricing",
      "notes": "Focused on t2 vs t3",
      "type": "STUDY",
      "url": null,
      "goal_id": null,
      "folder_id": null,
      "revision_count": 0
    }
  ],
  "revisionItems": [],
  "pagination": {
    "page": 1,
    "limit": 100,
    "topicsTotal": 15,
    "topicsTotalPages": 1,
    "sessionsTotal": 42,
    "sessionsTotalPages": 1,
    "revisionItemsTotal": 0,
    "revisionItemsTotalPages": 0,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

**Error Responses**:
- `404`: "Subject not found"

---

### POST /api/subjects

Create a new subject.

**Authentication Required**: Yes

**Request Body**:

```json
{
  "name": "React Development",
  "description": "Master React 19",
  "color": "#61dafb",
  "icon": "⚛️"
}
```

**Validation**:
- `name`: Required, non-empty string
- `description`: Optional (default: "")
- `color`: Optional (default: "#3b82f6")
- `icon`: Optional (default: "📚")

**Success Response** (201 Created):

```json
{
  "id": 2,
  "user_id": 1,
  "name": "React Development",
  "description": "Master React 19",
  "color": "#61dafb",
  "icon": "⚛️",
  "created_at": "2026-02-21T10:00:00.000Z",
  "updated_at": "2026-02-21T10:00:00.000Z"
}
```

**Error Responses**:
- `400`: "Subject name is required"
- `400`: "Subject name already exists"

---

### PUT /api/subjects/:id

Update an existing subject.

**Authentication Required**: Yes

**URL Parameters**:
- `id`: Subject ID

**Request Body** (all fields optional):

```json
{
  "name": "React & Next.js",
  "description": "Master React 19 and Next.js 15",
  "color": "#000000",
  "icon": "▲"
}
```

**Success Response** (200 OK):

```json
{
  "id": 2,
  "user_id": 1,
  "name": "React & Next.js",
  "description": "Master React 19 and Next.js 15",
  "color": "#000000",
  "icon": "▲",
  "created_at": "2026-02-21T10:00:00.000Z",
  "updated_at": "2026-02-21T11:30:00.000Z"
}
```

**Error Responses**:
- `404`: "Subject not found"

---

### DELETE /api/subjects/:id

Delete a subject.

**Authentication Required**: Yes

**URL Parameters**:
- `id`: Subject ID

**Success Response** (200 OK):

```json
{
  "message": "Subject deleted successfully",
  "hadData": true
}
```

**Note**: Deleting a subject cascades to related topics, sessions, and other data.

**Error Responses**:
- `404`: "Subject not found"

---

## Progress/Sessions Endpoints

### GET /api/progress/all

Get all progress data (global view) with pagination and filtering.

**Authentication Required**: No (public endpoint)

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)
- `source` (optional): Filter by source - "youtube" or "instagram"
- `start_date` (optional): Filter sessions from date (YYYY-MM-DD)
- `end_date` (optional): Filter sessions to date (YYYY-MM-DD)
- `goal_id` (optional): Filter by goal ID

**Success Response** (200 OK):

```json
{
  "topics": [],
  "sessions": [
    {
      "id": 1,
      "subject_id": 1,
      "date": "2026-02-20",
      "day": "Thursday",
      "activity": "Watched AWS Lambda tutorial",
      "time_spent": 45,
      "topics_covered": "Lambda basics, event triggers",
      "notes": "Great explanation",
      "type": "WATCH",
      "url": "https://youtube.com/watch?v=xyz",
      "goal_id": 1,
      "folder_id": null,
      "revision_count": 0,
      "attachment_count": 2
    }
  ],
  "revisionItems": [],
  "pagination": {
    "page": 1,
    "limit": 50,
    "topicsTotal": 0,
    "topicsTotalPages": 0,
    "sessionsTotal": 150,
    "sessionsTotalPages": 3,
    "revisionItemsTotal": 0,
    "revisionItemsTotalPages": 0,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### GET /api/progress/:subject_id

Get progress data for a specific subject.

**Authentication Required**: No (public endpoint)

**URL Parameters**:
- `subject_id`: Subject ID

**Query Parameters**: Same as `/api/progress/all`

**Success Response**: Same structure as `/api/progress/all`

---

### POST /api/progress/sessions

Create a new study session.

**Authentication Required**: No (public endpoint)

**Request Body**:

```json
{
  "subject_id": 1,
  "date": "2026-02-21",
  "day": "Friday",
  "activity": "Practiced DynamoDB queries",
  "time_spent": 90,
  "topics_covered": "Query, Scan, GSI",
  "notes": "Need more practice with GSI",
  "type": "PRACTICE",
  "url": null,
  "goal_id": 1,
  "folder_id": null
}
```

**Field Details**:
- `subject_id`: Optional (can be null for general sessions)
- `date`: Required (YYYY-MM-DD)
- `day`: Required (e.g., "Monday")
- `activity`: Required, session description
- `time_spent`: Required, minutes spent
- `topics_covered`: Optional, topics studied
- `notes`: Optional, session notes
- `type`: Optional (default: "STUDY") - values: "STUDY", "WATCH", "READ", "PRACTICE", "LISTEN"
- `url`: Optional, related URL
- `goal_id`: Optional, linked goal
- `folder_id`: Optional, attachment folder

**Success Response** (201 Created):

```json
{
  "id": 100,
  "subject_id": 1,
  "date": "2026-02-21",
  "day": "Friday",
  "activity": "Practiced DynamoDB queries",
  "time_spent": 90,
  "topics_covered": "Query, Scan, GSI",
  "notes": "Need more practice with GSI",
  "type": "PRACTICE",
  "url": null,
  "goal_id": 1,
  "folder_id": null,
  "revision_count": 0
}
```

---

### PUT /api/progress/sessions/:id

Update a study session.

**Authentication Required**: No (public endpoint)

**URL Parameters**:
- `id`: Session ID

**Request Body** (all fields optional):

```json
{
  "activity": "Updated session description",
  "time_spent": 120,
  "topics_covered": "Updated topics",
  "notes": "Updated notes",
  "type": "STUDY",
  "url": "https://example.com",
  "goal_id": 2,
  "date": "2026-02-21",
  "folder_id": 5
}
```

**Success Response** (200 OK): Updated session object

**Error Responses**:
- `404`: "Session not found"

---

### DELETE /api/progress/sessions/:id

Delete a study session.

**Authentication Required**: No (public endpoint)

**URL Parameters**:
- `id`: Session ID

**Success Response** (200 OK):

```json
{
  "message": "Session deleted successfully"
}
```

**Error Responses**:
- `404`: "Session not found"

---

### POST /api/progress/sessions/:id/revise

Increment revision count for a session.

**Authentication Required**: No (public endpoint)

**URL Parameters**:
- `id`: Session ID

**Success Response** (200 OK):

```json
{
  "id": 100,
  "revision_count": 2,
  ...
}
```

**Error Responses**:
- `404`: "Session not found"

---

### PUT /api/progress/topics/:id

Update topic completion status.

**Authentication Required**: No (public endpoint)

**URL Parameters**:
- `id`: Topic ID

**Request Body**:

```json
{
  "completed": true
}
```

**Success Response** (200 OK):

```json
{
  "id": 1,
  "subject_id": 1,
  "name": "EC2",
  "category": "Compute",
  "completed": true
}
```

**Error Responses**:
- `404`: "Topic not found"

---

### POST /api/progress/topics

Create a new topic.

**Authentication Required**: No (public endpoint)

**Request Body**:

```json
{
  "subject_id": 1,
  "name": "Lambda",
  "category": "Compute",
  "completed": false
}
```

**Validation**:
- `subject_id`: Required
- `name`: Required
- `category`: Optional (default: "General")
- `completed`: Optional (default: false)

**Success Response** (201 Created):

```json
{
  "id": 16,
  "subject_id": 1,
  "name": "Lambda",
  "category": "Compute",
  "completed": false
}
```

**Error Responses**:
- `400`: "subject_id and name are required"

---

### POST /api/progress/revisions

Create a new revision item.

**Authentication Required**: No (public endpoint)

**Request Body**:

```json
{
  "subject_id": 1,
  "title": "Review DynamoDB streams",
  "category": "Database"
}
```

**Validation**:
- `subject_id`: Required
- `title`: Required
- `category`: Optional

**Success Response** (201 Created):

```json
{
  "id": 1,
  "subject_id": 1,
  "title": "Review DynamoDB streams",
  "category": "Database",
  "revision_count": 0,
  "last_revised": null,
  "created_at": "2026-02-21T10:00:00.000Z"
}
```

---

### PUT /api/progress/revisions/:id

Mark revision item as revised (increments count).

**Authentication Required**: No (public endpoint)

**URL Parameters**:
- `id`: Revision item ID

**Success Response** (200 OK):

```json
{
  "id": 1,
  "subject_id": 1,
  "title": "Review DynamoDB streams",
  "category": "Database",
  "revision_count": 1,
  "last_revised": "2026-02-21",
  "created_at": "2026-02-21T10:00:00.000Z"
}
```

**Error Responses**:
- `404`: "Revision item not found"

---

### DELETE /api/progress/revisions/:id

Delete a revision item.

**Authentication Required**: No (public endpoint)

**URL Parameters**:
- `id`: Revision item ID

**Success Response** (200 OK):

```json
{
  "message": "Revision item deleted successfully"
}
```

**Error Responses**:
- `404`: "Revision item not found"

---

### POST /api/progress/seed/:subject_id

Seed initial AWS topics for a subject (development/testing).

**Authentication Required**: No (public endpoint)

**URL Parameters**:
- `subject_id`: Subject ID

**Success Response** (200 OK):

```json
{
  "message": "Topics seeded successfully",
  "count": 15
}
```

**Note**: Seeds 15 AWS-related topics (DynamoDB, Lambda, S3, etc.)

---

## Tasks Endpoints

### GET /api/tasks

Get all tasks (global view) with pagination.

**Authentication Required**: Yes

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)
- `goal_id` (optional): Filter by goal ID

**Success Response** (200 OK):

```json
{
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "subject_id": 1,
      "parent_task_id": null,
      "type": "TASK",
      "title": "Complete AWS practice exam",
      "url": null,
      "content": "Take full practice exam",
      "tags": ["aws", "exam"],
      "completed": false,
      "status": "IN_PROGRESS",
      "goal_id": 1,
      "attachment_url": null,
      "subtasks": [],
      "resources": [],
      "folder_id": null,
      "reminder_time": null,
      "alert_type": "basic",
      "reminder_dismissed": false,
      "reminder_snoozed_until": null,
      "rating": null,
      "created_at": "2026-02-20T10:00:00.000Z",
      "updated_at": "2026-02-20T10:00:00.000Z",
      "linked_notes_count": 3
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 25,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

**Note**: Only returns top-level tasks (parent_task_id IS NULL)

---

### GET /api/tasks/:subjectId

Get all tasks for a specific subject.

**Authentication Required**: Yes

**URL Parameters**:
- `subjectId`: Subject ID

**Query Parameters**: Same as `/api/tasks`

**Success Response**: Same structure as `/api/tasks`

---

### GET /api/tasks/:id/subtasks

Get all subtasks for a task.

**Authentication Required**: Yes

**URL Parameters**:
- `id`: Parent task ID

**Success Response** (200 OK):

```json
[
  {
    "id": 10,
    "user_id": 1,
    "subject_id": 1,
    "parent_task_id": 1,
    "type": "TASK",
    "title": "Review EC2 pricing",
    "completed": false,
    "status": "TODO",
    "created_at": "2026-02-20T11:00:00.000Z"
  },
  {
    "id": 11,
    "user_id": 1,
    "subject_id": 1,
    "parent_task_id": 1,
    "type": "TASK",
    "title": "Practice VPC setup",
    "completed": true,
    "status": "DONE",
    "created_at": "2026-02-20T12:00:00.000Z"
  }
]
```

**Error Responses**:
- `404`: "Parent task not found"

---

### POST /api/tasks

Create a new task.

**Authentication Required**: Yes

**Request Body**:

```json
{
  "subject_id": 1,
  "type": "TASK",
  "title": "Study S3 lifecycle policies",
  "url": null,
  "content": "Read AWS docs and create examples",
  "tags": ["aws", "s3", "storage"],
  "goal_id": 1,
  "attachment_url": null,
  "status": "TODO",
  "subtasks": [],
  "resources": [],
  "folder_id": null
}
```

**Field Details**:
- `subject_id`: Optional (auto-assigned to default subject if not provided)
- `type`: Optional (default: "TASK") - values: "TASK", "WATCH", "READ", "NOTE"
- `title`: Required
- `url`: Optional, related URL
- `content`: Optional, task description
- `tags`: Optional, array of strings
- `goal_id`: Optional, linked goal
- `attachment_url`: Optional, attachment URL
- `status`: Optional (default: "TODO") - values: "TODO", "IN_PROGRESS", "DONE"
- `subtasks`: Optional, JSON array
- `resources`: Optional, JSON array
- `folder_id`: Optional, attachment folder

**Success Response** (201 Created):

```json
{
  "id": 26,
  "user_id": 1,
  "subject_id": 1,
  "parent_task_id": null,
  "type": "TASK",
  "title": "Study S3 lifecycle policies",
  "url": null,
  "content": "Read AWS docs and create examples",
  "tags": ["aws", "s3", "storage"],
  "completed": false,
  "status": "TODO",
  "goal_id": 1,
  "attachment_url": null,
  "subtasks": "[]",
  "resources": "[]",
  "folder_id": null,
  "reminder_time": null,
  "alert_type": "basic",
  "reminder_dismissed": false,
  "reminder_snoozed_until": null,
  "rating": null,
  "created_at": "2026-02-21T10:00:00.000Z",
  "updated_at": "2026-02-21T10:00:00.000Z"
}
```

**Error Responses**:
- `400`: "Title is required"

---

### PUT /api/tasks/:id

Update a task.

**Authentication Required**: Yes

**URL Parameters**:
- `id`: Task ID

**Request Body** (all fields optional):

```json
{
  "completed": true,
  "title": "Updated task title",
  "url": "https://example.com",
  "content": "Updated content",
  "tags": ["updated", "tags"],
  "rating": 5,
  "goal_id": 2,
  "attachment_url": "https://attachment.com",
  "status": "DONE",
  "subtasks": [],
  "resources": [],
  "folder_id": 3
}
```

**Success Response** (200 OK): Updated task object

**Note**: Setting `status` to "DONE" automatically sets `completed` to true

**Error Responses**:
- `404`: "Task not found"

---

### DELETE /api/tasks/:id

Delete a task.

**Authentication Required**: Yes

**URL Parameters**:
- `id`: Task ID

**Success Response** (200 OK):

```json
{
  "success": true,
  "id": 26
}
```

**Error Responses**:
- `404`: "Task not found"

---

### PUT /api/tasks/:id/convert-to-subtask

Convert a task to a subtask of another task.

**Authentication Required**: Yes

**URL Parameters**:
- `id`: Task ID to convert

**Request Body**:

```json
{
  "parent_task_id": 5
}
```

**Success Response** (200 OK): Updated task object with `parent_task_id` set

**Error Responses**:
- `400`: "parent_task_id is required"
- `404`: "One or both tasks not found"
- `400`: "Cannot create circular reference"

---

### PUT /api/tasks/:id/remove-from-subtask

Promote a subtask to a top-level task.

**Authentication Required**: Yes

**URL Parameters**:
- `id`: Subtask ID

**Success Response** (200 OK): Updated task object with `parent_task_id` set to null

**Error Responses**:
- `404`: "Task not found"

---

### GET /api/tasks/reminders/pending

Get all pending reminders for the current user.

**Authentication Required**: Yes

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)

**Success Response** (200 OK):

```json
{
  "data": [
    {
      "id": 15,
      "title": "Submit assignment",
      "reminder_time": "2026-02-21T15:00:00.000Z",
      "alert_type": "persistent",
      "reminder_dismissed": false,
      "reminder_snoozed_until": null,
      "completed": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 3,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

**Note**: Returns only tasks where:
- `reminder_time` is set and <= current time
- `reminder_dismissed` is false
- `reminder_snoozed_until` is null or <= current time
- `completed` is false

---

### PUT /api/tasks/:id/reminder

Set or update a reminder for a task.

**Authentication Required**: Yes

**URL Parameters**:
- `id`: Task ID

**Request Body**:

```json
{
  "reminder_time": "2026-02-22T09:00:00.000Z",
  "alert_type": "persistent"
}
```

**Field Details**:
- `reminder_time`: Required, ISO 8601 datetime
- `alert_type`: Optional (default: "basic") - values: "basic", "persistent"

**Success Response** (200 OK): Updated task object

**Error Responses**:
- `400`: "Invalid alert type. Must be 'basic' or 'persistent'"
- `404`: "Task not found"

---

### POST /api/tasks/:id/reminder/snooze

Snooze a task reminder.

**Authentication Required**: Yes

**URL Parameters**:
- `id`: Task ID

**Request Body**:

```json
{
  "snooze_minutes": 30
}
```

**Success Response** (200 OK): Updated task object with `reminder_snoozed_until` set

**Error Responses**:
- `400`: "Invalid snooze duration"
- `404`: "Task not found"

---

### POST /api/tasks/:id/reminder/dismiss

Dismiss a task reminder.

**Authentication Required**: Yes

**URL Parameters**:
- `id`: Task ID

**Success Response** (200 OK): Updated task object with `reminder_dismissed` set to true

**Error Responses**:
- `404`: "Task not found"

---

### DELETE /api/tasks/:id/reminder

Remove/clear a reminder from a task.

**Authentication Required**: Yes

**URL Parameters**:
- `id`: Task ID

**Success Response** (200 OK): Updated task object with reminder fields cleared

**Error Responses**:
- `404`: "Task not found"

---

## Goals Endpoints

### GET /api/goals

Get all goals for the authenticated user.

**Authentication Required**: Yes

**Success Response** (200 OK):

```json
[
  {
    "id": 1,
    "user_id": 1,
    "title": "Pass AWS Solutions Architect Exam",
    "description": "Get certified by end of Q1",
    "category": "EDUCATION",
    "status": "IN_PROGRESS",
    "target_date": "2026-03-31",
    "image_url": null,
    "target_hours": 100,
    "created_at": "2026-01-01T00:00:00.000Z",
    "updated_at": "2026-02-21T10:00:00.000Z",
    "total_minutes": "2400"
  }
]
```

**Field Details**:
- `total_minutes`: Aggregated study time from linked sessions

---

### POST /api/goals

Create a new goal.

**Authentication Required**: Yes

**Request Body**:

```json
{
  "title": "Learn React 19",
  "description": "Build 3 projects with React 19",
  "category": "EDUCATION",
  "status": "PLANNING",
  "target_date": "2026-06-30",
  "image_url": "https://example.com/image.jpg",
  "target_hours": 80
}
```

**Validation**:
- `title`: Required
- `category`: Optional (default: "PERSONAL") - values: "CAREER", "HEALTH", "FINANCE", "EDUCATION", "PERSONAL"
- `status`: Optional (default: "PLANNING") - values: "PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED"
- `target_date`: Optional, YYYY-MM-DD format
- `image_url`: Optional
- `target_hours`: Optional (default: 100)

**Success Response** (201 Created):

```json
{
  "id": 2,
  "user_id": 1,
  "title": "Learn React 19",
  "description": "Build 3 projects with React 19",
  "category": "EDUCATION",
  "status": "PLANNING",
  "target_date": "2026-06-30",
  "image_url": "https://example.com/image.jpg",
  "target_hours": 80,
  "created_at": "2026-02-21T10:00:00.000Z",
  "updated_at": "2026-02-21T10:00:00.000Z"
}
```

**Error Responses**:
- `400`: "Title is required"

---

### PUT /api/goals/:id

Update a goal.

**Authentication Required**: Yes

**URL Parameters**:
- `id`: Goal ID

**Request Body** (all fields optional):

```json
{
  "title": "Master React 19",
  "description": "Build 5 projects",
  "category": "EDUCATION",
  "status": "IN_PROGRESS",
  "target_date": "2026-07-31",
  "image_url": "https://example.com/new-image.jpg",
  "target_hours": 120
}
```

**Success Response** (200 OK): Updated goal object

**Error Responses**:
- `404`: "Goal not found"

---

### DELETE /api/goals/:id

Delete a goal.

**Authentication Required**: Yes

**URL Parameters**:
- `id`: Goal ID

**Success Response** (200 OK):

```json
{
  "success": true,
  "id": 2
}
```

**Error Responses**:
- `404`: "Goal not found"

---

## Notes Endpoints

### GET /api/notes

Get all notes for the authenticated user.

**Authentication Required**: Yes

**Query Parameters**:
- `folder_id` (optional): Filter by folder (use "null" for notes without folder)
- `subject_id` (optional): Filter by subject

**Success Response** (200 OK):

```json
[
  {
    "id": 1,
    "user_id": 1,
    "folder_id": 2,
    "subject_id": 1,
    "title": "DynamoDB Notes",
    "content": "Key concepts:\n- Partition key\n- Sort key\n- GSI vs LSI",
    "tags": ["aws", "database", "nosql"],
    "is_pinned": true,
    "color": "#fef3c7",
    "created_at": "2026-02-15T10:00:00.000Z",
    "updated_at": "2026-02-21T09:00:00.000Z"
  }
]
```

**Notes**:
- Results are ordered by `is_pinned DESC, updated_at DESC`
- Pinned notes appear first

---

### POST /api/notes

Create a new note.

**Authentication Required**: Yes

**Request Body**:

```json
{
  "title": "Lambda Best Practices",
  "content": "1. Use environment variables\n2. Minimize cold starts\n3. Use layers for dependencies",
  "tags": ["aws", "lambda", "serverless"],
  "is_pinned": false,
  "color": "#fef3c7",
  "folder_id": 2,
  "subject_id": 1
}
```

**Validation**:
- `title`: Required, non-empty after trimming
- `content`: Optional (default: "")
- `tags`: Optional (default: [])
- `is_pinned`: Optional (default: false)
- `color`: Optional (default: "#ffffff")
- `folder_id`: Optional, must exist if provided
- `subject_id`: Optional

**Success Response** (201 Created):

```json
{
  "id": 15,
  "user_id": 1,
  "folder_id": 2,
  "subject_id": 1,
  "title": "Lambda Best Practices",
  "content": "1. Use environment variables\n2. Minimize cold starts\n3. Use layers for dependencies",
  "tags": ["aws", "lambda", "serverless"],
  "is_pinned": false,
  "color": "#fef3c7",
  "created_at": "2026-02-21T10:00:00.000Z",
  "updated_at": "2026-02-21T10:00:00.000Z"
}
```

**Error Responses**:
- `400`: "Note title is required"
- `404`: "Folder not found"

---

### PUT /api/notes/:id

Update a note.

**Authentication Required**: Yes

**URL Parameters**:
- `id`: Note ID

**Request Body**:

```json
{
  "title": "Updated Lambda Best Practices",
  "content": "Updated content",
  "tags": ["updated", "tags"],
  "is_pinned": true,
  "color": "#fecaca",
  "folder_id": 3,
  "subject_id": 2
}
```

**Success Response** (200 OK): Updated note object

**Error Responses**:
- `404`: "Note not found"
- `404`: "Folder not found"

---

### DELETE /api/notes/:id

Delete a note.

**Authentication Required**: Yes

**URL Parameters**:
- `id`: Note ID

**Success Response** (200 OK):

```json
{
  "message": "Note deleted successfully"
}
```

**Error Responses**:
- `404`: "Note not found"

---

### POST /api/notes/:id/move

Move a note to a different folder.

**Authentication Required**: Yes

**URL Parameters**:
- `id`: Note ID

**Request Body**:

```json
{
  "folder_id": 5
}
```

**Note**: Set `folder_id` to `null` to remove from folder

**Success Response** (200 OK): Updated note object

**Error Responses**:
- `404`: "Note not found"
- `404`: "Folder not found"

---

### POST /api/notes/:id/copy

Copy a note (optionally to a different folder).

**Authentication Required**: Yes

**URL Parameters**:
- `id`: Note ID

**Request Body**:

```json
{
  "folder_id": 3
}
```

**Note**: If `folder_id` is not provided, copies to the same folder as original

**Success Response** (201 Created):

```json
{
  "id": 16,
  "user_id": 1,
  "folder_id": 3,
  "subject_id": 1,
  "title": "Lambda Best Practices (Copy)",
  "content": "1. Use environment variables\n2. Minimize cold starts\n3. Use layers for dependencies",
  "tags": ["aws", "lambda", "serverless"],
  "is_pinned": false,
  "color": "#fef3c7",
  "created_at": "2026-02-21T11:00:00.000Z",
  "updated_at": "2026-02-21T11:00:00.000Z"
}
```

**Error Responses**:
- `404`: "Note not found"
- `404`: "Folder not found"

---

## Note Folders Endpoints

### GET /api/note-folders

Get all note folders for the authenticated user.

**Authentication Required**: Yes

**Success Response** (200 OK):

```json
[
  {
    "id": 1,
    "user_id": 1,
    "name": "AWS Notes",
    "parent_id": null,
    "created_at": "2026-02-01T10:00:00.000Z",
    "updated_at": "2026-02-01T10:00:00.000Z"
  },
  {
    "id": 2,
    "user_id": 1,
    "name": "Database",
    "parent_id": 1,
    "created_at": "2026-02-05T10:00:00.000Z",
    "updated_at": "2026-02-05T10:00:00.000Z"
  }
]
```

**Note**: Results are ordered by `name ASC`

---

### GET /api/note-folders/:id

Get a specific note folder.

**Authentication Required**: Yes

**URL Parameters**:
- `id`: Folder ID

**Success Response** (200 OK):

```json
{
  "id": 2,
  "user_id": 1,
  "name": "Database",
  "parent_id": 1,
  "created_at": "2026-02-05T10:00:00.000Z",
  "updated_at": "2026-02-05T10:00:00.000Z"
}
```

**Error Responses**:
- `404`: "Folder not found"

---

### POST /api/note-folders

Create a new note folder.

**Authentication Required**: Yes

**Request Body**:

```json
{
  "name": "Serverless",
  "parent_id": 1
}
```

**Validation**:
- `name`: Required, non-empty after trimming
- `parent_id`: Optional, must exist if provided

**Success Response** (201 Created):

```json
{
  "id": 3,
  "user_id": 1,
  "name": "Serverless",
  "parent_id": 1,
  "created_at": "2026-02-21T10:00:00.000Z",
  "updated_at": "2026-02-21T10:00:00.000Z"
}
```

**Error Responses**:
- `400`: "Folder name is required"
- `404`: "Parent folder not found"

---

### PUT /api/note-folders/:id

Update a note folder's name.

**Authentication Required**: Yes

**URL Parameters**:
- `id`: Folder ID

**Request Body**:

```json
{
  "name": "Serverless Computing"
}
```

**Success Response** (200 OK): Updated folder object

**Error Responses**:
- `400`: "Folder name is required"
- `404`: "Folder not found"

---

### DELETE /api/note-folders/:id

Delete a note folder.

**Authentication Required**: Yes

**URL Parameters**:
- `id`: Folder ID

**Success Response** (200 OK):

```json
{
  "message": "Folder deleted successfully"
}
```

**Error Responses**:
- `404`: "Folder not found"
- `400`: "Cannot delete folder that contains notes or subfolders" (with counts)

**Note**: Folder must be empty (no notes or subfolders) to be deleted

---

## Note Links Endpoints

### GET /api/note-links/task/:taskId

Get all notes linked to a task.

**Authentication Required**: Yes

**URL Parameters**:
- `taskId`: Task ID

**Success Response** (200 OK):

```json
[
  {
    "id": 5,
    "user_id": 1,
    "folder_id": 2,
    "subject_id": 1,
    "title": "DynamoDB Query Examples",
    "content": "SELECT * FROM...",
    "tags": ["aws", "database"],
    "is_pinned": false,
    "color": "#fef3c7",
    "created_at": "2026-02-10T10:00:00.000Z",
    "updated_at": "2026-02-15T10:00:00.000Z",
    "linked_at": "2026-02-20T12:00:00.000Z"
  }
]
```

**Error Responses**:
- `404`: "Task not found"

---

### POST /api/note-links/task/:taskId/note/:noteId

Link a note to a task.

**Authentication Required**: Yes

**URL Parameters**:
- `taskId`: Task ID
- `noteId`: Note ID

**Success Response** (201 Created):

```json
{
  "id": 10,
  "note_id": 5,
  "task_id": 8,
  "created_at": "2026-02-21T10:00:00.000Z"
}
```

**Error Responses**:
- `404`: "Task not found"
- `404`: "Note not found"
- `409`: "Note is already linked to this task"

---

### DELETE /api/note-links/task/:taskId/note/:noteId

Unlink a note from a task.

**Authentication Required**: Yes

**URL Parameters**:
- `taskId`: Task ID
- `noteId`: Note ID

**Success Response** (200 OK):

```json
{
  "message": "Note unlinked from task successfully"
}
```

**Error Responses**:
- `404`: "Task or note not found"
- `404`: "Link not found"

---

### GET /api/note-links/session/:sessionId

Get all notes linked to a session.

**Authentication Required**: Yes

**URL Parameters**:
- `sessionId`: Session ID

**Success Response** (200 OK): Same structure as task notes

**Error Responses**:
- `404`: "Session not found"

---

### POST /api/note-links/session/:sessionId/note/:noteId

Link a note to a session.

**Authentication Required**: Yes

**URL Parameters**:
- `sessionId`: Session ID
- `noteId`: Note ID

**Success Response** (201 Created):

```json
{
  "id": 15,
  "note_id": 7,
  "session_id": 42,
  "created_at": "2026-02-21T10:00:00.000Z"
}
```

**Error Responses**:
- `404`: "Session not found"
- `404`: "Note not found"
- `409`: "Note is already linked to this session"

---

### DELETE /api/note-links/session/:sessionId/note/:noteId

Unlink a note from a session.

**Authentication Required**: Yes

**URL Parameters**:
- `sessionId`: Session ID
- `noteId`: Note ID

**Success Response** (200 OK):

```json
{
  "message": "Note unlinked from session successfully"
}
```

**Error Responses**:
- `404`: "Session or note not found"
- `404`: "Link not found"

---

### GET /api/note-links/note/:noteId

Get all tasks and sessions linked to a note.

**Authentication Required**: Yes

**URL Parameters**:
- `noteId`: Note ID

**Success Response** (200 OK):

```json
{
  "tasks": [
    {
      "id": 8,
      "title": "Practice DynamoDB queries",
      "completed": false,
      "linked_at": "2026-02-20T12:00:00.000Z"
    }
  ],
  "sessions": [
    {
      "id": 42,
      "activity": "Studied DynamoDB",
      "time_spent": 90,
      "linked_at": "2026-02-20T15:00:00.000Z"
    }
  ]
}
```

**Error Responses**:
- `404`: "Note not found"

---

## Attachments Endpoints

### GET /api/attachments

Get all attachments with filtering and pagination.

**Authentication Required**: Yes

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)
- `subject_id` (optional): Filter by subject
- `type` (optional): Filter by type - "url" or "note"
- `source` (optional): Filter by source - "task", "session", or "standalone"
- `search` (optional): Search in title, URL, or note content
- `folder_id` (optional): Filter by attachment folder

**Success Response** (200 OK):

```json
{
  "data": [
    {
      "id": "attachment-1",
      "type": "url",
      "source": "standalone",
      "source_id": 1,
      "title": "AWS Lambda Documentation",
      "url": "https://docs.aws.amazon.com/lambda",
      "note_data": null,
      "subject_id": 1,
      "subject_name": "AWS Solutions Architect",
      "folder_id": 2,
      "folder_name": "Documentation",
      "created_at": "2026-02-20T10:00:00.000Z",
      "metadata": {
        "platform": "link",
        "attachment_type": "link"
      }
    },
    {
      "id": "task-5",
      "type": "url",
      "source": "task",
      "source_id": 5,
      "title": "Watch DynamoDB tutorial",
      "url": "https://youtube.com/watch?v=xyz",
      "note_data": null,
      "subject_id": 1,
      "subject_name": "AWS Solutions Architect",
      "folder_id": null,
      "folder_name": null,
      "created_at": "2026-02-19T10:00:00.000Z",
      "metadata": {
        "completed": false,
        "rating": null,
        "task_type": "WATCH",
        "goal_id": 1
      }
    },
    {
      "id": "note-task-10",
      "type": "note",
      "source": "task",
      "source_id": 8,
      "title": "Practice DynamoDB queries",
      "url": null,
      "note_data": {
        "id": 7,
        "title": "DynamoDB Query Examples",
        "content": "SELECT * FROM...",
        "tags": ["aws", "database"]
      },
      "subject_id": 1,
      "subject_name": "AWS Solutions Architect",
      "folder_id": null,
      "folder_name": null,
      "created_at": "2026-02-20T12:00:00.000Z",
      "metadata": {
        "completed": false,
        "task_type": "TASK",
        "note_id": 7
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "metadata": {
    "filters": {
      "subject_id": null,
      "type": null,
      "source": null,
      "search": null,
      "folder_id": null
    }
  }
}
```

**Attachment ID Formats**:
- `attachment-{id}`: Standalone attachment
- `task-{id}`: Task with attachment_url
- `task-url-{id}`: Task of type WATCH/READ with url
- `session-{id}`: Session with URL
- `note-task-{id}`: Note linked to task
- `note-session-{id}`: Note linked to session

---

### POST /api/attachments

Create a new standalone attachment.

**Authentication Required**: Yes

**Request Body**:

```json
{
  "title": "AWS Best Practices Guide",
  "url": "https://docs.aws.amazon.com/best-practices",
  "subject_id": 1,
  "platform": "link"
}
```

**Validation**:
- `title`: Required
- `url`: Required
- `subject_id`: Optional
- `platform`: Optional, auto-detected from URL (youtube, instagram, google-drive, or link)

**Success Response** (201 Created):

```json
{
  "success": true,
  "message": "Attachment created successfully",
  "data": {
    "id": 25,
    "user_id": 1,
    "subject_id": 1,
    "title": "AWS Best Practices Guide",
    "url": "https://docs.aws.amazon.com/best-practices",
    "type": "link",
    "platform": "link",
    "created_at": "2026-02-21T10:00:00.000Z",
    "updated_at": "2026-02-21T10:00:00.000Z"
  }
}
```

**Error Responses**:
- `400`: "Title and URL are required"

---

### DELETE /api/attachments/:id

Delete a standalone attachment.

**Authentication Required**: Yes

**URL Parameters**:
- `id`: Attachment ID (must be in format "attachment-{id}")

**Success Response** (200 OK):

```json
{
  "success": true,
  "message": "Attachment deleted successfully"
}
```

**Error Responses**:
- `400`: "Cannot delete attachments from tasks or sessions. Please edit the source."
- `404`: "Attachment not found"

**Note**: Only standalone attachments can be deleted. Task/session attachments must be edited at the source.

---

### PUT /api/attachments/:id/move

Move an attachment to a folder.

**Authentication Required**: Yes

**URL Parameters**:
- `id`: Attachment ID (composite format)

**Request Body**:

```json
{
  "folder_id": 3
}
```

**Note**: Set `folder_id` to `null` to remove from folder

**Success Response** (200 OK):

```json
{
  "message": "Attachment moved successfully"
}
```

**Error Responses**:
- `404`: "Folder not found"
- `400`: "Note links cannot be moved to folders directly. Move the parent task or session instead."
- `400`: "Invalid attachment ID format"

---

### POST /api/attachments/bulk-move

Bulk move multiple attachments to a folder.

**Authentication Required**: Yes

**Request Body**:

```json
{
  "attachment_ids": ["attachment-1", "task-5", "session-10"],
  "folder_id": 3
}
```

**Validation**:
- `attachment_ids`: Required, non-empty array
- `folder_id`: Optional (null to remove from folders)

**Success Response** (200 OK):

```json
{
  "message": "Bulk move completed",
  "successCount": 3,
  "failedCount": 0,
  "errors": []
}
```

**With Errors**:

```json
{
  "message": "Bulk move completed",
  "successCount": 2,
  "failedCount": 1,
  "errors": [
    {
      "id": "note-task-5",
      "error": "Note links cannot be moved to folders"
    }
  ]
}
```

**Error Responses**:
- `400`: "attachment_ids must be a non-empty array"
- `404`: "Folder not found"

---

## Attachment Folders Endpoints

### GET /api/attachment-folders

Get all attachment folders for the authenticated user.

**Authentication Required**: Yes

**Success Response** (200 OK):

```json
[
  {
    "id": 1,
    "user_id": 1,
    "name": "Documentation",
    "parent_id": null,
    "created_at": "2026-02-01T10:00:00.000Z",
    "updated_at": "2026-02-01T10:00:00.000Z"
  },
  {
    "id": 2,
    "user_id": 1,
    "name": "AWS Docs",
    "parent_id": 1,
    "created_at": "2026-02-05T10:00:00.000Z",
    "updated_at": "2026-02-05T10:00:00.000Z"
  }
]
```

**Note**: Results are ordered by `name ASC`

---

### GET /api/attachment-folders/:id

Get a specific attachment folder.

**Authentication Required**: Yes

**URL Parameters**:
- `id`: Folder ID

**Success Response** (200 OK):

```json
{
  "id": 2,
  "user_id": 1,
  "name": "AWS Docs",
  "parent_id": 1,
  "created_at": "2026-02-05T10:00:00.000Z",
  "updated_at": "2026-02-05T10:00:00.000Z"
}
```

**Error Responses**:
- `404`: "Folder not found"

---

### POST /api/attachment-folders

Create a new attachment folder.

**Authentication Required**: Yes

**Request Body**:

```json
{
  "name": "Tutorials",
  "parent_id": 1
}
```

**Validation**:
- `name`: Required, non-empty after trimming
- `parent_id`: Optional, must exist if provided

**Success Response** (201 Created):

```json
{
  "id": 3,
  "user_id": 1,
  "name": "Tutorials",
  "parent_id": 1,
  "created_at": "2026-02-21T10:00:00.000Z",
  "updated_at": "2026-02-21T10:00:00.000Z"
}
```

**Error Responses**:
- `400`: "Folder name is required"
- `404`: "Parent folder not found"

---

### PUT /api/attachment-folders/:id

Update an attachment folder's name.

**Authentication Required**: Yes

**URL Parameters**:
- `id`: Folder ID

**Request Body**:

```json
{
  "name": "Video Tutorials"
}
```

**Success Response** (200 OK): Updated folder object

**Error Responses**:
- `400`: "Folder name is required"
- `404`: "Folder not found"

---

### DELETE /api/attachment-folders/:id

Delete an attachment folder.

**Authentication Required**: Yes

**URL Parameters**:
- `id`: Folder ID

**Success Response** (200 OK):

```json
{
  "message": "Folder deleted successfully"
}
```

**Error Responses**:
- `404`: "Folder not found"
- `400`: "Cannot delete folder that contains content" (with counts)

```json
{
  "error": "Cannot delete folder that contains content",
  "subfolderCount": 2,
  "attachmentCount": 5,
  "taskCount": 3,
  "sessionCount": 1
}
```

**Note**: Folder must be empty (no subfolders, standalone attachments, tasks with attachments, or sessions with URLs) to be deleted

---

## Journal Endpoints

### GET /api/journal/goal/:goalId

Get all journal entries for a goal.

**Authentication Required**: Yes

**URL Parameters**:
- `goalId`: Goal ID

**Success Response** (200 OK):

```json
{
  "entries": [
    {
      "id": 1,
      "user_id": 1,
      "goal_id": 1,
      "entry_date": "2026-02-20",
      "mood": "PRODUCTIVE",
      "thoughts": "Great progress today. Completed EC2 module.",
      "link_sessions": true,
      "created_at": "2026-02-20T18:00:00.000Z",
      "updated_at": "2026-02-20T18:00:00.000Z",
      "linked_sessions_count": "2",
      "linked_sessions": [
        {
          "id": 42,
          "date": "2026-02-20",
          "duration": 90,
          "activity": "Studied EC2"
        },
        {
          "id": 43,
          "date": "2026-02-20",
          "duration": 60,
          "activity": "Practiced VPC"
        }
      ]
    }
  ]
}
```

**Note**: Results are ordered by `entry_date DESC, created_at DESC`

---

### GET /api/journal/:id

Get a single journal entry.

**Authentication Required**: Yes

**URL Parameters**:
- `id`: Journal entry ID

**Success Response** (200 OK):

```json
{
  "id": 1,
  "user_id": 1,
  "goal_id": 1,
  "entry_date": "2026-02-20",
  "mood": "PRODUCTIVE",
  "thoughts": "Great progress today. Completed EC2 module.",
  "link_sessions": true,
  "created_at": "2026-02-20T18:00:00.000Z",
  "updated_at": "2026-02-20T18:00:00.000Z",
  "linked_sessions": [
    {
      "id": 42,
      "date": "2026-02-20",
      "duration": 90,
      "activity": "Studied EC2"
    }
  ]
}
```

**Error Responses**:
- `404`: "Journal entry not found"

---

### POST /api/journal

Create a new journal entry.

**Authentication Required**: Yes

**Request Body**:

```json
{
  "goal_id": 1,
  "entry_date": "2026-02-21",
  "mood": "MOTIVATED",
  "thoughts": "Started Lambda module today. Excited to learn serverless!",
  "link_sessions": true,
  "session_ids": [45, 46]
}
```

**Validation**:
- `goal_id`: Required
- `entry_date`: Optional (default: current date)
- `mood`: Optional
- `thoughts`: Optional
- `link_sessions`: Optional (default: false)
- `session_ids`: Optional, array of session IDs to link

**Success Response** (201 Created):

```json
{
  "id": 5,
  "user_id": 1,
  "goal_id": 1,
  "entry_date": "2026-02-21",
  "mood": "MOTIVATED",
  "thoughts": "Started Lambda module today. Excited to learn serverless!",
  "link_sessions": true,
  "created_at": "2026-02-21T18:00:00.000Z",
  "updated_at": "2026-02-21T18:00:00.000Z",
  "linked_sessions": [
    {
      "id": 45,
      "date": "2026-02-21",
      "duration": 120,
      "activity": "Studied Lambda basics"
    },
    {
      "id": 46,
      "date": "2026-02-21",
      "duration": 60,
      "activity": "Practiced Lambda triggers"
    }
  ]
}
```

**Error Responses**:
- `400`: "Goal ID is required"

---

### PUT /api/journal/:id

Update a journal entry.

**Authentication Required**: Yes

**URL Parameters**:
- `id`: Journal entry ID

**Request Body** (all fields optional):

```json
{
  "entry_date": "2026-02-21",
  "mood": "ENERGIZED",
  "thoughts": "Updated thoughts after review",
  "link_sessions": false,
  "session_ids": []
}
```

**Note**: Providing `session_ids` will replace all existing linked sessions

**Success Response** (200 OK): Updated journal entry object with linked sessions

**Error Responses**:
- `404`: "Journal entry not found"

---

### DELETE /api/journal/:id

Delete a journal entry.

**Authentication Required**: Yes

**URL Parameters**:
- `id`: Journal entry ID

**Success Response** (200 OK):

```json
{
  "message": "Journal entry deleted successfully"
}
```

**Error Responses**:
- `404`: "Journal entry not found"

---

### GET /api/journal/:id/stats

Get statistics for a journal entry.

**Authentication Required**: Yes

**URL Parameters**:
- `id`: Journal entry ID

**Success Response** (200 OK):

```json
{
  "study_hours": 12.5,
  "study_minutes": 750,
  "tasks_completed": 15,
  "week_start": "2026-02-16",
  "week_end": "2026-02-22"
}
```

**Field Details**:
- `study_hours`: Total study time for the week (rounded to 1 decimal)
- `study_minutes`: Total study time in minutes
- `tasks_completed`: Number of completed tasks for the goal
- `week_start`: Start of week (Sunday) containing entry_date
- `week_end`: End of week (Saturday) containing entry_date

**Error Responses**:
- `404`: "Journal entry not found"

---

## Health Check

### GET /vela/health

Check API health status.

**Authentication Required**: No

**Success Response** (200 OK):

```json
{
  "status": "OK",
  "message": "Vela API is running",
  "database": "Neon PostgreSQL",
  "apk_download": "/vela/app-release.apk"
}
```

---

## Additional Resources

### File Downloads

**APK Download**: `GET /vela/app-release.apk`
Download the Android mobile app.

**Uploaded Files**: `GET /vela/uploads/{filename}`
Access uploaded files (profile photos, etc.)

### CORS

The API supports CORS with `credentials: true`. All origins are allowed in development mode.

### Database

**Provider**: Neon PostgreSQL (Serverless)
**Connection**: SSL required
**Schema**: Auto-initialized on server startup

### Environment Variables

Key environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT signing
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (production/development)

---

## Changelog

**Version**: 1.0.0
**Last Updated**: February 21, 2026

---

## Support

For issues or questions, refer to:
- **Backend README**: `backend/README.md`
- **CLAUDE.md**: Project development guide
- **FEATURES.md**: User-facing feature documentation
