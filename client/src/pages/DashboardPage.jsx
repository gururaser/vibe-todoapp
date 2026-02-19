import { useEffect, useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import useTodoStore from '../store/todoStore';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import TodoList from '../components/TodoList';
import TodoForm from '../components/TodoForm';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
    const { connected } = useSocket();
    const fetchTodos = useTodoStore((s) => s.fetchTodos);
    const fetchCategories = useTodoStore((s) => s.fetchCategories);
    const fetchTags = useTodoStore((s) => s.fetchTags);
    const filters = useTodoStore((s) => s.filters);

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editTodo, setEditTodo] = useState(null); // todo to edit, or null for create

    // Initial data load
    useEffect(() => {
        fetchCategories();
        fetchTags();
    }, []);

    // Re-fetch todos when filters change
    useEffect(() => {
        fetchTodos();
    }, [filters]);

    const openCreate = () => { setEditTodo(null); setShowForm(true); };
    const openEdit = (todo) => { setEditTodo(todo); setShowForm(true); };
    const closeForm = () => { setShowForm(false); setEditTodo(null); };

    return (
        <div className={styles.layout}>
            <Sidebar open={sidebarOpen} />

            <div className={styles.main}>
                <Header
                    sidebarOpen={sidebarOpen}
                    onToggleSidebar={() => setSidebarOpen((p) => !p)}
                    onAddTodo={openCreate}
                    connected={connected}
                />

                <div className={styles.content}>
                    <TodoList onEdit={openEdit} />
                </div>
            </div>

            {showForm && (
                <TodoForm todo={editTodo} onClose={closeForm} />
            )}
        </div>
    );
}
