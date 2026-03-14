const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
// Load env vars immediately, handling CWD mismatch
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config(); // Fallback for standard .env

const { loadConfig } = require('./aws-config');

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
        const journalRoutes = require('./routes/journal');
        const notesRoutes = require('./routes/notes');
        const noteFoldersRoutes = require('./routes/note-folders');
        const noteLinksRoutes = require('./routes/note-links');
        const attachmentsRoutes = require('./routes/attachments');
        const attachmentFoldersRoutes = require('./routes/attachment-folders');
        const searchRoutes = require('./routes/search');
        const askRoutes = require('./routes/ask');
        const youtubeRoutes = require('./routes/youtube');
        const oauthRoutes = require('./routes/oauth');
        const { setupMcpRouter } = require('./mcp-http');

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
            max: 3000, // 3000 requests per window
            message: { error: 'Too many requests, please try again later' },
            standardHeaders: true,
            legacyHeaders: false,
        });

        // Middleware
        app.use(cors({
            origin: true, // Allow all origins for development
            credentials: true
        }));
        app.use(express.json());

        // Request Logging Middleware
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
        appRouter.use('/api/journal', journalRoutes);
        appRouter.use('/api/notes', notesRoutes);
        appRouter.use('/api/note-folders', noteFoldersRoutes);
        appRouter.use('/api/note-links', noteLinksRoutes);
        appRouter.use('/api/attachments', attachmentsRoutes);
        appRouter.use('/api/attachment-folders', attachmentFoldersRoutes);
        appRouter.use('/api/search', searchRoutes);
        appRouter.use('/api/ask', askRoutes);
        appRouter.use('/api/youtube', youtubeRoutes);

        // OAuth 2.0 endpoints for Claude.ai connector
        appRouter.use('/oauth', oauthRoutes);

        // OAuth discovery metadata (MCP spec requires this for auto-discovery)
        const oauthMeta = {
            issuer: 'https://seiyul.in',
            authorization_endpoint: 'https://seiyul.in/vela/oauth/authorize',
            token_endpoint: 'https://seiyul.in/vela/oauth/token',
            registration_endpoint: 'https://seiyul.in/vela/oauth/register',
            response_types_supported: ['code'],
            grant_types_supported: ['authorization_code'],
            code_challenge_methods_supported: ['S256'],
            token_endpoint_auth_methods_supported: ['none'],
            scopes_supported: ['read', 'write']
        };
        appRouter.get('/.well-known/oauth-authorization-server', (req, res) => res.json(oauthMeta));

        // MCP HTTP/SSE server — accessible at /vela/mcp/sse
        const mcpRouter = await setupMcpRouter(db.pool);
        appRouter.use('/mcp', mcpRouter);

        // Serve version info for mobile auto-update checks — fetches latest release from GitHub
        appRouter.get('/version.json', async (req, res) => {
            try {
                const ghRes = await fetch('https://api.github.com/repos/jackworksp/tracker_app/releases/latest', {
                    headers: { 'User-Agent': 'vela-server' }
                });
                if (!ghRes.ok) return res.status(502).json({ error: 'Could not fetch release info' });
                const release = await ghRes.json();
                // tag_name is like "build-42" — extract the number as version
                const version = release.tag_name?.replace('build-', '') || '0';
                res.json({ version, buildDate: release.published_at, tag: release.tag_name });
            } catch (err) {
                res.status(500).json({ error: 'Version check failed' });
            }
        });

        // Redirect APK download to GitHub Releases (latest build)
        appRouter.get('/app-release.apk', (req, res) => {
            res.redirect(302, 'https://github.com/jackworksp/tracker_app/releases/latest/download/app-release.apk');
        });

        // Serve uploaded files
        appRouter.use('/uploads', express.static(path.join(__dirname, 'uploads')));

        // Serve Frontend in Production under /vela
        if (process.env.NODE_ENV === 'production') {
            appRouter.use(express.static(path.join(__dirname, '../frontend-web/dist')));

            appRouter.get('*', (req, res, next) => {
                if (req.path.startsWith('/api') || req.path.startsWith('/health') || req.path.startsWith('/.well-known')) return next();
                res.sendFile(path.join(__dirname, '../frontend-web/dist', 'index.html'));
            });
        }

        // Health check under /vela/health
        appRouter.get('/health', (req, res) => {
            res.json({
                status: 'OK',
                message: 'Vela API is running',
                database: 'Neon PostgreSQL',
                apk_download: '/vela/app-release.apk'
            });
        });

        // Mount the router under /vela
        app.use('/vela', appRouter);

        // OAuth well-known discovery endpoints (at root level, after /vela mount)
        // Required for Claude.ai MCP connector auto-discovery
        app.get('/.well-known/oauth-authorization-server', (req, res) => res.json(oauthMeta));
        // RFC 9728: match both /.well-known/oauth-protected-resource AND
        // /.well-known/oauth-protected-resource/vela/mcp/sse (path-based discovery)
        app.get('/.well-known/oauth-protected-resource', (req, res) => res.json({
            resource: 'https://seiyul.in/vela/mcp/sse',
            authorization_servers: ['https://seiyul.in']
        }));
        app.get('/.well-known/oauth-protected-resource/*', (req, res) => res.json({
            resource: 'https://seiyul.in/vela/mcp/sse',
            authorization_servers: ['https://seiyul.in']
        }));

        // Redirect root to /vela for convenience (optional but helpful)
        app.get('/', (req, res) => res.redirect('/vela'));

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Vela API running on http://0.0.0.0:${PORT}`);
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
