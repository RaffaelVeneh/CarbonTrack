const jwt = require('jsonwebtoken');

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
const verifyUserToken = (req, res, next) => {
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

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if this is an access token (not refresh token)
        if (decoded.type !== 'access') {
            return res.status(401).json({ 
                message: 'Invalid token type. Access token required.' 
            });
        }
        
        // Attach decoded user info to request
        req.user = decoded;
        req.userId = decoded.id;
        
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
