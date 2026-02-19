const router = require('express').Router();
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authGuard } = require('../middleware/auth');
const ctrl = require('../controllers/todos.controller');

// All todo routes require authentication
router.use(authGuard);

// IMPORTANT: /reorder must come BEFORE /:id to avoid matching 'reorder' as an id
// PATCH /api/v1/todos/reorder
router.patch('/reorder', ctrl.reorder);

// GET /api/v1/todos
router.get('/', ctrl.list);

// POST /api/v1/todos
router.post(
    '/',
    [
        body('title').trim().notEmpty().withMessage('Title is required'),
        body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
        body('due_date').optional({ nullable: true }).isISO8601().withMessage('Invalid date format'),
    ],
    validate,
    ctrl.create
);

// GET /api/v1/todos/:id
router.get('/:id', ctrl.getOne);

// PATCH /api/v1/todos/:id
router.patch(
    '/:id',
    [
        body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
        body('priority').optional({ nullable: true }).isIn(['low', 'medium', 'high', null]).withMessage('Invalid priority'),
    ],
    validate,
    ctrl.update
);

// DELETE /api/v1/todos/:id
router.delete('/:id', ctrl.remove);

module.exports = router;
