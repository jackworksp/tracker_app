const jwt = require('jsonwebtoken');

// JWT Secret - should match the one in routes/auth.js
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Authentication middleware
const authenticateToken = (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'No token provided. Please login to access this resource.'
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);

        if (!decoded || !decoded.userId) {
            return res.status(401).json({
                error: 'Invalid token'
            });
        }

        // Add userId to request object for use in route handlers
        req.userId = decoded.userId;

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expired. Please login again.'
            });
        }

        return res.status(401).json({
            error: 'Invalid or expired token'
        });
    }
};

module.exports = { authenticateToken };
