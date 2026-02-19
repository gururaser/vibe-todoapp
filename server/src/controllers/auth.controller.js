const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db/knex');
const { asyncHandler, createError } = require('../middleware/errorHandler');

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const signToken = (user) =>
    jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

// POST /auth/register
exports.register = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const existing = await db('users').where({ email }).first();
    if (existing) throw createError('Email already in use', 409, 'EMAIL_IN_USE');

    const hashed = await bcrypt.hash(password, 12);
    const [user] = await db('users')
        .insert({ name, email, password: hashed })
        .returning(['id', 'email', 'name', 'created_at']);

    const token = signToken(user);
    res.cookie('token', token, COOKIE_OPTIONS);
    res.status(201).json({ success: true, user });
});

// POST /auth/login
exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await db('users').where({ email }).first();
    if (!user) throw createError('Invalid credentials', 401, 'INVALID_CREDENTIALS');

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw createError('Invalid credentials', 401, 'INVALID_CREDENTIALS');

    const { password: _, ...safeUser } = user;
    const token = signToken(safeUser);
    res.cookie('token', token, COOKIE_OPTIONS);
    res.json({ success: true, user: safeUser });
});

// POST /auth/logout
exports.logout = (req, res) => {
    res.clearCookie('token', { httpOnly: true, sameSite: 'lax' });
    res.json({ success: true, message: 'Logged out' });
};

// GET /auth/me
exports.me = asyncHandler(async (req, res) => {
    const user = await db('users')
        .where({ id: req.user.id })
        .select('id', 'email', 'name', 'created_at')
        .first();
    if (!user) throw createError('User not found', 404, 'USER_NOT_FOUND');
    res.json({ success: true, user });
});
