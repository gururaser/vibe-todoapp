import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';
import useTodoStore from '../store/todoStore';

const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export function useSocket() {
    const user = useAuthStore((s) => s.user);
    const applySocketEvent = useTodoStore((s) => s.applySocketEvent);
    const socketRef = useRef(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!user) return;

        const socket = io(SERVER_URL, {
            withCredentials: true,   // send httpOnly cookie
            transports: ['websocket'],
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            setConnected(true);
            console.log('🔌 Socket connected');
        });

        socket.on('disconnect', () => {
            setConnected(false);
            console.log('🔌 Socket disconnected');
        });

        // Real-time todo + category + tag events (BUG FIX 3)
        const EVENTS = [
            'todo:created', 'todo:updated', 'todo:deleted', 'todo:reordered',
            'category:created', 'category:deleted',
            'tag:created', 'tag:deleted',
        ];
        EVENTS.forEach((event) => {
            socket.on(event, (payload) => applySocketEvent(event, payload));
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
            setConnected(false);
        };
    }, [user]);

    return { connected };
}
