/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';

const apiUrl = typeof window !== 'undefined' && (window as any)?.__ENV__
    ? (window as any)?.__ENV__?.NEXT_PUBLIC_API_URL
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8801';

const api = axios.create({
    baseURL: `${apiUrl}/api`,
});

// Request interceptor for API calls
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for API calls
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            // Avoid infinite loop if we're already on /login or /
            if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
