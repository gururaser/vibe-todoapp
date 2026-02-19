import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { GripVertical, Pencil, Trash2, Calendar, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import useTodoStore from '../store/todoStore';
import styles from './TodoCard.module.css';

const PRIORITY_CONFIG = {
    low: { label: 'Low', cls: 'badge-priority-low' },
    medium: { label: 'Medium', cls: 'badge-priority-medium' },
    high: { label: 'High', cls: 'badge-priority-high' },
};

function formatDate(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isOverdue(dateStr) {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
}

export default function TodoCard({ todo, onEdit }) {
    const updateTodo = useTodoStore((s) => s.updateTodo);
    const deleteTodo = useTodoStore((s) => s.deleteTodo);
    const categories = useTodoStore((s) => s.categories);
    const [checking, setChecking] = useState(false);

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id: todo.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.45 : 1,
        zIndex: isDragging ? 9 : 'auto',
    };

    const category = categories.find((c) => c.id === todo.category_id);
    const overdue = !todo.completed && isOverdue(todo.due_date);

    const handleToggle = async () => {
        if (checking) return;
        setChecking(true);
        try {
            await updateTodo(todo.id, { completed: !todo.completed });
        } catch {
            toast.error('Could not update todo');
        } finally {
            setChecking(false);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteTodo(todo.id);
        } catch {
            toast.error('Could not delete todo');
        }
    };

    return (
        <div ref={setNodeRef} style={style} className={`${styles.card} ${todo.completed ? styles.done : ''}`}>
            {/* Drag handle */}
            <button className={styles.dragHandle} {...attributes} {...listeners} tabIndex={-1}>
                <GripVertical size={16} />
            </button>

            {/* Checkbox */}
            <button className={styles.checkbox} onClick={handleToggle} aria-label="Toggle complete">
                <motion.div
                    className={`${styles.checkInner} ${todo.completed ? styles.checked : ''}`}
                    initial={false}
                    animate={{ scale: checking ? 0.85 : 1 }}
                >
                    {todo.completed && (
                        <motion.svg
                            viewBox="0 0 12 10"
                            fill="none"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.25 }}
                            width="12" height="10"
                        >
                            <motion.path
                                d="M1 5l3.5 3.5L11 1"
                                stroke="#fff"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </motion.svg>
                    )}
                </motion.div>
            </button>

            {/* Content */}
            <div className={styles.content}>
                <div className={styles.titleRow}>
                    <span className={`${styles.title} ${todo.completed ? styles.strikethrough : ''}`}>
                        {todo.title}
                    </span>
                    <div className={styles.actions}>
                        <button className="btn-icon" onClick={() => onEdit(todo)} title="Edit">
                            <Pencil size={14} />
                        </button>
                        <button className="btn-icon" onClick={handleDelete} title="Delete"
                            style={{ color: 'var(--danger)' }}>
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>

                {todo.description && (
                    <p className={styles.description}>{todo.description}</p>
                )}

                {/* Meta row */}
                <div className={styles.meta}>
                    {category && (
                        <span className={styles.category}>
                            <span className={styles.catDot} style={{ background: category.color }} />
                            {category.name}
                        </span>
                    )}

                    {todo.priority && (
                        <span className={`badge ${PRIORITY_CONFIG[todo.priority].cls}`}>
                            {PRIORITY_CONFIG[todo.priority].label}
                        </span>
                    )}

                    {todo.due_date && (
                        <span className={`${styles.dueDate} ${overdue ? styles.overdue : ''}`}>
                            {overdue && <AlertCircle size={12} />}
                            <Calendar size={12} />
                            {formatDate(todo.due_date)}
                        </span>
                    )}

                    {todo.tags?.map((tag) => (
                        <span key={tag.id} className="tag-chip">#{tag.name}</span>
                    ))}
                </div>
            </div>
        </div>
    );
}
