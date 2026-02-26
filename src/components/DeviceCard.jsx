import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { startTest, getTestStatus, getErrorMessage } from '../api/testApi';
import PassFailBadge from './PassFailBadge';

const POLL_INTERVAL_MS = 3000;

// ── Serial number helpers ─────────────────────────────────────────────────────
// Stored per-device in localStorage so it survives page refresh.
// Key format: "serialNo_ESP32-001"

const getStoredSerial = (deviceId) => {
    try {
        const val = localStorage.getItem(`serialNo_${deviceId}`);
        return val !== null ? parseInt(val, 10) : '';
    } catch {
        return '';
    }
};

const saveSerial = (deviceId, value) => {
    try {
        localStorage.setItem(`serialNo_${deviceId}`, String(value));
    } catch { /* silently ignore */ }
};

// serialNo is a pure number: 124 → 125
const incrementSerial = (val) => {
    const n = parseInt(val, 10);
    return isNaN(n) ? val : n + 1;
};

// ── Status config — aligned to Spring Boot TestStatus enum ───────────────────
const statusConfig = {
    idle: {
        label: 'Ready',
        dot: 'bg-gray-500',
        border: 'border-surface-600',
        glow: '',
    },
    IN_PROGRESS: {
        label: 'Running...',
        dot: 'bg-brand-400 pulse-running',
        border: 'border-brand-500/40',
        glow: 'shadow-glow-green',
    },
    PASS: {
        label: 'Completed',
        dot: 'bg-brand-400',
        border: 'border-brand-500/30',
        glow: '',
    },
    FAIL: {
        label: 'Failed',
        dot: 'bg-red-400',
        border: 'border-red-500/30',
        glow: 'shadow-glow-red',
    },
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function DeviceCard({ device }) {
    const navigate = useNavigate();
    const intervalRef = useRef(null);
    const elapsedRef = useRef(null);

    // status mirrors TestStatus enum: 'idle' | 'IN_PROGRESS' | 'PASS' | 'FAIL'
    const [status, setStatus] = useState('idle');
    const [testId, setTestId] = useState(null);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [elapsed, setElapsed] = useState(0); // seconds since test started

    // serialNo is a number (Long in Spring Boot). '' means not yet entered.
    const [serialNo, setSerialNo] = useState(() => getStoredSerial(device.id));
    const [serialError, setSerialError] = useState('');
    const [testedSerial, setTestedSerial] = useState(''); // snapshot of serial used for active test

    // Persist serialNo to localStorage on every change
    useEffect(() => {
        if (serialNo !== '') saveSerial(device.id, serialNo);
    }, [serialNo, device.id]);

    // ── Elapsed timer ─────────────────────────────────────────────────────────
    const startElapsed = () => {
        setElapsed(0);
        elapsedRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    };

    const stopElapsed = () => {
        if (elapsedRef.current) { clearInterval(elapsedRef.current); elapsedRef.current = null; }
    };

    const formatElapsed = (s) =>
        s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;

    // ── Polling ───────────────────────────────────────────────────────────────
    const stopPolling = () => {
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    };

    const autoIncrement = () => {
        setSerialNo(prev => {
            const next = incrementSerial(prev);
            saveSerial(device.id, next);
            return next;
        });
    };

    useEffect(() => {
        if (!testId || status !== 'IN_PROGRESS') return;

        intervalRef.current = setInterval(async () => {
            try {
                const res = await getTestStatus(testId);
                const data = res.data;

                if (data.status === 'PASS' || data.status === 'FAIL') {
                    setResult(data.result);
                    setStatus(data.status);
                    stopPolling();
                    stopElapsed();
                    autoIncrement(); // increment on both PASS and FAIL — board was tested
                }
                // data.status === 'IN_PROGRESS' → keep polling, do nothing
            } catch (err) {
                setError(getErrorMessage(err));
                setStatus('idle');
                stopPolling();
                stopElapsed();
            }
        }, POLL_INTERVAL_MS);

        return () => { stopPolling(); stopElapsed(); };
    }, [testId, status]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleSerialChange = (e) => {
        const val = e.target.value;
        // Only allow digits
        if (val === '' || /^\d+$/.test(val)) {
            setSerialNo(val === '' ? '' : parseInt(val, 10));
            if (val.trim()) setSerialError('');
        }
    };

    const handleStart = async () => {
        if (serialNo === '' || serialNo === null) {
            setSerialError('Enter PCB serial number before starting.');
            return;
        }
        setError(null);
        setResult(null);
        setTestedSerial(serialNo);
        setStatus('IN_PROGRESS');
        startElapsed();

        try {
            const res = await startTest(device.deviceId, serialNo);
            setTestId(res.data.testId);
        } catch (err) {
            setError(getErrorMessage(err));
            setStatus('idle');
            stopElapsed();
        }
    };

    const handleReset = () => {
        stopPolling();
        stopElapsed();
        setStatus('idle');
        setTestId(null);
        setResult(null);
        setError(null);
        setElapsed(0);
        setTestedSerial('');
    };

    const cfg = statusConfig[status] || statusConfig.idle;

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className={`card border ${cfg.border} ${cfg.glow} transition-all duration-300 fade-in flex flex-col gap-4`}>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                    <div>
                        <p className="text-sm font-semibold text-white">
                            {device.name || `Device ${device.deviceId}`}
                        </p>
                        <p className="text-xs text-muted font-mono">{device.deviceId}</p>
                    </div>
                </div>
                <span className="text-xs text-muted bg-surface-700 px-2 py-1 rounded font-mono">
                    {cfg.label}
                </span>
            </div>

            {/* IDLE — serial number input */}
            {status === 'idle' && (
                <div className="space-y-1">
                    <label className="text-xs text-muted font-medium block">PCB Serial Number</label>
                    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 border transition-colors ${serialError
                        ? 'border-red-500/60 bg-red-500/5'
                        : serialNo !== ''
                            ? 'border-brand-500/40 bg-surface-700'
                            : 'border-surface-500 bg-surface-700'
                        }`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-muted flex-shrink-0"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round"
                                d="M5 9h14M5 15h14M11 4l-2 16M15 4l-2 16" />
                        </svg>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={serialNo === '' ? '' : String(serialNo)}
                            onChange={handleSerialChange}
                            placeholder="e.g. 124"
                            className="flex-1 bg-transparent text-sm font-mono text-white placeholder-surface-500 outline-none"
                        />
                        {serialNo !== '' && (
                            <button
                                onClick={() => { setSerialNo(''); setSerialError(''); }}
                                className="text-muted hover:text-gray-300 transition-colors text-xs"
                                title="Clear"
                            >✕</button>
                        )}
                    </div>
                    {serialError && <p className="text-xs text-red-400">{serialError}</p>}
                    {serialNo === '' && !serialError && (
                        <p className="text-xs text-muted">Auto-increments after each test. Digits only.</p>
                    )}
                </div>
            )}

            {/* IN_PROGRESS — waiting state with elapsed timer */}
            {status === 'IN_PROGRESS' && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted">Testing S/N</span>
                        <span className="font-mono text-brand-400">{testedSerial}</span>
                    </div>

                    {/* Indeterminate animated bar — we don't know cycle progress */}
                    <div className="w-full bg-surface-700 rounded-full h-1.5 overflow-hidden">
                        <div className="h-1.5 rounded-full bg-brand-500 indeterminate-bar" />
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted">
                        <span className="animate-pulse">Waiting for ESP32 data...</span>
                        <span className="font-mono">{formatElapsed(elapsed)}</span>
                    </div>
                </div>
            )}

            {/* PASS / FAIL — result summary */}
            {(status === 'PASS' || status === 'FAIL') && result && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <PassFailBadge result={status === 'PASS' ? 'pass' : 'fail'} size="md" />
                        <span className="text-xs text-muted font-mono">S/N: {testedSerial}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { label: 'Avg Voltage', value: result.avgVoltage, unit: 'V' },
                            { label: 'Avg Current', value: result.avgCurrent, unit: 'A' },
                            { label: 'Avg Time', value: result.avgChargeTime, unit: 'ms' },
                        ].map((m) => (
                            <div key={m.label} className="bg-surface-700 rounded-lg p-2 text-center">
                                <p className="data-value text-sm">{m.value?.toFixed(2) ?? '—'}</p>
                                <p className="text-xs text-muted mt-0.5">{m.unit}</p>
                                <p className="text-xs text-muted">{m.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Next serial preview */}
                    <div className="flex items-center gap-1.5 text-xs text-muted bg-surface-700 rounded-lg px-3 py-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none"
                            viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        <span>Next serial ready:</span>
                        <span className="font-mono text-brand-400">{serialNo}</span>
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    {error}
                </p>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 pt-1">
                {status === 'idle' && (
                    <button
                        onClick={handleStart}
                        disabled={serialNo === ''}
                        className="btn-primary flex-1"
                        title={serialNo === '' ? 'Enter serial number first' : ''}
                    >
                        Start Test
                    </button>
                )}
                {status === 'IN_PROGRESS' && (
                    <button disabled className="btn-primary flex-1 opacity-50 cursor-not-allowed">
                        Running...
                    </button>
                )}
                {(status === 'PASS' || status === 'FAIL') && (
                    <>
                        <button onClick={handleReset} className="btn-ghost flex-1">New Test</button>
                        {testId && (
                            <button onClick={() => navigate(`/test/${testId}`)} className="btn-primary flex-1">
                                View Detail
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}