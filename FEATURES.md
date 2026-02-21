# Vela - User Guide & Features

> **Quick Answer**: Vela is a personal learning management system that helps you track study sessions, manage tasks, organize notes, set goals, and store study materials—all organized by subject.

## Table of Contents
- [What is Vela?](#what-is-vela)
- [Core Features](#core-features)
- [User Workflows](#user-workflows)
- [Feature Details](#feature-details)

---

## What is Vela?

Vela is an all-in-one study tracker designed for students, lifelong learners, and anyone managing multiple subjects or learning paths. Think of it as your personal study command center.

**Key Capabilities:**
- 📚 **Multi-subject organization** - Switch between different courses/subjects
- ⏱️ **Time tracking** - Log study sessions with duration and details
- ✅ **Task management** - Create tasks with priorities, deadlines, and subtasks
- 📝 **Note-taking** - Rich text notes with folders and linking
- 🎯 **Goal tracking** - Set and monitor learning goals
- 📎 **File management** - Attach PDFs, images, links to your sessions
- 📊 **Progress analytics** - View stats and timelines of your study journey

**Available as:**
- Web app (hosted at `/vela/`)
- Android mobile app (via Capacitor)

---

## Core Features

### 1. **Tasks** 📋
Your main task management hub.

**What you can do:**
- Create tasks with titles, descriptions, and notes
- Set priority levels (Low, Medium, High, Urgent)
- Add due dates and reminders
- Break down tasks into subtasks
- Link tasks to specific subjects
- Mark tasks as complete
- View tasks in different views (list, kanban-style)

**Task Types:**
- General tasks
- Study-specific tasks
- Revision tasks
- Project tasks

**Mobile Feature:** Swipe left/right on task cards to complete or delete

---

### 2. **Study Sessions** 📅
Track what you study and when.

**What you can do:**
- Log study sessions with date, time spent, and activity
- Record topics covered and notes
- Attach files, images, or links to sessions (e.g., lecture slides, YouTube videos)
- View sessions in a timeline view
- Filter sessions by date range or source type
- Edit or delete past sessions
- Calculate total time spent per subject

**Activity Types:**
- 📚 Study - Traditional studying
- 📺 Watch - Video content (YouTube, courses)
- 📖 Read - Articles, textbooks, papers
- 💻 Practice - Coding, exercises
- 📝 Notes - Note-taking sessions
- 🎧 Listen - Podcasts, audiobooks

**Example Flow:**
1. Click "+" button to add session
2. Select date and activity type
3. Enter what you studied (e.g., "React Hooks")
4. Set time spent (e.g., 90 minutes)
5. Optionally add notes or attachments
6. Save → appears in your timeline

---

### 3. **Notes** 📝
A powerful note-taking system with organization features.

**What you can do:**
- Create rich text notes with formatting
- Organize notes in folders (hierarchical structure)
- Tag notes for easy filtering
- Link notes together (like a personal wiki)
- Attach files/images to notes
- Search notes by title or tags
- Pin important notes to the top

**Use Cases:**
- Lecture notes
- Study summaries
- Research notes
- Quick thoughts
- Code snippets
- Flashcard-style notes

**Note Linking:** Connect related notes (e.g., link "React Hooks" note to "useState Hook" note)

---

### 4. **Goals** 🎯
Set and track learning objectives.

**What you can do:**
- Create short-term and long-term goals
- Set target completion dates
- Add descriptions and milestones
- Mark goals as complete
- View progress toward goals
- Archive completed goals

**Example Goals:**
- "Complete AWS certification by June"
- "Study 20 hours per week"
- "Finish React course"
- "Read 3 books on machine learning"

---

### 5. **Attachments Hub** 📎
Centralized file and link management.

**What you can do:**
- Upload files (PDFs, images, documents)
- Save web links with titles
- Organize attachments in folders
- Preview files in-app
- Attach files to sessions, notes, or tasks
- Quick access to all your study materials
- Share links from mobile browser directly to Vela

**Supported File Types:**
- PDFs (lecture slides, textbooks)
- Images (screenshots, diagrams)
- URLs (videos, articles, documentation)

**Mobile Feature:** Use "Share" from any app (YouTube, Chrome) to save directly to Vela

---

### 6. **Profile & Settings** 👤
Manage your account and preferences.

**What you can do:**
- View your profile information
- Change your username or email
- Manage subjects (create, edit, delete)
- Switch active subject
- View overall statistics
- Navigate to Goals page
- Logout

---

### 7. **Subjects** 📚
Organize everything by subject/course.

**What you can do:**
- Create subjects (e.g., "AWS SAA", "React", "Machine Learning")
- Switch between subjects
- All tasks, sessions, notes filtered by active subject
- Delete subjects (removes all associated data)

**Subject Selector:** Dropdown in header to quickly switch subjects

---

## User Workflows

### Starting Your Study Journey

**First Time Setup:**
1. **Sign up** → Create account with email/password
2. **Create a subject** → Click subject selector → "Create Subject"
3. **You're ready!** → Start adding tasks, sessions, or notes

---

### Daily Study Workflow

**Typical Daily Flow:**
1. **Morning:**
   - Open Vela → Check Tasks tab
   - Review today's tasks and priorities
   - Plan what to study

2. **During Study:**
   - Study your material
   - When done → Log session in "Session" tab
   - Attach any materials you used (PDFs, links)

3. **After Study:**
   - Update task status (mark completed)
   - Take notes if needed
   - Check off progress toward goals

---

### Task Management Workflow

**Creating a Task:**
```
Tasks tab → "+" button → Fill form:
  - Title: "Practice React Hooks"
  - Description: "Complete exercises 1-5"
  - Priority: High
  - Due date: Tomorrow
  - Subject: React
  → Save
```

**Working with Tasks:**
- Click task card → View details, add subtasks, edit
- Swipe right (mobile) → Mark complete
- Swipe left (mobile) → Delete
- Use filters to view by priority, due date, subject

---

### Study Session Logging

**Quick Session Entry:**
```
Session tab → "+" button → Fill:
  - Date: Today
  - Activity: Study
  - What: "JavaScript closures"
  - Time: 60 minutes
  - Notes: "Finally understood closure scope!"
  → Save
```

**Session with Attachments:**
1. Log session as above
2. Click session card → "Attach file"
3. Upload PDF or add YouTube link
4. View attachments anytime in session details

---

### Note-Taking Workflow

**Creating a Note:**
```
(Currently via Profile → Notes or from attachment linking)
  - Create note
  - Add title and content
  - Tag it (e.g., "javascript", "important")
  - Save to folder (e.g., "React Course")
```

**Linking Notes:**
- Open note → "Link to note" button
- Select related notes
- Creates bidirectional links
- Build your knowledge graph

---

### Mobile-Specific Features

**Share Target (Android):**
1. Find YouTube video on browser
2. Tap "Share"
3. Select "Vela"
4. Confirm → Creates task/session with video link

**Camera Integration:**
- Take photos of whiteboards, textbooks
- Upload directly to attachments
- Link to study sessions

**Local Notifications:**
- Set reminders for tasks
- Get notified at scheduled times

---

## Feature Details

### Task Priorities

| Priority | Color | Use Case |
|----------|-------|----------|
| Urgent | Red | Due today, critical |
| High | Orange | Important, due soon |
| Medium | Blue | Regular tasks |
| Low | Gray | Nice to have |

---

### Activity Types Explained

| Type | Icon | When to Use |
|------|------|-------------|
| Study | 📚 | Reading textbooks, reviewing notes |
| Watch | 📺 | YouTube tutorials, courses, lectures |
| Read | 📖 | Articles, documentation, papers |
| Practice | 💻 | Coding exercises, problem-solving |
| Notes | 📝 | Taking or organizing notes |
| Listen | 🎧 | Podcasts, audiobooks |

---

### Statistics & Analytics

**Available Stats:**
- Total study time (today, this week, all time)
- Sessions count
- Tasks completed
- Topics covered
- Time by activity type
- Subject breakdown

**Where to view:**
- Header (quick stats)
- Dashboard (future feature)
- Profile page

---

### Revision System

**How it works:**
1. Mark topics/concepts for revision
2. System tracks what needs review
3. View revision queue
4. Mark items as revised

**Use Case:** Spaced repetition, exam prep

---

## Tips & Best Practices

### Organizing Subjects
- Create one subject per course/topic area
- Examples: "AWS SAA", "React Basics", "Machine Learning 101"
- Use descriptive names for easy switching

### Task Management
- Set realistic due dates
- Break large tasks into subtasks
- Use priority levels consistently
- Review tasks daily

### Session Logging
- Log sessions immediately after studying (while fresh)
- Be specific in "topics covered" field
- Attach resources you used
- Add notes about key learnings or struggles

### Note Organization
- Use folders by subject or topic area
- Tag notes for cross-subject themes
- Link related concepts
- Review and update notes regularly

### Goal Setting
- Mix short-term (weekly) and long-term (monthly/yearly) goals
- Make goals specific and measurable
- Review goals weekly
- Celebrate completed goals!

---

## Common Questions

**Q: Can I use Vela offline?**
A: Mobile app works offline for viewing, but syncing requires internet.

**Q: Can I export my data?**
A: Currently not built-in, but API access available.

**Q: How do I delete a subject?**
A: Profile → Manage Subjects → Select subject → Delete (⚠️ deletes all data!)

**Q: Can I track multiple subjects at once?**
A: Yes! Create multiple subjects, switch using the dropdown in header.

**Q: What's the difference between tasks and sessions?**
A: **Tasks** are what you plan to do. **Sessions** are what you actually did.

**Q: Can I attach the same file to multiple sessions?**
A: Yes! Use Attachments Hub to upload once, link to multiple places.

---

## Next Steps

**New to Vela?**
1. Create your first subject
2. Add a task for today
3. Log your first study session
4. Explore the features!

**Need help?**
- Check CLAUDE.md for technical documentation
- Review backend/README.md for API details
- Explore design-system/README.md for UI components

---

**Last Updated:** 2026-02-21
**Version:** 1.0
**For Technical Docs:** See CLAUDE.md
