import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import styles from './LoginPage.module.css';

export default function LoginPage() {
    const [tab, setTab] = useState('login'); // 'login' | 'register'
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);

    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const [regForm, setRegForm] = useState({ name: '', email: '', password: '' });

    const login = useAuthStore((s) => s.login);
    const register = useAuthStore((s) => s.register);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(loginForm.email, loginForm.password);
            toast.success('Welcome back!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await register(regForm.name, regForm.email, regForm.password);
            toast.success('Account created!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            {/* Background blobs */}
            <div className={styles.blob1} />
            <div className={styles.blob2} />

            <motion.div
                className={styles.card}
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
            >
                {/* Logo */}
                <div className={styles.logo}>
                    <CheckSquare size={28} color="#6C63FF" />
                    <span>TodoApp</span>
                </div>

                {/* Tabs */}
                <div className={styles.tabs}>
                    {['login', 'register'].map((t) => (
                        <button
                            key={t}
                            className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
                            onClick={() => setTab(t)}
                        >
                            {t === 'login' ? 'Sign In' : 'Create Account'}
                        </button>
                    ))}
                </div>

                {/* Forms */}
                <AnimatePresence mode="wait">
                    {tab === 'login' ? (
                        <motion.form
                            key="login"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.22 }}
                            onSubmit={handleLogin}
                            className={styles.form}
                        >
                            <div className={styles.field}>
                                <label>Email</label>
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={loginForm.email}
                                    onChange={(e) => setLoginForm((p) => ({ ...p, email: e.target.value }))}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className={styles.field}>
                                <label>Password</label>
                                <div className={styles.passWrap}>
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={loginForm.password}
                                        onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                                        required
                                    />
                                    <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(!showPass)}>
                                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                                {loading ? 'Signing in…' : 'Sign In'}
                            </button>
                        </motion.form>
                    ) : (
                        <motion.form
                            key="register"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.22 }}
                            onSubmit={handleRegister}
                            className={styles.form}
                        >
                            <div className={styles.field}>
                                <label>Name</label>
                                <input
                                    type="text"
                                    placeholder="Your name"
                                    value={regForm.name}
                                    onChange={(e) => setRegForm((p) => ({ ...p, name: e.target.value }))}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className={styles.field}>
                                <label>Email</label>
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={regForm.email}
                                    onChange={(e) => setRegForm((p) => ({ ...p, email: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className={styles.field}>
                                <label>Password</label>
                                <div className={styles.passWrap}>
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        placeholder="Min. 6 characters"
                                        value={regForm.password}
                                        onChange={(e) => setRegForm((p) => ({ ...p, password: e.target.value }))}
                                        required
                                        minLength={6}
                                    />
                                    <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(!showPass)}>
                                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                                {loading ? 'Creating account…' : 'Create Account'}
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
