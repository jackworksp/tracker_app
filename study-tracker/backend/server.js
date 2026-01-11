const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const subjectsRoutes = require('./routes/subjects');
const progressRoutes = require('./routes/progress');

// API Routes
app.use('/api/subjects', subjectsRoutes);
app.use('/api/progress', progressRoutes);

// Serve Frontend in Production
const path = require('path');
if (process.env.NODE_ENV === 'production') {
    // Serve static files from the React app
    app.use(express.static(path.join(__dirname, '../frontend/dist')));

    // Handle React routing, return all requests to React app
    app.get('*', (req, res) => {
        // Skip API routes
        if (req.path.startsWith('/api') || req.path.startsWith('/health')) return next();
        res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
    });
}

// Root endpoint (API info only if not hitting frontend)
app.get('/api', (req, res) => {
    res.json({
        message: 'Universal Study Tracker API',
        version: '2.0.0',
        features: ['Multi-subject support', 'Progress tracking', 'Spaced repetition'],
        endpoints: {
            health: '/health',
            subjects: {
                list: 'GET /api/subjects',
                create: 'POST /api/subjects',
                get: 'GET /api/subjects/:id',
                update: 'PUT /api/subjects/:id',
                delete: 'DELETE /api/subjects/:id'
            },
            progress: {
                get: 'GET /api/progress/:subject_id',
                seedAWS: 'POST /api/progress/seed/:subject_id'
            },
            topics: {
                create: 'POST /api/progress/topics',
                update: 'PUT /api/progress/topics/:id'
            },
            sessions: {
                create: 'POST /api/progress/sessions'
            },
            revisions: {
                create: 'POST /api/progress/revisions',
                update: 'PUT /api/progress/revisions/:id',
                delete: 'DELETE /api/progress/revisions/:id'
            }
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Universal Study Tracker API running on http://localhost:${PORT}`);
    console.log(`📊 Database: Neon PostgreSQL (Serverless)`);
    console.log(`🌐 API Endpoints:`);
    console.log(`   GET    /health`);
    console.log(`   GET    /api/subjects`);
    console.log(`   POST   /api/subjects`);
    console.log(`   GET    /api/subjects/:id`);
    console.log(`   PUT    /api/subjects/:id`);
    console.log(`   DELETE /api/subjects/:id`);
    console.log(`   GET    /api/progress/:subject_id`);
    console.log(`   POST   /api/progress/seed/:subject_id (Seed AWS topics)`);
    console.log(`   POST   /api/progress/topics`);
    console.log(`   PUT    /api/progress/topics/:id`);
    console.log(`   POST   /api/progress/sessions`);
    console.log(`   POST   /api/progress/revisions`);
    console.log(`   PUT    /api/progress/revisions/:id`);
    console.log(`   DELETE /api/progress/revisions/:id`);
});
