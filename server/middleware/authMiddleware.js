const jwt = require('jsonwebtoken');
const { isBlacklisted, getUserStatus } = require('../services/tokenBlacklist');

// Middleware to verify JWT token for ADMIN
const verifyToken = (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers['authorization'];
        
        if (!authHeader) {
            return res.status(401).json({ 
                message: 'Access denied. No token provided.' 
            });
        }

        // Token format: "Bearer <token>"
        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.slice(7) 
            : authHeader;

        if (!token) {
            return res.status(401).json({ 
                message: 'Access denied. Invalid token format.' 
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Attach decoded user info to request
        req.admin = decoded;
        
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                message: 'Token expired. Please login again.',
                tokenExpired: true
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                message: 'Invalid token.' 
            });
        }
        return res.status(500).json({ 
            message: 'Token verification failed.',
            error: error.message 
        });
    }
};

// Middleware to verify JWT token for REGULAR USERS (Access Token)
const verifyUserToken = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers['authorization'];
        
        if (!authHeader) {
            return res.status(401).json({ 
                message: 'Access denied. No token provided.',
                requireAuth: true
            });
        }

        // Token format: "Bearer <token>"
        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.slice(7) 
            : authHeader;

        if (!token) {
            return res.status(401).json({ 
                message: 'Access denied. Invalid token format.',
                requireAuth: true
            });
        }

        // Check if token is blacklisted (for refresh tokens during logout)
        const blacklisted = await isBlacklisted(token);
        if (blacklisted) {
            return res.status(401).json({ 
                message: 'Token has been revoked. Please login again.',
                requireAuth: true,
                tokenRevoked: true
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if this is an access token (not refresh token)
        if (decoded.type !== 'access') {
            return res.status(401).json({ 
                message: 'Invalid token type. Access token required.' 
            });
        }

        // ⚡ REAL-TIME BAN ENFORCEMENT - Check user status in Redis
        const userStatus = await getUserStatus(decoded.id);
        
        if (userStatus === 'banned') {
            return res.status(403).json({ 
                message: 'Your account has been banned. Please contact support.',
                accountBanned: true,
                requireAuth: true
            });
        }

        if (userStatus === 'offline') {
            // User has valid token but status is offline
            // This means user was force-logged out or unbanned - require re-login
            console.warn(`⚠️ User ${decoded.id} has valid token but status is offline - forcing re-authentication`);
            return res.status(401).json({ 
                message: 'Your session has expired. Please login again.',
                requireAuth: true,
                statusOffline: true
            });
        }
        
        if (!userStatus) {
            // User status not found in Redis
            // This can happen if Redis is down - allow request but log warning
            console.warn(`⚠️ User ${decoded.id} status not found in Redis (cache miss)`);
        }
        
        // Attach decoded user info to request
        req.user = decoded;
        req.userId = decoded.id;
        req.userStatus = userStatus;
        
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                message: 'Access token expired. Please refresh your token.',
                tokenExpired: true,
                requireRefresh: true
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                message: 'Invalid access token.',
                requireAuth: true
            });
        }
        return res.status(500).json({ 
            message: 'Token verification failed.',
            error: error.message 
        });
    }
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    try {
        // Check if admin info exists (set by verifyToken middleware)
        if (!req.admin) {
            return res.status(403).json({ 
                message: 'Access denied. Admin verification required.' 
            });
        }

        // Check if role is admin
        if (req.admin.role !== 'admin') {
            return res.status(403).json({ 
                message: 'Access denied. Admin privileges required.' 
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({ 
            message: 'Authorization check failed.',
            error: error.message 
        });
    }
};

module.exports = { verifyToken, verifyUserToken, isAdmin };
