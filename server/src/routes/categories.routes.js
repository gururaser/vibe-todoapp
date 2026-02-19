const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authGuard } = require('../middleware/auth');
const ctrl = require('../controllers/categories.controller');

router.use(authGuard);

router.get('/', ctrl.list);
router.post(
    '/',
    [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('color').matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Color must be a valid hex code'),
    ],
    validate,
    ctrl.create
);
router.delete('/:id', ctrl.remove);

module.exports = router;
