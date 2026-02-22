#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Import tool handlers
import { getTasks, getTasksSchema } from './tools/get-tasks.js';
import { getSessions, getSessionsSchema } from './tools/get-sessions.js';
import { addTask, addTaskSchema } from './tools/add-task.js';
import { addSubtask, addSubtaskSchema } from './tools/add-subtask.js';
import { getGoals, getGoalsSchema } from './tools/get-goals.js';
import { updateTask, updateTaskSchema } from './tools/update-task.js';
import { deleteTask, deleteTaskSchema } from './tools/delete-task.js';
import { addSession, addSessionSchema } from './tools/add-session.js';
import { getSubjects, getSubjectsSchema } from './tools/get-subjects.js';

// Import database connection and user resolver
import pool from './database.js';
import { resolveUser } from './config.js';

// Create MCP server instance
const server = new Server(
    {
        name: 'vela-study-tracker',
        version: '1.0.0',
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// Tool registry
const tools = [
    getTasksSchema,
    getSessionsSchema,
    addTaskSchema,
    addSubtaskSchema,
    getGoalsSchema,
    updateTaskSchema,
    deleteTaskSchema,
    addSessionSchema,
    getSubjectsSchema,
];

// Handle ListTools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: tools,
    };
});

// Handle CallTool request
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        let result;

        switch (name) {
            case 'get_tasks':
                result = await getTasks(args || {});
                break;

            case 'get_sessions':
                result = await getSessions(args || {});
                break;

            case 'add_task':
                result = await addTask(args || {});
                break;

            case 'add_subtask':
                result = await addSubtask(args || {});
                break;

            case 'get_goals':
                result = await getGoals(args || {});
                break;

            case 'update_task':
                result = await updateTask(args || {});
                break;

            case 'delete_task':
                result = await deleteTask(args || {});
                break;

            case 'add_session':
                result = await addSession(args || {});
                break;

            case 'get_subjects':
                result = await getSubjects(args || {});
                break;

            default:
                throw new Error(`Unknown tool: ${name}`);
        }

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2),
                },
            ],
        };
    } catch (error) {
        console.error(`Error executing tool ${name}:`, error);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(
                        {
                            success: false,
                            error: error.message,
                            tool: name,
                        },
                        null,
                        2
                    ),
                },
            ],
            isError: true,
        };
    }
});

// Error handling
server.onerror = (error) => {
    console.error('[MCP Error]', error);
};

process.on('SIGINT', async () => {
    console.error('\nShutting down MCP server...');
    await pool.end();
    process.exit(0);
});

// Start the server
async function main() {
    console.error('Starting Vela Study Tracker MCP Server...');

    // Test database connection
    try {
        await pool.query('SELECT NOW()');
        console.error('Database connection successful');
    } catch (error) {
        console.error('Database connection failed:', error.message);
        console.error('Please check your DATABASE_URL in .env file');
        process.exit(1);
    }

    // Validate API key and resolve user
    await resolveUser();

    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error('MCP Server running on stdio');
    console.error('Available tools: get_tasks, get_sessions, add_task, add_subtask, get_goals, update_task, delete_task, add_session, get_subjects');
}

main().catch((error) => {
    console.error('Fatal error starting MCP server:', error);
    process.exit(1);
});
