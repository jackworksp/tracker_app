const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

// JWT Secret - in production, this should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

// Helper function to generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Helper function to verify JWT token
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

// POST /auth/signup - Register new user
router.post('/signup', async (req, res) => {
    try {
        const { name, password } = req.body;
        const email = req.body.email ? req.body.email.trim().toLowerCase() : '';

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({ 
                error: 'Name, email, and password are required' 
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                error: 'Invalid email format' 
            });
        }

        // Validate password strength (minimum 6 characters)
        if (password.length < 6) {
            return res.status(400).json({ 
                error: 'Password must be at least 6 characters long' 
            });
        }

        // Check if user already exists
        const existingUser = await db.query(
            'SELECT id FROM user_settings WHERE user_id = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ 
                error: 'User with this email already exists' 
            });
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Create user
        const result = await db.query(
            `INSERT INTO user_settings (user_id, name, password_hash, created_at, updated_at)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             RETURNING id, user_id, name, active_subject_id, created_at`,
            [email, name, passwordHash]
        );

        const user = result.rows[0];

        // Generate JWT token
        const token = generateToken(user.id);

        // Return user data and token
        res.status(201).json({
            token,
            user: {
                id: user.id,
                user_id: user.user_id,
                name: user.name,
                active_subject_id: user.active_subject_id
            }
        });

    } catch (err) {
        console.error('Error in signup:', err);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// POST /auth/login - Authenticate user
router.post('/login', async (req, res) => {
    try {
        const { password } = req.body;
        const email = req.body.email ? req.body.email.trim().toLowerCase() : '';

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Email and password are required' 
            });
        }

        // Find user by email
        const result = await db.query(
            'SELECT id, user_id, name, password_hash, active_subject_id FROM user_settings WHERE user_id = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ 
                error: 'Invalid email or password' 
            });
        }

        const user = result.rows[0];

        // Check if user has a password (for backward compatibility with old users)
        if (!user.password_hash) {
            return res.status(401).json({ 
                error: 'Please sign up to create a password for your account' 
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ 
                error: 'Invalid email or password' 
            });
        }

        // Generate JWT token
        const token = generateToken(user.id);

        // Update last login timestamp
        await db.query(
            'UPDATE user_settings SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );

        // Return user data and token
        res.json({
            token,
            user: {
                id: user.id,
                user_id: user.user_id,
                name: user.name,
                active_subject_id: user.active_subject_id
            }
        });

    } catch (err) {
        console.error('Error in login:', err);
        res.status(500).json({ error: 'Failed to login' });
    }
});

// GET /auth/me - Get current user profile
router.get('/me', async (req, res) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                error: 'No token provided' 
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = verifyToken(token);

        if (!decoded) {
            return res.status(401).json({ 
                error: 'Invalid or expired token' 
            });
        }

        // Get user from database
        const result = await db.query(
            'SELECT id, user_id, name, active_subject_id FROM user_settings WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                error: 'User not found' 
            });
        }

        const user = result.rows[0];

        // Return user data
        res.json({
            id: user.id,
            user_id: user.user_id,
            name: user.name,
            active_subject_id: user.active_subject_id
        });

    } catch (err) {
        console.error('Error in /me:', err);
        res.status(500).json({ error: 'Failed to get user profile' });
    }
});

module.exports = router;
