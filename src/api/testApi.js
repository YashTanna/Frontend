import axios from 'axios';

const BASE_URL = 'https://honorifically-uncitied-aron.ngrok-free.dev/api';
// const BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
    },
});

// ─── Devices ──────────────────────────────────────────────────────────────────
export const getDevices = () => api.get('/devices');
export const reserveDevice = (deviceId) => api.put(`/devices/${deviceId}/reserve`);
export const releaseDevice = (deviceId) => api.put(`/devices/${deviceId}/release`);

// ─── Test Lifecycle ───────────────────────────────────────────────────────────
export const startTest = (deviceId, serialNo) => api.post('/start', { deviceId, serialNo });
export const getTestStatus = (testId) => api.get(`/status/${testId}`);

// ─── History ──────────────────────────────────────────────────────────────────
export const getTestHistory = (params = {}) => api.get('/tests', { params: { page: 1, limit: 20, ...params } });
export const getTestById = (testId) => api.get(`/tests/${testId}`);
export const getRecentTests = (deviceId, limit = 5) => api.get(`/tests/device/${deviceId}`, { params: { limit } });

// ─── Reports ──────────────────────────────────────────────────────────────────
export const getReports = (params = {}) => api.get('/reports', { params });
export const getTestsForExport = (fromDate, toDate, deviceId) =>
    api.get('/tests', { params: { fromDate, toDate, deviceId, limit: 1000, page: 1 } });

// ─── Error helper ─────────────────────────────────────────────────────────────
export const getErrorMessage = (error) => {
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return 'An unexpected error occurred';
};