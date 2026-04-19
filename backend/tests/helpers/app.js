// Minimal Express app for testing — no rate limiting, no MCP, no AWS SSM.
// Routes are identical to production; only the surrounding infrastructure differs.
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const express = require('express');

const app = express();
app.use(express.json());

const appRouter = express.Router();

appRouter.use('/api/auth', require('../../routes/auth'));
appRouter.use('/api/tasks', require('../../routes/tasks'));
appRouter.use('/api/subjects', require('../../routes/subjects'));
appRouter.use('/api/goals', require('../../routes/goals'));
appRouter.use('/api/important-dates', require('../../routes/important-dates'));
appRouter.use('/api/progress', require('../../routes/progress'));
appRouter.use('/api/attachments', require('../../routes/attachments'));
appRouter.use('/api/ask', require('../../routes/ask'));
appRouter.use('/api/feeds', require('../../routes/feeds'));

app.use('/vela', appRouter);

module.exports = app;
