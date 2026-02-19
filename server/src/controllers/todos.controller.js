const db = require('../db/knex');
const { asyncHandler, createError } = require('../middleware/errorHandler');

// Helper: fetch a todo with its tags, verifying ownership
async function fetchTodo(id, userId) {
    const todo = await db('todos').where({ id, user_id: userId }).first();
    if (!todo) throw createError('Todo not found', 404, 'TODO_NOT_FOUND');

    const tags = await db('tags')
        .join('todo_tags', 'tags.id', 'todo_tags.tag_id')
        .where('todo_tags.todo_id', id)
        .select('tags.id', 'tags.name');

    return { ...todo, tags };
}

// ─── GET /todos ───────────────────────────────────────────────────────────────
exports.list = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { category, tag, priority, search, completed } = req.query;

    let query = db('todos')
        .where('todos.user_id', userId)
        .orderBy('todos.order_index', 'asc');

    if (category) query = query.where('todos.category_id', category);
    if (priority) query = query.where('todos.priority', priority);
    if (completed !== undefined) query = query.where('todos.completed', completed === 'true');
    if (search) query = query.whereILike('todos.title', `%${search}%`);

    if (tag) {
        query = query
            .join('todo_tags', 'todos.id', 'todo_tags.todo_id')
            .join('tags', 'tags.id', 'todo_tags.tag_id')
            .where('tags.id', tag)
            .select('todos.*');
    }

    const todos = await query.select('todos.*');

    // Attach tags to each todo
    const todoIds = todos.map((t) => t.id);
    const allTags = todoIds.length
        ? await db('tags')
            .join('todo_tags', 'tags.id', 'todo_tags.tag_id')
            .whereIn('todo_tags.todo_id', todoIds)
            .select('tags.id', 'tags.name', 'todo_tags.todo_id')
        : [];

    const tagsByTodo = allTags.reduce((acc, t) => {
        if (!acc[t.todo_id]) acc[t.todo_id] = [];
        acc[t.todo_id].push({ id: t.id, name: t.name });
        return acc;
    }, {});

    const result = todos.map((t) => ({ ...t, tags: tagsByTodo[t.id] || [] }));
    res.json({ success: true, todos: result });
});

// ─── POST /todos ──────────────────────────────────────────────────────────────
exports.create = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { title, description, category_id, priority, due_date, tag_ids = [] } = req.body;

    // Get max order_index for this user
    const maxResult = await db('todos').where({ user_id: userId }).max('order_index as max').first();
    const orderIndex = (maxResult?.max ?? -1) + 1;

    const [todo] = await db('todos')
        .insert({
            user_id: userId,
            category_id: category_id || null,
            title,
            description: description || null,
            priority: priority || null,
            due_date: due_date || null,
            order_index: orderIndex,
        })
        .returning('*');

    // Associate tags
    if (tag_ids.length) {
        await db('todo_tags').insert(tag_ids.map((tag_id) => ({ todo_id: todo.id, tag_id })));
    }

    const fullTodo = await fetchTodo(todo.id, userId);

    // Emit real-time event
    const io = req.app.get('io');
    io.to(`user:${userId}`).emit('todo:created', fullTodo);

    res.status(201).json({ success: true, todo: fullTodo });
});

// ─── GET /todos/:id ───────────────────────────────────────────────────────────
exports.getOne = asyncHandler(async (req, res) => {
    const todo = await fetchTodo(req.params.id, req.user.id);
    res.json({ success: true, todo });
});

// ─── PATCH /todos/:id ─────────────────────────────────────────────────────────
exports.update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, description, category_id, priority, due_date, completed, tag_ids } = req.body;

    // Verify ownership
    const existing = await db('todos').where({ id, user_id: userId }).first();
    if (!existing) throw createError('Todo not found', 404, 'TODO_NOT_FOUND');

    const updates = { updated_at: db.fn.now() };
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (category_id !== undefined) updates.category_id = category_id || null;
    if (priority !== undefined) updates.priority = priority || null;
    if (due_date !== undefined) updates.due_date = due_date || null;
    if (completed !== undefined) updates.completed = completed;

    await db('todos').where({ id }).update(updates);

    // Update tags if provided
    if (tag_ids !== undefined) {
        await db('todo_tags').where('todo_id', id).delete();
        if (tag_ids.length) {
            await db('todo_tags').insert(tag_ids.map((tag_id) => ({ todo_id: id, tag_id })));
        }
    }

    const updated = await fetchTodo(id, userId);

    const io = req.app.get('io');
    io.to(`user:${userId}`).emit('todo:updated', updated);

    res.json({ success: true, todo: updated });
});

// ─── DELETE /todos/:id ────────────────────────────────────────────────────────
exports.remove = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const deleted = await db('todos').where({ id, user_id: userId }).delete();
    if (!deleted) throw createError('Todo not found', 404, 'TODO_NOT_FOUND');

    const io = req.app.get('io');
    io.to(`user:${userId}`).emit('todo:deleted', { id });

    res.json({ success: true, message: 'Todo deleted' });
});

// ─── PATCH /todos/reorder ─────────────────────────────────────────────────────
exports.reorder = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { items } = req.body; // [{ id, order_index }]

    if (!Array.isArray(items) || !items.length) {
        return res.json({ success: true });
    }

    // Update each todo's order_index in a transaction
    await db.transaction(async (trx) => {
        for (const { id, order_index } of items) {
            await trx('todos')
                .where({ id, user_id: userId })
                .update({ order_index, updated_at: db.fn.now() });
        }
    });

    const io = req.app.get('io');
    io.to(`user:${userId}`).emit('todo:reordered', { items });

    res.json({ success: true });
});
