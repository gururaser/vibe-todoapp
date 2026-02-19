import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import useTodoStore from '../store/todoStore';
import styles from './TodoForm.module.css';

export default function TodoForm({ todo, onClose }) {
    const isEdit = !!todo;
    const createTodo = useTodoStore((s) => s.createTodo);
    const updateTodo = useTodoStore((s) => s.updateTodo);
    const categories = useTodoStore((s) => s.categories);
    const tags = useTodoStore((s) => s.tags);

    const [form, setForm] = useState({
        title: todo?.title || '',
        description: todo?.description || '',
        category_id: todo?.category_id || '',
        priority: todo?.priority || '',
        due_date: todo?.due_date ? todo.due_date.slice(0, 10) : '',
    });
    const [selectedTags, setSelectedTags] = useState(
        todo?.tags?.map((t) => t.id) || []
    );
    const [loading, setLoading] = useState(false);

    // Close on Escape
    useEffect(() => {
        const handler = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const toggleTag = (id) =>
        setSelectedTags((prev) =>
            prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
        );

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) return;
        setLoading(true);
        try {
            const payload = {
                ...form,
                category_id: form.category_id || null,
                priority: form.priority || null,
                due_date: form.due_date || null,
                tag_ids: selectedTags,
            };
            if (isEdit) {
                await updateTodo(todo.id, payload);
                toast.success('Todo updated');
            } else {
                await createTodo(payload);
                toast.success('Todo created');
            }
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        // BUG FIX 1: The backdrop is now the flex centering container.
        // Framer Motion scale/y on the modal no longer conflicts with CSS transform.
        <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className={styles.modal}
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.modalHeader}>
                    <h2>{isEdit ? 'Edit Todo' : 'New Todo'}</h2>
                    <button className="btn-icon" onClick={onClose}><X size={18} /></button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* Title */}
                    <div className={styles.field}>
                        <label>Title *</label>
                        <input
                            autoFocus
                            type="text"
                            placeholder="What needs to be done?"
                            value={form.title}
                            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className={styles.field}>
                        <label>Description</label>
                        <textarea
                            placeholder="Add details… (optional)"
                            rows={3}
                            value={form.description}
                            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                        />
                    </div>

                    {/* Category + Priority row */}
                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label>Category</label>
                            <select value={form.category_id} onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}>
                                <option value="">— None —</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.field}>
                            <label>Priority</label>
                            <select value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}>
                                <option value="">— None —</option>
                                <option value="low">🟢 Low</option>
                                <option value="medium">🟡 Medium</option>
                                <option value="high">🔴 High</option>
                            </select>
                        </div>

                        <div className={styles.field}>
                            <label>Due Date</label>
                            <input
                                type="date"
                                value={form.due_date}
                                onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))}
                                style={{ colorScheme: 'dark' }}
                            />
                        </div>
                    </div>

                    {/* Tags */}
                    {tags.length > 0 && (
                        <div className={styles.field}>
                            <label>Tags</label>
                            <div className={styles.tagPicker}>
                                {tags.map((tag) => (
                                    <button
                                        key={tag.id}
                                        type="button"
                                        className={`tag-chip ${selectedTags.includes(tag.id) ? styles.tagSelected : ''}`}
                                        onClick={() => toggleTag(tag.id)}
                                    >
                                        #{tag.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className={styles.actions}>
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading || !form.title.trim()}>
                            {loading ? '…' : isEdit ? 'Save Changes' : 'Create Todo'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}
