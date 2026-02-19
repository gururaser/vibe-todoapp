import { motion, AnimatePresence } from 'framer-motion';
import {
    DndContext, closestCenter, PointerSensor, useSensor, useSensors
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import useTodoStore from '../store/todoStore';
import TodoCard from './TodoCard';
import { ClipboardList } from 'lucide-react';
import styles from './TodoList.module.css';
import toast from 'react-hot-toast';

export default function TodoList({ onEdit }) {
    const todos = useTodoStore((s) => s.todos);
    const reorderTodos = useTodoStore((s) => s.reorderTodos);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    const handleDragEnd = async ({ active, over }) => {
        if (!over || active.id === over.id) return;
        try {
            await reorderTodos(active.id, over.id);
        } catch {
            toast.error('Could not reorder todos');
        }
    };

    if (!todos.length) {
        return (
            <motion.div
                className={styles.empty}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <ClipboardList size={52} color="var(--text-dim)" />
                <p>No todos yet</p>
                <span>Click <strong>Add Todo</strong> to get started</span>
            </motion.div>
        );
    }

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={todos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                <div className={styles.list}>
                    <AnimatePresence mode="popLayout">
                        {todos.map((todo) => (
                            <motion.div
                                key={todo.id}
                                layout
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.22 }}
                            >
                                <TodoCard todo={todo} onEdit={onEdit} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </SortableContext>
        </DndContext>
    );
}
