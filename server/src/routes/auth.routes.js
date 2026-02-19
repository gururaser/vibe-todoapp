const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authGuard } = require('../middleware/auth');
const ctrl = require('../controllers/auth.controller');

// POST /api/v1/auth/register
router.post(
    '/register',
    [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    ],
    validate,
    ctrl.register
);

// POST /api/v1/auth/login
router.post(
    '/login',
    [
        body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
        body('password').notEmpty().withMessage('Password is required'),
    ],
    validate,
    ctrl.login
);

// POST /api/v1/auth/logout
router.post('/logout', ctrl.logout);

// GET /api/v1/auth/me
router.get('/me', authGuard, ctrl.me);

module.exports = router;
