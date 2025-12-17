const jwt = require('jsonwebtoken');

// Verify User Access Token (30 menit)
exports.verifyUserToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        
        if (!authHeader) {
            return res.status(401).json({ message: 'Token diperlukan!' });
        }

        // Extract token dari "Bearer <token>"
        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.slice(7) 
            : authHeader;

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if it's an access token
        if (decoded.type !== 'access') {
            return res.status(401).json({ message: 'Token tidak valid!' });
        }

        // Attach user data to request
        req.user = {
            id: decoded.id,
            email: decoded.email,
            username: decoded.username,
            plant_health: decoded.plant_health
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                message: 'Access token expired!',
                code: 'TOKEN_EXPIRED'
            });
        }
        console.error('Token verification error:', error);
        res.status(401).json({ message: 'Token tidak valid!' });
    }
};

// Optional: Verify token tapi tidak throw error jika expired (untuk ambil payload)
exports.verifyUserTokenOptional = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        
        if (!authHeader) {
            req.user = null;
            return next();
        }

        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.slice(7) 
            : authHeader;

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            if (decoded.type === 'access') {
                req.user = {
                    id: decoded.id,
                    email: decoded.email,
                    username: decoded.username,
                    plant_health: decoded.plant_health
                };
            }
        } catch (tokenError) {
            // Token invalid atau expired, tapi tidak error
            req.user = null;
        }

        next();
    } catch (error) {
        console.error('Error in optional token verification:', error);
        req.user = null;
        next();
    }
};

// Decode token tanpa verify (untuk ambil payload expired)
exports.decodeToken = (token) => {
    try {
        return jwt.decode(token);
    } catch (error) {
        return null;
    }
};
