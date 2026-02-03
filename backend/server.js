const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
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
        const goalsRoutes = require('./routes/goals');

        const app = express();
        const PORT = process.env.PORT || 3000;

        // Rate Limiting Configuration
        const authLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 5, // 5 requests per window
            message: { error: 'Too many authentication attempts, please try again later' },
            standardHeaders: true,
            legacyHeaders: false,
        });

        const apiLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // 100 requests per window
            message: { error: 'Too many requests, please try again later' },
            standardHeaders: true,
            legacyHeaders: false,
        });

        // Request Logging Middleware
        app.use((req, res, next) => {
            console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.url} from ${req.ip}`);
            next();
        });

        // Middleware
        app.use(cors());
        app.use(express.json());

        // Request Logging Middleware (Detailed)
        app.use((req, res, next) => {
            console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.url} from ${req.ip}`);
            next();
        });

        // Initialize Database Tables
        await db.initialize();

        // Create a router for the app prefix
        const appRouter = express.Router();

        // Apply rate limiters to API routes
        appRouter.use('/api/auth/login', authLimiter);
        appRouter.use('/api/auth/signup', authLimiter);
        appRouter.use('/api', apiLimiter);

        // API Routes mounted on appRouter
        appRouter.use('/api/auth', authRoutes);
        appRouter.use('/api/subjects', subjectsRoutes);
        appRouter.use('/api/progress', progressRoutes);
        appRouter.use('/api/tasks', tasksRoutes);
        appRouter.use('/api/goals', goalsRoutes);
        appRouter.use('/api/scrape', require('./routes/scraper'));

        // Serve APK file for mobile app download
        appRouter.get('/app-release.apk', (req, res) => {
            const apkPath = path.join(__dirname, '../mobile/app-release.apk');
            res.download(apkPath, 'TaskTracker.apk', (err) => {
                if (err) {
                    console.error('Error downloading APK:', err);
                    if (!res.headersSent) {
                        res.status(404).json({ error: 'APK file not found' });
                    }
                }
            });
        });

        // Serve Frontend in Production under /trackapp
        if (process.env.NODE_ENV === 'production') {
            appRouter.use(express.static(path.join(__dirname, '../frontend/dist')));
            
            appRouter.get('*', (req, res, next) => {
                if (req.path.startsWith('/api') || req.path.startsWith('/health')) return next();
                res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
            });
        }

        // Health check under /trackapp/health
        appRouter.get('/health', (req, res) => {
            res.json({ 
                status: 'OK', 
                message: 'Study Tracker API is running',
                database: 'Neon PostgreSQL',
                apk_download: '/trackapp/app-release.apk'
            });
        });

        // Mount the router under /trackapp
        app.use('/trackapp', appRouter);

        // Redirect root to /trackapp for convenience (optional but helpful)
        app.get('/', (req, res) => res.redirect('/trackapp'));

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Universal Study Tracker API running on http://0.0.0.0:${PORT}`);
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
