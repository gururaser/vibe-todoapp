const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/todos', require('./todos.routes'));
router.use('/categories', require('./categories.routes'));
router.use('/tags', require('./tags.routes'));

module.exports = router;
