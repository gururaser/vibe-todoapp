import { create } from 'zustand';
import api from '../api/axios';

const useAuthStore = create((set) => ({
    user: null,
    initialized: false,

    fetchMe: async () => {
        try {
            const { data } = await api.get('/auth/me');
            set({ user: data.user, initialized: true });
        } catch {
            set({ user: null, initialized: true });
        }
    },

    login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        set({ user: data.user });
        return data.user;
    },

    register: async (name, email, password) => {
        const { data } = await api.post('/auth/register', { name, email, password });
        set({ user: data.user });
        return data.user;
    },

    logout: async () => {
        await api.post('/auth/logout');
        set({ user: null });
    },
}));

export default useAuthStore;
