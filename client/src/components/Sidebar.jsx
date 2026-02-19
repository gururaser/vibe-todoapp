import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckSquare, ListTodo, CheckCheck, Tag, FolderOpen,
    Plus, Trash2, ChevronDown, ChevronRight, LogOut, User
} from 'lucide-react';
import toast from 'react-hot-toast';
import useTodoStore from '../store/todoStore';
import useAuthStore from '../store/authStore';
import styles from './Sidebar.module.css';

const CATEGORY_COLORS = ['#6C63FF', '#FF4C4C', '#4CAF50', '#F59E0B', '#06B6D4', '#EC4899', '#8B5CF6'];

export default function Sidebar({ open }) {
    const categories = useTodoStore((s) => s.categories);
    const tags = useTodoStore((s) => s.tags);
    const filters = useTodoStore((s) => s.filters);
    const setFilter = useTodoStore((s) => s.setFilter);
    const resetFilters = useTodoStore((s) => s.resetFilters);
    const createCategory = useTodoStore((s) => s.createCategory);
    const deleteCategory = useTodoStore((s) => s.deleteCategory);
    const createTag = useTodoStore((s) => s.createTag);
    const deleteTag = useTodoStore((s) => s.deleteTag);

    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);

    const [catOpen, setCatOpen] = useState(true);
    const [tagOpen, setTagOpen] = useState(true);
    const [newCatName, setNewCatName] = useState('');
    const [newCatColor, setNewCatColor] = useState('#6C63FF');
    const [newTagName, setNewTagName] = useState('');
    const [showCatForm, setShowCatForm] = useState(false);
    const [showTagForm, setShowTagForm] = useState(false);

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCatName.trim()) return;
        try {
            await createCategory({ name: newCatName.trim(), color: newCatColor });
            setNewCatName(''); setShowCatForm(false);
        } catch { toast.error('Could not create category'); }
    };

    const handleAddTag = async (e) => {
        e.preventDefault();
        if (!newTagName.trim()) return;
        try {
            await createTag(newTagName.trim());
            setNewTagName(''); setShowTagForm(false);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Could not create tag');
        }
    };

    const handleLogout = async () => {
        await logout();
        toast.success('Logged out');
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.aside
                    className={styles.sidebar}
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 260, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                >
                    {/* Logo */}
                    <div className={styles.logo}>
                        <CheckSquare size={22} color="#6C63FF" />
                        <span>TodoApp</span>
                    </div>

                    {/* Navigation */}
                    <nav className={styles.nav}>
                        <button
                            className={`${styles.navItem} ${!filters.completed && !filters.category && !filters.tag ? styles.active : ''}`}
                            onClick={resetFilters}
                        >
                            <ListTodo size={17} /> All Todos
                        </button>
                        <button
                            className={`${styles.navItem} ${filters.completed === 'true' ? styles.active : ''}`}
                            onClick={() => { resetFilters(); setFilter('completed', 'true'); }}
                        >
                            <CheckCheck size={17} /> Completed
                        </button>
                    </nav>

                    <div className={styles.divider} />

                    {/* Categories */}
                    <section className={styles.section}>
                        <div className={styles.sectionHeader} onClick={() => setCatOpen((p) => !p)}>
                            <span className={styles.sectionTitle}><FolderOpen size={14} /> Categories</span>
                            {catOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </div>
                        <AnimatePresence>
                            {catOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    style={{ overflow: 'hidden' }}
                                >
                                    {categories.map((cat) => (
                                        <div key={cat.id} className={styles.listItem}>
                                            <button
                                                className={`${styles.catBtn} ${filters.category === cat.id ? styles.active : ''}`}
                                                onClick={() => setFilter('category', filters.category === cat.id ? '' : cat.id)}
                                            >
                                                <span className={styles.dot} style={{ background: cat.color }} />
                                                <span className={styles.catName}>{cat.name}</span>
                                            </button>
                                            <button className="btn-icon" onClick={() => deleteCategory(cat.id)}
                                                title="Delete category">
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    ))}

                                    {showCatForm ? (
                                        <form onSubmit={handleAddCategory} className={styles.inlineForm}>
                                            <input
                                                autoFocus
                                                value={newCatName}
                                                onChange={(e) => setNewCatName(e.target.value)}
                                                placeholder="Category name"
                                            />
                                            <div className={styles.colorRow}>
                                                {CATEGORY_COLORS.map((c) => (
                                                    <button
                                                        key={c}
                                                        type="button"
                                                        className={`${styles.colorSwatch} ${newCatColor === c ? styles.selectedSwatch : ''}`}
                                                        style={{ background: c }}
                                                        onClick={() => setNewCatColor(c)}
                                                    />
                                                ))}
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem', padding: '0.4rem' }}>Add</button>
                                                <button type="button" className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem', padding: '0.4rem' }} onClick={() => setShowCatForm(false)}>Cancel</button>
                                            </div>
                                        </form>
                                    ) : (
                                        <button className={styles.addBtn} onClick={() => setShowCatForm(true)}>
                                            <Plus size={14} /> Add Category
                                        </button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </section>

                    <div className={styles.divider} />

                    {/* Tags */}
                    <section className={styles.section}>
                        <div className={styles.sectionHeader} onClick={() => setTagOpen((p) => !p)}>
                            <span className={styles.sectionTitle}><Tag size={14} /> Tags</span>
                            {tagOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </div>
                        <AnimatePresence>
                            {tagOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    style={{ overflow: 'hidden' }}
                                >
                                    <div className={styles.tagCloud}>
                                        {tags.map((tag) => (
                                            <div key={tag.id} className={styles.tagItem}>
                                                <button
                                                    className={`tag-chip ${filters.tag === tag.id ? styles.tagActive : ''}`}
                                                    onClick={() => setFilter('tag', filters.tag === tag.id ? '' : tag.id)}
                                                >
                                                    #{tag.name}
                                                </button>
                                                <button className="btn-icon" style={{ padding: '0.1rem' }} onClick={() => deleteTag(tag.id)}>
                                                    <Trash2 size={11} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {showTagForm ? (
                                        <form onSubmit={handleAddTag} className={styles.inlineForm}>
                                            <input
                                                autoFocus
                                                value={newTagName}
                                                onChange={(e) => setNewTagName(e.target.value)}
                                                placeholder="Tag name"
                                            />
                                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem', padding: '0.4rem' }}>Add</button>
                                                <button type="button" className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem', padding: '0.4rem' }} onClick={() => setShowTagForm(false)}>Cancel</button>
                                            </div>
                                        </form>
                                    ) : (
                                        <button className={styles.addBtn} onClick={() => setShowTagForm(true)}>
                                            <Plus size={14} /> Add Tag
                                        </button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </section>

                    {/* User footer */}
                    <div className={styles.footer}>
                        <div className={styles.userInfo}>
                            <div className={styles.avatar}><User size={14} /></div>
                            <div>
                                <p className={styles.userName}>{user?.name}</p>
                                <p className={styles.userEmail}>{user?.email}</p>
                            </div>
                        </div>
                        <button className="btn-icon" onClick={handleLogout} title="Log out">
                            <LogOut size={16} />
                        </button>
                    </div>
                </motion.aside>
            )}
        </AnimatePresence>
    );
}
