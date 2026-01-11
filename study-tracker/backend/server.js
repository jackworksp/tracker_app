const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { loadConfig } = require('./aws-config');
const path = require('path');

const startServer = async () => {
    try {
        // 1. Load Configuration (SSM or Env)
        await loadConfig();

        // 2. Import items that depend on DB config
        // Note: We require these AFTER loadConfig so process.env.DATABASE_URL is set
        const db = require('./database');
        const subjectsRoutes = require('./routes/subjects');
        const progressRoutes = require('./routes/progress');

        const app = express();
        const PORT = process.env.PORT || 3000;

        // Middleware
        app.use(cors());
        app.use(express.json());

        // API Routes
        app.use('/api/subjects', subjectsRoutes);
        app.use('/api/progress', progressRoutes);

        // Initialize Database Tables
        await db.initialize();

        // Serve Frontend in Production
        if (process.env.NODE_ENV === 'production') {
            app.use(express.static(path.join(__dirname, '../frontend/dist')));
            
            app.get('*', (req, res) => {
                if (req.path.startsWith('/api') || req.path.startsWith('/health')) return next();
                res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
            });
        }

        // Health check
        app.get('/health', (req, res) => {
            res.json({ 
                status: 'OK', 
                message: 'Study Tracker API is running',
                database: 'Neon PostgreSQL'
            });
        });

        // Root endpoint details (same as before)
        app.get('/api', (req, res) => {
            res.json({
                message: 'Universal Study Tracker API',
                version: '2.0.0',
                features: ['Multi-subject support', 'Progress tracking', 'Spaced repetition'],
                endpoints: {
                    health: '/health',
                    subjects: '/api/subjects',
                    progress: '/api/progress'
                }
            });
        });

        app.listen(PORT, () => {
            console.log(`🚀 Universal Study Tracker API running on http://localhost:${PORT}`);
            if (process.env.DB_SSM_PARAM_NAME) {
                console.log(`📊 Database Config: AWS Parameter Store (${process.env.DB_SSM_PARAM_NAME})`);
            } else {
                console.log(`📊 Database Config: Environment Variable`);
            }
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
