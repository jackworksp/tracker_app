# Vela Study Tracker MCP Server

A Model Context Protocol (MCP) server for the Vela Study Tracker application. This server provides AI assistants with tools to interact with your study tracker database - viewing tasks and sessions, creating tasks, and managing subtasks.

## Features

### Tools Provided

1. **`get_tasks`** - Retrieve tasks with filtering
   - Filter by user, status, priority, subject
   - Include subtasks for exploratory tasks
   - Pagination support

2. **`get_sessions`** - Retrieve study sessions
   - Filter by user, subject, topic, date range
   - Automatic statistics calculation
   - Grouped by subject

3. **`add_task`** - Create new tasks
   - Support for normal and exploratory tasks
   - Optional subject assignment, deadlines, priority
   - URL and attachment support

4. **`add_subtask`** - Add subtasks to exploratory tasks
   - Only for exploratory task types
   - Track completion status
   - Automatic parent task statistics

## Installation

### 1. Install Dependencies

```bash
cd mcp-server
npm install
```

### 2. Configure Environment

Create a `.env` file in the `mcp-server` directory:

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` with your database connection:

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Optional: Default user ID for single-user setups
DEFAULT_USER_ID=1
```

**Get your DATABASE_URL:**
- If using Neon (like the main app): Copy from your Neon dashboard
- Should be the same as your backend `.env` file

### 3. Test the Server

```bash
npm start
```

You should see:
```
Starting Vela Study Tracker MCP Server...
Database connection successful
MCP Server running on stdio
Available tools: get_tasks, get_sessions, add_task, add_subtask
```

Press `Ctrl+C` to stop.

## Configuration for Claude Desktop

### Add to Claude Desktop Config

Edit your Claude Desktop configuration file:

**Location:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

**Add this to the `mcpServers` section:**

```json
{
  "mcpServers": {
    "vela-study-tracker": {
      "command": "node",
      "args": [
        "C:/Users/91994/Projects/studytracker/mcp-server/index.js"
      ],
      "env": {
        "DATABASE_URL": "your_postgresql_connection_string_here"
      }
    }
  }
}
```

**Alternative using .env file:**

```json
{
  "mcpServers": {
    "vela-study-tracker": {
      "command": "node",
      "args": [
        "C:/Users/91994/Projects/studytracker/mcp-server/index.js"
      ],
      "cwd": "C:/Users/91994/Projects/studytracker/mcp-server"
    }
  }
}
```

### Restart Claude Desktop

After modifying the config, restart Claude Desktop completely for changes to take effect.

## Usage Examples

Once configured in Claude Desktop, you can interact with the MCP server using natural language:

### Getting Tasks

```
"Show me all my pending tasks"
"What tasks do I have with high priority?"
"List all tasks for subject ID 5"
"Show me all exploratory tasks with their subtasks"
```

The MCP server will use the `get_tasks` tool with appropriate filters.

### Getting Study Sessions

```
"Show me my study sessions from this week"
"How many hours did I study last month?"
"Show me all sessions for subject ID 3"
"What's my study statistics for the past 7 days?"
```

The MCP server will use `get_sessions` with date filtering and return statistics.

### Adding Tasks

```
"Create a new task: Complete React tutorial"
"Add a high priority task for subject 5: Prepare for exam"
"Create an exploratory task: Research machine learning with deadline 2026-02-15"
```

The MCP server will use `add_task` to create tasks with appropriate parameters.

### Adding Subtasks

```
"Add a subtask to task 123: Watch video 1"
"Create subtasks for exploratory task 45: Read chapter 1, Complete exercises"
```

The MCP server will use `add_subtask` to add subtasks to exploratory tasks.

## Tool Reference

### get_tasks

**Parameters:**
- `user_id` (number, optional): Filter by user
- `status` (string, optional): `"pending"`, `"in_progress"`, or `"completed"`
- `subject_id` (number, optional): Filter by subject
- `priority` (string, optional): `"low"`, `"medium"`, `"high"`, or `"critical"`
- `include_subtasks` (boolean, optional): Include subtasks for exploratory tasks (default: `true`)
- `limit` (number, optional): Max results (default: 50)

**Returns:**
```json
{
  "success": true,
  "count": 10,
  "tasks": [
    {
      "id": 123,
      "title": "Complete React Tutorial",
      "status": "pending",
      "priority": "high",
      "subject_name": "Web Development",
      "subtasks": [...]
    }
  ],
  "filters_applied": {...}
}
```

### get_sessions

**Parameters:**
- `user_id` (number, optional): Filter by user
- `subject_id` (number, optional): Filter by subject
- `topic_id` (number, optional): Filter by topic
- `start_date` (string, optional): ISO format `"YYYY-MM-DD"`
- `end_date` (string, optional): ISO format `"YYYY-MM-DD"`
- `limit` (number, optional): Max results (default: 50)

**Returns:**
```json
{
  "success": true,
  "count": 25,
  "sessions": [...],
  "statistics": {
    "total_sessions": 25,
    "total_duration_minutes": 750,
    "total_duration_hours": "12.50",
    "average_session_duration": "30.00"
  },
  "by_subject": {...}
}
```

### add_task

**Parameters:**
- `user_id` (number, **required**): Task owner
- `title` (string, **required**): Task title
- `description` (string, optional): Task description
- `status` (string, optional): Default: `"pending"`
- `priority` (string, optional): Default: `"medium"`
- `deadline` (string, optional): ISO format
- `subject_id` (number, optional): Subject association
- `task_type` (string, optional): `"normal"` or `"exploratory"` (default: `"normal"`)
- `url` (string, optional): Content link
- `attachment_url` (string, optional): Attachment link

**Returns:**
```json
{
  "success": true,
  "message": "Task created successfully",
  "task": {
    "id": 456,
    "title": "New Task",
    "status": "pending",
    ...
  }
}
```

### add_subtask

**Parameters:**
- `task_id` (number, **required**): Parent exploratory task ID
- `title` (string, **required**): Subtask title
- `description` (string, optional): Subtask description
- `completed` (boolean, optional): Default: `false`

**Returns:**
```json
{
  "success": true,
  "message": "Subtask added successfully",
  "subtask": {
    "id": 789,
    "task_id": 456,
    "title": "Subtask 1",
    "completed": false
  },
  "parent_task": {
    "id": 456,
    "title": "Parent Task",
    "total_subtasks": 5,
    "completed_subtasks": 2
  }
}
```

## Troubleshooting

### Server won't start

**Check database connection:**
```bash
# In mcp-server directory
node -e "import('dotenv').then(d => d.config()); import('pg').then(pg => { const p = new pg.Pool({connectionString: process.env.DATABASE_URL}); p.query('SELECT NOW()').then(() => console.log('OK')).catch(e => console.error(e)).finally(() => p.end()); });"
```

### Claude Desktop doesn't see the tools

1. Check the config file path is correct
2. Ensure the absolute path to `index.js` is correct
3. Restart Claude Desktop completely
4. Check Claude Desktop logs for errors

### Permission errors on Windows

Make sure the path uses forward slashes or escaped backslashes:
```json
"args": ["C:/Users/91994/Projects/studytracker/mcp-server/index.js"]
```

### Database connection errors

- Verify `DATABASE_URL` is correct
- Check your Neon database is accessible
- Ensure SSL mode is set correctly (`?sslmode=require` for Neon)

## Development

### Testing tools manually

You can test tools using the MCP inspector:

```bash
npx @modelcontextprotocol/inspector node index.js
```

This opens a web interface to test your tools interactively.

### Adding new tools

1. Create a new file in `tools/` directory
2. Export the handler function and schema
3. Import and register in `index.js`
4. Update this README

## Security Notes

- The MCP server has full database access - only use with trusted AI assistants
- Consider setting `DEFAULT_USER_ID` for single-user setups to prevent cross-user data access
- Never expose the MCP server to the internet (it's designed for local stdio use)
- Keep your `DATABASE_URL` secure and never commit it to version control

## Architecture

```
mcp-server/
├── index.js              # Main server entry point
├── database.js           # PostgreSQL connection pool
├── tools/                # Individual tool implementations
│   ├── get-tasks.js
│   ├── get-sessions.js
│   ├── add-task.js
│   └── add-subtask.js
├── package.json
├── .env                  # Environment configuration (not in git)
└── README.md
```

## License

Same as the main Vela Study Tracker application.

## Support

For issues or questions:
1. Check this README thoroughly
2. Review the main application's CLAUDE.md
3. Check MCP SDK documentation: https://modelcontextprotocol.io/
