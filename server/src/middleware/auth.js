const jwt = require('jsonwebtoken');

/**
 * Authentication middleware.
 * Reads JWT from httpOnly cookie, verifies it, and attaches user to req.
 */
const authGuard = (req, res, next) => {
    const token = req.cookies?.token;

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authenticated', code: 'UNAUTHENTICATED' });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload; // { id, email, name }
        next();
    } catch {
        return res.status(401).json({ success: false, message: 'Invalid or expired token', code: 'INVALID_TOKEN' });
    }
};

module.exports = { authGuard };
