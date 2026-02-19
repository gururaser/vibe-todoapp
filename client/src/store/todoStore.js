import { create } from 'zustand';
import { arrayMove } from '@dnd-kit/sortable';
import api from '../api/axios';

const useTodoStore = create((set, get) => ({
    todos: [],
    categories: [],
    tags: [],
    filters: {
        search: '',
        category: '',
        tag: '',
        priority: '',
        completed: '',
    },

    // ─── Filters ──────────────────────────────────────────────────────────────
    setFilter: (key, value) =>
        set((s) => ({ filters: { ...s.filters, [key]: value } })),

    resetFilters: () =>
        set({ filters: { search: '', category: '', tag: '', priority: '', completed: '' } }),

    // ─── Todos ────────────────────────────────────────────────────────────────
    fetchTodos: async () => {
        const { filters } = get();
        const params = Object.fromEntries(
            Object.entries(filters).filter(([, v]) => v !== '')
        );
        const { data } = await api.get('/todos', { params });
        set({ todos: data.todos });
    },

    createTodo: async (payload) => {
        // BUG FIX 2: Do NOT push to state here.
        // The server emits a 'todo:created' socket event to this client's room,
        // which will add the todo via applySocketEvent.
        // Pushing here AND via socket was causing the duplicate.
        const { data } = await api.post('/todos', payload);
        return data.todo;
    },

    updateTodo: async (id, payload) => {
        const prev = get().todos;
        // Optimistic update
        set((s) => ({
            todos: s.todos.map((t) => (t.id === id ? { ...t, ...payload } : t)),
        }));
        try {
            const { data } = await api.patch(`/todos/${id}`, payload);
            set((s) => ({
                todos: s.todos.map((t) => (t.id === id ? data.todo : t)),
            }));
            return data.todo;
        } catch (err) {
            set({ todos: prev }); // revert on error
            throw err;
        }
    },

    deleteTodo: async (id) => {
        const prev = get().todos;
        set((s) => ({ todos: s.todos.filter((t) => t.id !== id) }));
        try {
            await api.delete(`/todos/${id}`);
        } catch (err) {
            set({ todos: prev });
            throw err;
        }
    },

    reorderTodos: async (activeId, overId) => {
        const todos = get().todos;
        const oldIndex = todos.findIndex((t) => t.id === activeId);
        const newIndex = todos.findIndex((t) => t.id === overId);
        if (oldIndex === newIndex) return;

        const newTodos = arrayMove(todos, oldIndex, newIndex);
        set({ todos: newTodos });

        // Persist to server
        const items = newTodos.map((t, i) => ({ id: t.id, order_index: i }));
        await api.patch('/todos/reorder', { items });
    },

    // ─── Real-time socket handlers (called from useSocket hook) ───────────────
    applySocketEvent: (event, payload) => {
        set((s) => {
            switch (event) {
                // ── Todos ─────────────────────────────────────────────────────
                case 'todo:created':
                    // Safe: createTodo no longer pre-adds, so no duplicate risk
                    if (s.todos.find((t) => t.id === payload.id)) return s;
                    return { todos: [...s.todos, payload] };

                case 'todo:updated':
                    return { todos: s.todos.map((t) => (t.id === payload.id ? payload : t)) };

                case 'todo:deleted':
                    return { todos: s.todos.filter((t) => t.id !== payload.id) };

                case 'todo:reordered': {
                    const orderMap = Object.fromEntries(payload.items.map((i) => [i.id, i.order_index]));
                    const updated = s.todos
                        .map((t) => (orderMap[t.id] !== undefined ? { ...t, order_index: orderMap[t.id] } : t))
                        .sort((a, b) => a.order_index - b.order_index);
                    return { todos: updated };
                }

                // ── Categories (BUG FIX 3) ────────────────────────────────────
                case 'category:created':
                    if (s.categories.find((c) => c.id === payload.id)) return s;
                    return { categories: [...s.categories, payload] };

                case 'category:deleted':
                    return { categories: s.categories.filter((c) => c.id !== payload.id) };

                // ── Tags (BUG FIX 3) ──────────────────────────────────────────
                case 'tag:created':
                    if (s.tags.find((t) => t.id === payload.id)) return s;
                    return { tags: [...s.tags, payload] };

                case 'tag:deleted':
                    return { tags: s.tags.filter((t) => t.id !== payload.id) };

                default:
                    return s;
            }
        });
    },

    // ─── Categories ───────────────────────────────────────────────────────────
    fetchCategories: async () => {
        const { data } = await api.get('/categories');
        set({ categories: data.categories });
    },

    createCategory: async (payload) => {
        const { data } = await api.post('/categories', payload);
        set((s) => ({ categories: [...s.categories, data.category] }));
        return data.category;
    },

    deleteCategory: async (id) => {
        await api.delete(`/categories/${id}`);
        set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }));
    },

    // ─── Tags ─────────────────────────────────────────────────────────────────
    fetchTags: async () => {
        const { data } = await api.get('/tags');
        set({ tags: data.tags });
    },

    createTag: async (name) => {
        const { data } = await api.post('/tags', { name });
        set((s) => ({ tags: [...s.tags, data.tag] }));
        return data.tag;
    },

    deleteTag: async (id) => {
        await api.delete(`/tags/${id}`);
        set((s) => ({ tags: s.tags.filter((t) => t.id !== id) }));
    },
}));

export default useTodoStore;
