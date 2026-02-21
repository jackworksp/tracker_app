# Vela User Guide

> Your complete guide to mastering Vela - the personal learning management system for students and lifelong learners.

**Version:** 1.0
**Last Updated:** February 21, 2026

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Main Navigation](#main-navigation)
4. [Feature Walkthroughs](#feature-walkthroughs)
5. [Key Workflows](#key-workflows)
6. [Mobile App Features](#mobile-app-features)
7. [Tips and Best Practices](#tips-and-best-practices)
8. [Frequently Asked Questions](#frequently-asked-questions)

---

## Introduction

### What is Vela?

Vela is an all-in-one study tracking application designed to help you organize your learning journey. Whether you're a student preparing for exams, a professional pursuing certifications, or a lifelong learner exploring new topics, Vela gives you the tools to track, manage, and optimize your study time.

**Think of Vela as your personal study command center** where you can:
- Track how much time you spend studying
- Manage tasks and deadlines
- Organize notes and study materials
- Set and monitor learning goals
- Review your progress over time

### Who is Vela For?

- **Students** - Track coursework, assignments, and exam preparation
- **Certification seekers** - Manage study plans for AWS, Google, Microsoft, or other professional certifications
- **Self-learners** - Organize online courses, tutorials, and learning projects
- **Researchers** - Keep track of papers, notes, and research sessions
- **Anyone** who wants to be more intentional about their learning

### Platform Availability

- **Web App** - Access from any browser at your Vela URL
- **Android Mobile App** - Native mobile experience with offline capabilities and share features

---

## Getting Started

### Creating Your Account

1. **Open Vela** in your web browser or mobile app
2. Click **"Sign Up"** on the welcome screen
3. Enter your details:
   - **Name** - Your display name
   - **Email** - Used for login and account recovery
   - **Password** - Choose a secure password (minimum 6 characters)
4. Click **"Create Account"**
5. You'll be automatically logged in

### First-Time Setup

After creating your account, you'll be prompted to create your first subject.

**Creating Your First Subject:**

1. Click the **subject selector** dropdown (at the top of the screen)
2. Select **"Create Subject"**
3. Enter a subject name:
   - For courses: "Introduction to Python", "Calculus 101"
   - For certifications: "AWS Solutions Architect", "PMP Certification"
   - For topics: "Machine Learning Basics", "Spanish Language"
4. Click **"Create"**

You're now ready to start using Vela!

---

## Main Navigation

Vela uses a tab-based navigation system with 4 main sections:

### Desktop Navigation (Sidebar)

On desktop and web browsers, you'll see a sidebar on the left with these tabs:

1. **Tasks** - Your task management hub
2. **Attachments** - Files, links, and notes library
3. **Session** - Study session timeline
4. **Profile** - Settings, subjects, and goals

### Mobile Navigation (Bottom Bar)

On mobile, the same tabs appear in a bottom navigation bar for easy thumb access.

### Subject Selector

At the top of every screen, you'll see the **subject dropdown**. This lets you:
- Switch between different subjects quickly
- See which subject is currently active
- Create new subjects
- Manage existing subjects

**Everything in Vela is organized by subject** - tasks, sessions, notes, and attachments are all filtered by your currently selected subject.

---

## Feature Walkthroughs

### 1. Tasks Tab

The Tasks tab is your central task management workspace.

#### Creating a Task

1. Click the **"+ Add Task"** button (top right)
2. Fill in the task details:
   - **Type** - Choose from:
     - `TASK` - General study tasks
     - `WATCH` - Video content (YouTube, courses)
     - `READ` - Articles, textbooks, documentation
     - `NOTE` - Note-taking reminders
   - **Title** - Short, descriptive name (e.g., "Study React Hooks")
   - **Description** - Detailed notes or context
   - **URL** - Optional link to resources
   - **Priority** - Low, Medium, High, or Urgent
   - **Due Date** - Set a deadline
   - **Link to Goal** - Associate with a learning goal
   - **Tags** - Add topics for filtering (comma-separated)
3. Click **"Create Task"**

#### Task Cards

Each task appears as a card showing:
- **Type badge** - Visual indicator (TASK, WATCH, READ, NOTE)
- **Title** - What you need to do
- **Description** - Additional context
- **URL preview** - For YouTube videos or links, you'll see a thumbnail
- **Created date** - When the task was added
- **Action buttons**:
  - **Clock icon** - Log study time for this task
  - **Bell icon** - Set a reminder
  - **Edit icon** - Modify task details
  - **Delete icon** - Remove the task

#### Mobile Gestures

On mobile, you can use swipe gestures:
- **Swipe left** - Mark task as complete (creates a study session automatically!)
- **Swipe right** - Delete the task

#### Task Detail View

Click any task card to see the full detail view with:
- All task information
- Subtasks (add smaller steps)
- Linked notes
- Study session history
- Quick actions (edit, delete, complete)

#### Completing Tasks

When you mark a task complete:
1. It automatically creates a study session entry
2. The task moves to the "Completed" section
3. Time is logged based on task type (default: 15 minutes for tasks, 60 minutes for videos)
4. You can undo by clicking the task again

### 2. Attachments Tab

Your centralized hub for all study materials.

#### Overview vs. Notes

The Attachments tab has two sub-tabs:

**Overview** - All files and links from tasks and sessions
**Notes** - Rich text notes organized in folders

#### Adding Links Manually

1. Click **"+ Add Link"** button
2. Enter:
   - **Title** - Name for the link
   - **URL** - Web address
   - **Subject** - Which subject this belongs to
3. Click **"Save"**

#### Viewing Attachments

Attachments are displayed as cards showing:
- **Title** - Name of the file or link
- **Preview** - YouTube thumbnails, file icons, or link previews
- **Source** - Where it came from (Task or Session)
- **Actions** - Open link, view note, or delete

#### Searching and Filtering

Use the search bar and filters to find attachments:
- **Search** - Type keywords from title or URL
- **Filter by Type** - URLs or Notes
- **Filter by Source** - Tasks or Sessions
- **Filter by Subject** - If viewing all subjects

#### Mobile Sharing

On Android, you can share content directly to Vela:
1. Find a YouTube video or article in your browser
2. Tap the **Share** button
3. Select **"Vela"** from the share menu
4. Choose whether to save as Task, Session, or Attachment
5. Confirm to save

### 3. Session Tab (Timeline)

Track your study history with detailed session logs.

#### Logging a Study Session

**Method 1: From Timeline**
1. Click the **"+"** button (top right)
2. Fill in session details:
   - **Date** - When you studied (defaults to today)
   - **Activity Type** - Choose from:
     - Study - Traditional studying
     - Watch - Video content
     - Read - Reading materials
     - Practice - Coding, exercises
     - Notes - Note-taking sessions
     - Listen - Podcasts, audiobooks
   - **What did you study?** - Activity name (e.g., "React Hooks Tutorial")
   - **Time Spent** - In hours or minutes
   - **URL** - Optional link to resource
   - **Topics Covered** - Comma-separated list of topics
   - **Notes** - Additional details or key takeaways
3. Click **"Log Session"**

**Method 2: From Task Completion**
- When you complete a task, a session is automatically created
- Default time is assigned based on task type

**Method 3: From Task Detail**
- Click any task card
- Click the **"Log Time"** button
- Session is pre-filled with task details

#### Session Cards

Each session appears as a timeline card showing:
- **Date badge** - Day and month
- **Duration** - Time spent studying
- **Platform badges** - YouTube, Instagram, Goal linked, Attachment count
- **Title** - What you studied
- **Thumbnail** - For YouTube videos
- **Topics covered** - As pills/tags
- **Actions**:
  - **Revision counter** - Click to increment revision count
  - **Edit** - Modify session details
  - **Delete** - Remove session

#### Viewing Session Details

Click any session card to see:
- Full session information
- Attached files and links
- Related notes
- Quick edit and delete options

#### Timeline Statistics

At the top of the timeline, you'll see:
- **Total time studied** - Across all sessions
- **Session count** - Number of study sessions logged

### 4. Profile Tab

Manage your account, subjects, and settings.

#### Profile Information

Your profile displays:
- **Avatar** - Shows your initials or profile photo
- **Name** - Your display name
- **Email** - Account email
- **Edit Profile** - Update your details

#### Uploading a Profile Photo

1. Click the **camera icon** on your avatar
2. Select an image from your device
3. Photo uploads and updates automatically

#### Menu Options

**My Goals**
- View and manage your learning goals
- Create short-term and long-term objectives
- Track progress toward goals
- Mark goals as complete

**My Subjects**
- View all subjects
- Create new subjects
- Switch active subject
- Delete subjects (warning: deletes all associated data!)

**Settings**
- Notifications - Enable/disable reminders
- Dark Mode - Currently always on
- Privacy & Security - Account settings
- App Settings - Preferences

#### Logging Out

Click **"Sign Out"** at the bottom of the profile page to log out.

---

## Key Workflows

### Workflow 1: Setting Up a New Subject

**Scenario:** You're starting a new online course on Machine Learning.

1. **Create the Subject**
   - Click subject dropdown → "Create Subject"
   - Name: "Machine Learning Basics"
   - Click "Create"

2. **Add Initial Tasks**
   - Switch to Tasks tab
   - Click "+ Add Task"
   - Add tasks like:
     - "Watch: Introduction to ML" (type: WATCH)
     - "Read: What is Machine Learning?" (type: READ)
     - "Practice: First Python notebook" (type: TASK)

3. **Set a Goal**
   - Go to Profile → My Goals
   - Click "+ Add Goal"
   - Title: "Complete ML Course by End of Month"
   - Target Date: Set deadline
   - Save

4. **Start Studying**
   - Work through your tasks
   - Log study sessions as you go
   - Mark tasks complete when done

### Workflow 2: Daily Study Routine

**Morning Planning (5 minutes):**
1. Open Vela
2. Switch to your active subject
3. Go to Tasks tab
4. Review today's tasks
5. Check priorities and deadlines
6. Plan what to study today

**During Study Session:**
1. Work on your material
2. Take notes in a separate app or on paper
3. Collect any useful links or resources

**After Study Session (2 minutes):**
1. Go to Session tab
2. Click "+" to log session
3. Fill in:
   - What you studied
   - How long you spent
   - Any links or resources used
   - Key topics covered
4. Save session
5. Mark completed tasks as done

**Weekly Review (10 minutes):**
1. Check Timeline to see total study time
2. Review completed tasks
3. Adjust goals if needed
4. Plan next week's priorities

### Workflow 3: Managing Tasks and Subtasks

**Scenario:** You have a large project to break down.

1. **Create Main Task**
   - Tasks tab → "+ Add Task"
   - Title: "Complete AWS SAA Certification Exam"
   - Priority: High
   - Due date: 3 months from now
   - Link to Goal: "Get AWS Certified"

2. **Break Into Subtasks**
   - Click the task card to open detail view
   - Click "+ Add Subtask"
   - Add subtasks like:
     - "Study EC2 and VPC"
     - "Practice hands-on labs"
     - "Take practice exam"
     - "Review weak areas"

3. **Work Through Subtasks**
   - Check off subtasks as you complete them
   - Log study sessions for each major area
   - Track progress in the main task

4. **Complete the Task**
   - When all subtasks are done
   - Mark main task as complete
   - Session is automatically logged

### Workflow 4: Using Notes Effectively

1. **Create Notes During Study**
   - Go to Attachments tab → Notes
   - Click "+ Add Note"
   - Title: "React Hooks - useState"
   - Add content with formatting
   - Tag: "react, hooks, javascript"
   - Save to folder: "React Course"

2. **Link Notes to Tasks**
   - Create or edit a task
   - In task detail, click "Link Note"
   - Select existing note or create new
   - Note badge appears on task card

3. **Build Knowledge Graph**
   - Open a note
   - Click "Link to Note"
   - Select related notes
   - Creates bidirectional connections
   - Navigate between related concepts

4. **Search and Retrieve**
   - Use search bar to find notes
   - Filter by tags
   - Browse by folder
   - Click note badge on tasks to access quickly

### Workflow 5: Goal Setting and Tracking

1. **Define Your Goal**
   - Profile → My Goals → "+ Add Goal"
   - Make it specific: "Study 20 hours per week"
   - Or milestone-based: "Complete Python Course"
   - Set target completion date

2. **Link Tasks to Goal**
   - When creating tasks, select the goal from dropdown
   - All related tasks show the goal badge
   - Filter tasks by goal to see what's left

3. **Link Sessions to Goal**
   - When logging study sessions, select the goal
   - Sessions display the goal badge in timeline

4. **Track Progress**
   - View goals page to see active goals
   - Check completion status
   - Mark goals complete when achieved
   - Archive old goals

### Workflow 6: Revision and Spaced Repetition

1. **Initial Study**
   - Study a topic and log session
   - Take notes
   - Mark task complete

2. **Schedule Revision**
   - Find the session in Timeline
   - Click the revision counter button
   - This increments the count

3. **Review Over Time**
   - Revisit sessions after 1 day, 1 week, 1 month
   - Click revision button each time you review
   - Track how many times you've revised a topic

4. **Monitor Weak Areas**
   - Sessions with low revision counts need more attention
   - Use this to guide your study priorities

---

## Mobile App Features

The Vela Android app includes special mobile-only features.

### Share Target Integration

**What it is:** Save content from any app directly to Vela

**How to use:**
1. Find content you want to save (YouTube video, article, etc.)
2. Tap the **Share** button in that app
3. Select **"Vela"** from the share menu
4. Choose what to create:
   - **Task** - Add to your task list
   - **Session** - Log as completed study session
   - **Attachment** - Save directly to attachments hub
5. Confirm and the content is saved

**Best for:**
- YouTube tutorials while browsing
- Articles you want to read later
- Instagram posts with study tips
- Links to documentation

### Camera Integration

**What it is:** Take photos of study materials and attach them

**How to use:**
1. Open a task or session
2. Click **"Add Attachment"**
3. Select **"Camera"**
4. Take photo of:
   - Whiteboard notes
   - Textbook pages
   - Study notes
   - Diagrams
5. Photo is attached and uploaded

### Local Notifications

**What it is:** Get reminded about tasks even when offline

**How to use:**
1. Open a task
2. Click the **bell icon**
3. Set reminder details:
   - Date and time
   - Alert type (notification, alarm)
4. Receive notification at scheduled time

**Note:** Notifications work even if you're not connected to the internet.

### Offline Access

**What works offline:**
- View previously loaded tasks
- View study sessions
- Browse notes (if cached)

**What requires internet:**
- Creating new content
- Syncing changes
- Uploading files
- Loading new data

---

## Tips and Best Practices

### Task Management

**Be Specific with Titles**
- Bad: "Study"
- Good: "Study React useEffect Hook - Chapter 5"

**Set Realistic Due Dates**
- Don't overcommit
- Build in buffer time
- Review and adjust weekly

**Use Priorities Wisely**
- Urgent: Due today or critical
- High: Important, due soon
- Medium: Regular priority
- Low: Nice to have, flexible

**Break Large Tasks Down**
- Tasks over 2 hours should become subtasks
- Makes progress feel achievable
- Easier to track what's done

**Use Tags Consistently**
- Create a consistent tagging system
- Examples: "exam-prep", "hands-on", "theory", "revision"
- Makes filtering easier later

### Session Logging

**Log Immediately**
- Log sessions right after studying while details are fresh
- Don't wait until end of day

**Be Honest About Time**
- Track actual study time, not time spent distracted
- Quality over quantity

**Add Context**
- Write what you learned in notes field
- List topics covered specifically
- Add any challenges faced

**Attach Resources**
- Link to videos you watched
- Add PDFs you referenced
- Include code repos or documentation

### Note Organization

**Use Folders by Subject**
- Create folder structure like:
  - React Course
    - Hooks
    - Components
    - State Management

**Tag for Cross-Cutting Themes**
- Use tags for topics that span subjects
- Examples: "debugging", "best-practices", "errors"

**Link Related Concepts**
- Build connections between notes
- Creates a knowledge graph
- Helps with recall and understanding

**Review and Update Regularly**
- Revisit notes after studying
- Add new insights
- Refine and organize

### Goal Setting

**Make Goals SMART**
- **S**pecific - "Complete AWS SAA exam" not "Learn AWS"
- **M**easurable - "Study 20 hours/week" not "Study more"
- **A**chievable - Realistic given your schedule
- **R**elevant - Aligned with your learning objectives
- **T**ime-bound - Set clear deadlines

**Mix Short and Long Term**
- Weekly goals: "Watch 5 videos this week"
- Monthly goals: "Complete Module 3"
- Quarterly goals: "Pass certification exam"

**Review Goals Weekly**
- Check progress every Sunday
- Adjust if falling behind
- Celebrate when achieved

### Subject Organization

**One Subject Per Course/Topic**
- Don't mix unrelated content
- Create separate subjects for each major area

**Use Descriptive Names**
- Include course name or certification
- Examples:
  - "AWS Solutions Architect Associate (SAA-C03)"
  - "Harvard CS50x - Introduction to Computer Science"
  - "Spanish Language - Beginner"

**Archive Completed Subjects**
- Don't delete (you'll lose data!)
- Consider keeping completed subjects for reference

### Time Management

**Use the Pomodoro Technique**
1. Study for 25 minutes
2. Take 5-minute break
3. After 4 sessions, take longer break
4. Log each session in Vela

**Track Time Patterns**
- Review your timeline weekly
- Identify when you study best
- Optimize your schedule

**Set Time-Based Goals**
- "Study 2 hours per day"
- "Complete 10 hours this week"
- Track in goals and review in timeline

---

## Frequently Asked Questions

### General Questions

**Q: Is Vela free to use?**
A: Check with your administrator or hosting provider for pricing details.

**Q: Can I use Vela offline?**
A: The mobile app allows viewing previously loaded content offline, but creating and syncing requires an internet connection.

**Q: Can I access Vela from multiple devices?**
A: Yes! Your data syncs across all devices when you log in with the same account.

**Q: How do I export my data?**
A: Data export is not currently built-in. Contact your administrator for API access if needed.

### Account Management

**Q: I forgot my password. How do I reset it?**
A: Password reset functionality may vary by installation. Contact your administrator or check the login page for a "Forgot Password" link.

**Q: Can I change my email address?**
A: Currently, email changes must be done through your administrator.

**Q: How do I delete my account?**
A: Contact your administrator for account deletion requests.

### Subjects

**Q: How many subjects can I create?**
A: There's no hard limit. Create as many as you need.

**Q: Can I merge two subjects?**
A: Not currently. You would need to manually move tasks and sessions.

**Q: What happens when I delete a subject?**
A: **Warning!** Deleting a subject permanently removes all associated tasks, sessions, notes, and attachments. This cannot be undone.

**Q: Can I rename a subject?**
A: Subject editing is coming soon. For now, you'd need to create a new subject with the correct name.

### Tasks

**Q: Can I move a task to a different subject?**
A: Not directly in the UI. You would need to recreate the task under the new subject.

**Q: What's the difference between tasks and sessions?**
A: **Tasks** are things you plan to do. **Sessions** are records of what you actually did. When you complete a task, it creates a session entry.

**Q: Can I have recurring tasks?**
A: Recurring tasks are not currently supported. You would need to create each instance manually.

**Q: How do I prioritize tasks?**
A: Use the Priority field when creating or editing tasks. Options are Low, Medium, High, and Urgent.

### Study Sessions

**Q: Can I edit a session after logging it?**
A: Yes! Click the session card in the timeline, then click the edit button.

**Q: How is study time calculated?**
A: You manually enter the time spent when logging a session. The timeline shows total time across all sessions.

**Q: Can I attach multiple files to a session?**
A: Yes, you can attach multiple files and links to each session.

**Q: What does the revision counter do?**
A: Click the revision counter to track how many times you've reviewed that material. Useful for spaced repetition.

### Attachments and Notes

**Q: Where do attachments come from?**
A: Attachments are created when you:
- Add a URL to a task
- Attach a link to a session
- Share content from your mobile browser
- Manually add a link in Attachments hub

**Q: Can I attach the same file to multiple tasks?**
A: Yes! Upload once in Attachments hub, then reference it from multiple tasks or sessions.

**Q: What's the difference between Attachments and Notes?**
A: **Attachments** are URLs and files. **Notes** are rich text documents you write inside Vela.

**Q: Can I organize notes in folders?**
A: Yes! Create folders in the Notes tab and organize notes hierarchically.

### Mobile App

**Q: Is there an iOS app?**
A: Currently only Android is supported via Capacitor.

**Q: How do I download the mobile app?**
A: Contact your administrator for the APK file or installation instructions.

**Q: Why isn't the share target working?**
A: Make sure you've installed the latest version of the app and have granted necessary permissions.

**Q: Can I study offline on mobile?**
A: You can view previously loaded content offline, but creating new content requires internet connection.

### Goals

**Q: How do I link a task to a goal?**
A: When creating or editing a task, use the "Link to Goal" dropdown to select a goal.

**Q: Can I have multiple goals active at once?**
A: Yes, create as many goals as you need. You can filter tasks by goal to focus on one at a time.

**Q: What happens when I complete a goal?**
A: Mark it as complete in the Goals page. It's archived but still visible for reference.

### Technical Issues

**Q: The app is loading slowly. What can I do?**
A: Try:
- Refreshing the page
- Clearing browser cache
- Checking your internet connection
- Contacting your administrator if issues persist

**Q: My data isn't syncing between devices. Help!**
A: Make sure:
- You're logged in with the same account
- You have an active internet connection
- You've refreshed the page after making changes on another device

**Q: I can't upload files. What's wrong?**
A: Check:
- File size (there may be limits)
- File type (ensure it's supported)
- Your internet connection
- Storage quota limits

**Q: The mobile app crashes when sharing content. Why?**
A: Try:
- Updating to the latest version
- Clearing app cache
- Reinstalling the app
- Reporting the issue to your administrator

### Best Practices

**Q: How often should I log study sessions?**
A: Log immediately after each study session while details are fresh in your mind.

**Q: Should I create tasks or sessions first?**
A: Create tasks for planning, then log sessions as you complete them. Both approaches work!

**Q: How many subjects should I have?**
A: One per major course, certification, or topic area. Don't create too many or they become hard to manage.

**Q: What's the best way to track progress?**
A: Use a combination of:
- Completed tasks count
- Total study time in Timeline
- Goals progress
- Revision counts for retention

---

## Getting Help

### Support Resources

- **Technical Documentation** - See [CLAUDE.md](../CLAUDE.md) for developer documentation
- **Feature Overview** - See [FEATURES.md](../FEATURES.md) for detailed feature descriptions
- **Backend API** - See [backend/README.md](../backend/README.md) for API documentation

### Community

- Share tips and workflows with other Vela users
- Report bugs and request features through your administrator
- Contribute ideas for improving the user experience

### Administrator Contact

For account issues, technical problems, or feature requests, contact your Vela administrator.

---

## What's Next?

Now that you know how to use Vela, here are some next steps:

1. **Create your first subject** - Start with something you're currently learning
2. **Add 3-5 tasks** - Plan what you want to accomplish this week
3. **Log your first study session** - Track a study session today
4. **Set a goal** - Define what you want to achieve this month
5. **Explore the features** - Try attachments, notes, and mobile sharing

**Remember:** Vela is a tool to support your learning, not replace it. The key to success is consistent use and honest tracking. Start small, build habits, and adjust your workflow as you learn what works best for you.

Happy studying! 🎓

---

**Document Version:** 1.0
**Last Updated:** February 21, 2026
**For Technical Documentation:** See [CLAUDE.md](../CLAUDE.md)
