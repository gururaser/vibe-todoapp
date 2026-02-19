import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import useAuthStore from './store/authStore';

function ProtectedRoute({ children }) {
    const user = useAuthStore((s) => s.user);
    const initialized = useAuthStore((s) => s.initialized);
    if (!initialized) return null; // splash while checking auth
    return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
    const user = useAuthStore((s) => s.user);
    const initialized = useAuthStore((s) => s.initialized);
    if (!initialized) return null;
    return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
    const fetchMe = useAuthStore((s) => s.fetchMe);

    useEffect(() => {
        fetchMe();
    }, []);

    return (
        <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
