import axios from 'axios';

// ✅ Replace with your actual Spring Boot backend URL
const BASE_URL = 'http://your-backend-url.com/api';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

// ─── Devices ──────────────────────────────────────────────────────────────────
export const getDevices = () => api.get('/devices');

// ─── Test Lifecycle ───────────────────────────────────────────────────────────
// POST /start  →  { deviceId, serialNo }  →  { testId, status: "IN_PROGRESS" }
export const startTest = (deviceId, serialNo) =>
    api.post('/start', { deviceId, serialNo });

// GET /status/:testId  →  { status: "IN_PROGRESS" | "PASS" | "FAIL", result?: {...} }
export const getTestStatus = (testId) => api.get(`/status/${testId}`);

// ─── History ──────────────────────────────────────────────────────────────────
// GET /tests?page=1&limit=20&status=PASS&deviceId=ESP32-001
export const getTestHistory = (params = {}) =>
    api.get('/tests', { params: { page: 1, limit: 20, ...params } });

// GET /tests/:testId
// Response shape matches TestResultDto:
// { serialNo, status, totalCycles, measurements: [{ cycleNo, voltage, current, chargeTime, peakVoltage }] }
export const getTestById = (testId) => api.get(`/tests/${testId}`);

// ─── Recent tests for a device ────────────────────────────────────────────────
// GET /tests/device/:deviceId?limit=5
// Returns last 5 tests for the given device — used on TestStation page.
// ⚠ You need to create this endpoint in Spring Boot.
export const getRecentTests = (deviceId, limit = 5) =>
    api.get(`/tests/device/${deviceId}`, { params: { limit } });

// ─── Reports ──────────────────────────────────────────────────────────────────
export const getReports = (range = '7d') =>
    api.get('/reports', { params: { range } });

// ─── Error helper ─────────────────────────────────────────────────────────────
export const getErrorMessage = (error) => {
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return 'An unexpected error occurred';
};