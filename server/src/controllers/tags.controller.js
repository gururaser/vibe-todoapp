const db = require('../db/knex');
const { asyncHandler, createError } = require('../middleware/errorHandler');

// GET /tags
exports.list = asyncHandler(async (req, res) => {
    const tags = await db('tags').where({ user_id: req.user.id }).orderBy('name');
    res.json({ success: true, tags });
});

// POST /tags — BUG FIX 3: emit socket event so other tabs sync
exports.create = asyncHandler(async (req, res) => {
    const { name } = req.body;
    try {
        const [tag] = await db('tags')
            .insert({ user_id: req.user.id, name: name.toLowerCase().trim() })
            .returning('*');

        const io = req.app.get('io');
        io.to(`user:${req.user.id}`).emit('tag:created', tag);

        res.status(201).json({ success: true, tag });
    } catch (err) {
        if (err.code === '23505') {
            throw createError('Tag already exists', 409, 'TAG_EXISTS');
        }
        throw err;
    }
});

// DELETE /tags/:id — BUG FIX 3: emit socket event so other tabs sync
exports.remove = asyncHandler(async (req, res) => {
    const deleted = await db('tags')
        .where({ id: req.params.id, user_id: req.user.id })
        .delete();
    if (!deleted) throw createError('Tag not found', 404, 'TAG_NOT_FOUND');

    const io = req.app.get('io');
    io.to(`user:${req.user.id}`).emit('tag:deleted', { id: req.params.id });

    res.json({ success: true, message: 'Tag deleted' });
});
