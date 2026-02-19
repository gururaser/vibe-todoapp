const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authGuard } = require('../middleware/auth');
const ctrl = require('../controllers/tags.controller');

router.use(authGuard);

router.get('/', ctrl.list);
router.post(
    '/',
    [body('name').trim().notEmpty().withMessage('Name is required')],
    validate,
    ctrl.create
);
router.delete('/:id', ctrl.remove);

module.exports = router;
