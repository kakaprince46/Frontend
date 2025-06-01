import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000', // Ensure VITE_API_BASE_URL is http://127.0.0.1:5000
});

// Request interceptor for auth tokens
api.interceptors.request.use((config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
});

// Register a new user
export const registerUser = (data) => {
    console.log("api.js: registerUser called with data:", data);
    console.log("api.js: making POST request to /register with baseURL:", api.defaults.baseURL);
    return api.post('/register', data);
};

// Check-in a user
export const checkInUser = (data) => {
    console.log("api.js: checkInUser called with data:", data);
    console.log("api.js: making POST request to /checkin with baseURL:", api.defaults.baseURL);
    return api.post('/checkin', data);
};

// Sync data
export const syncData = (data) => {
    console.log("api.js: syncData called with data:", data);
    console.log("api.js: making POST request to /sync with baseURL:", api.defaults.baseURL);
    return api.post('/sync', data);
};

// Get dashboard data
export const getDashboardData = (params) => {
    console.log("api.js: getDashboardData called with params:", params);
    console.log("api.js: making GET request to /dashboard with baseURL:", api.defaults.baseURL);
    return api.get('/dashboard', { params });
};

// Get all users
export const getUsers = () => {
    console.log("api.js: getUsers called");
    console.log("api.js: making GET request to /users with baseURL:", api.defaults.baseURL);
    return api.get('/users');
};

// Create a new event
export const createEvent = (eventData) => {
    console.log("api.js: createEvent called with data:", eventData);
    console.log("api.js: making POST request to /events with baseURL:", api.defaults.baseURL);
    return api.post('/events', eventData);
};

// Get all events
export const getEvents = () => {
    console.log("api.js: getEvents called");
    console.log("api.js: making GET request to /events with baseURL:", api.defaults.baseURL);
    return api.get('/events');
};

// Create a new session for an event
export const createSessionForEvent = (eventId, sessionData) => {
    console.log(`api.js: createSessionForEvent called for eventId: ${eventId} with data:`, sessionData);
    console.log(`api.js: making POST request to /events/${eventId}/sessions with baseURL:`, api.defaults.baseURL);
    return api.post(`/events/${eventId}/sessions`, sessionData);
};

// Get all sessions for an event
export const getSessionsForEvent = (eventId) => {
    console.log(`api.js: getSessionsForEvent called for eventId: ${eventId}`);
    console.log(`api.js: making GET request to /events/${eventId}/sessions with baseURL:`, api.defaults.baseURL);
    return api.get(`/events/${eventId}/sessions`);
};

// Add other API functions as your project grows
// export const getRegistrationsForEvent = (eventId) => api.get(`/events/${eventId}/registrations`);