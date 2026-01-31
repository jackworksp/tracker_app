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
        const authRoutes = require('./routes/auth');
        const subjectsRoutes = require('./routes/subjects');
        const progressRoutes = require('./routes/progress');
        const tasksRoutes = require('./routes/tasks');

        const app = express();
        const PORT = process.env.PORT || 3000;

        // Middleware
        app.use(cors());
        app.use(express.json());

        // Initialize Database Tables
        await db.initialize();

        // Create a router for the app prefix
        const appRouter = express.Router();

        // API Routes mounted on appRouter
        appRouter.use('/api/auth', authRoutes);
        appRouter.use('/api/subjects', subjectsRoutes);
        appRouter.use('/api/progress', progressRoutes);
        appRouter.use('/api/tasks', tasksRoutes);

        // Health check endpoint (before catch-all)
        appRouter.get('/health', (req, res) => {
            res.json({
                status: 'OK',
                message: 'Study Tracker API is running',
                database: 'Neon PostgreSQL',
                apk_download: '/trackapp/app-release.apk'
            });
        });

        // Serve APK file for mobile app download (before catch-all)
        appRouter.get('/app-release.apk', (req, res) => {
            const apkPath = path.join(__dirname, '../mobile/app-release.apk');
            res.download(apkPath, 'TaskTracker.apk', (err) => {
                if (err) {
                    console.error('Error downloading APK:', err);
                    res.status(404).json({ error: 'APK file not found' });
                }
            });
        });

        // Serve Frontend in Production under /trackapp (catch-all must be last)
        if (process.env.NODE_ENV === 'production') {
            appRouter.use(express.static(path.join(__dirname, '../frontend/dist')));

            appRouter.get('*', (req, res, next) => {
                if (req.path.startsWith('/api') || req.path.startsWith('/health') || req.path === '/app-release.apk') return next();
                res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
            });
        }

        // Mount the router under /trackapp
        app.use('/trackapp', appRouter);

        // Redirect root to /trackapp for convenience (optional but helpful)
        app.get('/', (req, res) => res.redirect('/trackapp'));

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
