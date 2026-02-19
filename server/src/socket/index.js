const jwt = require('jsonwebtoken');
const cookie = require('cookie');

/**
 * Initialize Socket.io event handlers.
 * Each authenticated user joins a private room `user:{id}`.
 */
function initSocket(io) {
    // Auth middleware for Socket.io — validate JWT from cookie
    io.use((socket, next) => {
        try {
            const rawCookies = socket.handshake.headers.cookie || '';
            const cookies = cookie.parse(rawCookies);
            const token = cookies.token;

            if (!token) return next(new Error('UNAUTHENTICATED'));

            const payload = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = payload;
            next();
        } catch {
            next(new Error('INVALID_TOKEN'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.user.id;

        // Join private room
        socket.join(`user:${userId}`);
        console.log(`🔌 Socket connected: user ${userId} (${socket.id})`);

        socket.on('disconnect', (reason) => {
            console.log(`🔌 Socket disconnected: user ${userId} — ${reason}`);
        });
    });
}

module.exports = { initSocket };
