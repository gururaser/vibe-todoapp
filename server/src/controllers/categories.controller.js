const db = require('../db/knex');
const { asyncHandler, createError } = require('../middleware/errorHandler');

// GET /categories
exports.list = asyncHandler(async (req, res) => {
    const categories = await db('categories').where({ user_id: req.user.id }).orderBy('name');
    res.json({ success: true, categories });
});

// POST /categories — BUG FIX 3: emit socket event so other tabs sync
exports.create = asyncHandler(async (req, res) => {
    const { name, color } = req.body;
    const [category] = await db('categories')
        .insert({ user_id: req.user.id, name, color })
        .returning('*');

    // Notify all other tabs of this user
    const io = req.app.get('io');
    io.to(`user:${req.user.id}`).emit('category:created', category);

    res.status(201).json({ success: true, category });
});

// DELETE /categories/:id — BUG FIX 3: emit socket event so other tabs sync
exports.remove = asyncHandler(async (req, res) => {
    const deleted = await db('categories')
        .where({ id: req.params.id, user_id: req.user.id })
        .delete();
    if (!deleted) throw createError('Category not found', 404, 'CATEGORY_NOT_FOUND');

    const io = req.app.get('io');
    io.to(`user:${req.user.id}`).emit('category:deleted', { id: req.params.id });

    res.json({ success: true, message: 'Category deleted' });
});
