import { Menu, Plus, Wifi, WifiOff, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useTodoStore from '../store/todoStore';
import styles from './Header.module.css';

export default function Header({ sidebarOpen, onToggleSidebar, onAddTodo, connected }) {
    const search = useTodoStore((s) => s.filters.search);
    const setFilter = useTodoStore((s) => s.setFilter);
    const filters = useTodoStore((s) => s.filters);
    const resetFilters = useTodoStore((s) => s.resetFilters);

    const selectedPriority = filters.priority;
    const priorities = ['', 'low', 'medium', 'high'];

    return (
        <header className={styles.header}>
            <div className={styles.left}>
                <button className="btn-icon" onClick={onToggleSidebar} title="Toggle sidebar">
                    <Menu size={20} />
                </button>

                <div className={styles.searchWrap}>
                    <Search size={15} className={styles.searchIcon} />
                    <input
                        className={styles.searchInput}
                        type="text"
                        placeholder="Search todos…"
                        value={search}
                        onChange={(e) => setFilter('search', e.target.value)}
                    />
                </div>
            </div>

            <div className={styles.right}>
                {/* Priority filter */}
                <div className={styles.priorityFilters}>
                    {priorities.map((p) => (
                        <button
                            key={p || 'all'}
                            className={`${styles.filterChip} ${selectedPriority === p ? styles.filterActive : ''}`}
                            onClick={() => setFilter('priority', p)}
                        >
                            {p ? (
                                <span className={`badge badge-priority-${p}`}>{p}</span>
                            ) : 'All'}
                        </button>
                    ))}
                </div>

                {/* Real-time indicator */}
                <AnimatePresence>
                    <motion.div
                        className={`${styles.syncBadge} ${connected ? styles.syncConnected : styles.syncDisconnected}`}
                        title={connected ? 'Real-time sync active' : 'Reconnecting…'}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        {connected
                            ? <><Wifi size={13} /> Synced</>
                            : <><WifiOff size={13} /> Offline</>
                        }
                    </motion.div>
                </AnimatePresence>

                <button className="btn btn-primary" onClick={onAddTodo}>
                    <Plus size={16} /> Add Todo
                </button>
            </div>
        </header>
    );
}
