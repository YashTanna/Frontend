import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { startTest, getTestStatus, getRecentTests, getDevices, getErrorMessage } from '../api/testApi';
import PassFailBadge from '../components/PassFailBadge';

const POLL_MS = 3000;

// ── Serial helpers ────────────────────────────────────────────────────────────
const getStoredSerial = (deviceId) => {
    try {
        const v = localStorage.getItem(`sn_${deviceId}`);
        return v !== null ? parseInt(v, 10) : '';
    } catch { return ''; }
};
const saveSerial = (deviceId, val) => {
    try { localStorage.setItem(`sn_${deviceId}`, String(val)); } catch { }
};
const incrementSerial = (val) => {
    const n = parseInt(val, 10);
    return isNaN(n) ? val : n + 1;
};

// ── Recent test row ───────────────────────────────────────────────────────────
const RecentRow = ({ test, onClick }) => (
    <div
        onClick={onClick}
        style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.7rem 0.875rem', cursor: 'pointer', transition: 'background 0.15s',
            borderBottom: '1px solid var(--color-neutral-100)',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-neutral-50)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-neutral-700)' }}>
                #{test.serialNo}
            </span>
            <PassFailBadge result={test.status} size="sm" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-400)' }}>
                {test.createdAt ? new Date(test.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" style={{ width: 14, height: 14, color: 'var(--color-neutral-300)' }}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
        </div>
    </div>
);

// ══════════════════════════════════════════════════════════════════════════════
export default function TestStation() {
    const { deviceId } = useParams();
    const navigate = useNavigate();

    // Use a ref to track if polling should keep going.
    // When set to false the recursive loop stops immediately.
    const pollingActive = useRef(false);
    const elapsedRef = useRef(null);

    const [device, setDevice] = useState(null);
    const [status, setStatus] = useState('idle');
    const [testId, setTestId] = useState(null);
    const [result, setResult] = useState(null);
    const [apiError, setApiError] = useState(null);
    const [starting, setStarting] = useState(false);
    const [elapsed, setElapsed] = useState(0);

    const [serialNo, setSerialNo] = useState(() => getStoredSerial(deviceId));
    const [serialError, setSerialError] = useState('');
    const [testedSN, setTestedSN] = useState('');

    const [recent, setRecent] = useState([]);
    const [recentLoad, setRecentLoad] = useState(true);

    // ── On mount: load device info + recent tests ─────────────────────────────
    useEffect(() => {
        getDevices()
            .then(res => {
                const found = (res.data || []).find(d => d.deviceId === deviceId);
                setDevice(found || { deviceId, name: deviceId, status: 'IDLE' });
            })
            .catch(() => setDevice({ deviceId, name: deviceId, status: 'IDLE' }));

        fetchRecent();

        // Stop any lingering polling if the user navigates away
        return () => { pollingActive.current = false; };
    }, [deviceId]);

    // ── Persist serial ────────────────────────────────────────────────────────
    useEffect(() => {
        if (serialNo !== '') saveSerial(deviceId, serialNo);
    }, [serialNo, deviceId]);

    // ── Recent tests ──────────────────────────────────────────────────────────
    const fetchRecent = () => {
        setRecentLoad(true);
        getRecentTests(deviceId)
            .then(res => setRecent(res.data || []))
            .catch(() => setRecent([]))
            .finally(() => setRecentLoad(false));
    };

    // ── Elapsed timer ─────────────────────────────────────────────────────────
    const startElapsed = () => {
        setElapsed(0);
        elapsedRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    };
    const stopElapsed = () => {
        if (elapsedRef.current) { clearInterval(elapsedRef.current); elapsedRef.current = null; }
    };
    const fmtElapsed = s => s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;

    // ── Polling — plain recursive setTimeout, no useEffect, no stale closures ─
    // This is the simplest and most reliable approach:
    // after each POLL_MS delay, call /status. If still running, schedule next call.
    // If done or unmounted (pollingActive=false), stop.
    const poll = (id) => {
        if (!pollingActive.current) return; // unmounted or stopped

        setTimeout(async () => {
            if (!pollingActive.current) return; // check again after delay

            console.log('[Poll] calling /status/', id);
            try {
                const res = await getTestStatus(id);
                const data = res.data;
                console.log('[Poll] response status:', data.status);

                if (!pollingActive.current) return; // component may have unmounted during await

                if (data.status === 'PASS' || data.status === 'FAIL') {
                    pollingActive.current = false;
                    stopElapsed();
                    setResult(data.result);
                    setStatus(data.status);
                    setSerialNo(prev => {
                        const next = incrementSerial(prev);
                        saveSerial(deviceId, next);
                        return next;
                    });
                    fetchRecent();
                } else {
                    // Still IN_PROGRESS — schedule next poll
                    poll(id);
                }
            } catch (err) {
                console.error('[Poll] error:', err);
                if (!pollingActive.current) return;
                pollingActive.current = false;
                stopElapsed();
                setApiError(getErrorMessage(err));
                setStatus('idle');
            }
        }, POLL_MS);
    };

    // ── Start test ────────────────────────────────────────────────────────────
    const handleStart = async () => {
        if (serialNo === '' || serialNo === null) {
            setSerialError('Serial number is required.');
            return;
        }

        setSerialError('');
        setApiError(null);
        setResult(null);
        setTestedSN(serialNo);
        setStarting(true);

        try {
            const res = await startTest(deviceId, serialNo);
            const id = res.data.testId;
            console.log('[Start] testId received:', id);

            setTestId(id);
            setStatus('IN_PROGRESS');
            startElapsed();

            // Start polling immediately
            pollingActive.current = true;
            poll(id);
        } catch (err) {
            console.error('[Start] error:', err);
            setApiError(getErrorMessage(err));
        } finally {
            setStarting(false);
        }
    };

    // ── Reset ─────────────────────────────────────────────────────────────────
    const handleNewTest = () => {
        pollingActive.current = false;
        stopElapsed();
        setStatus('idle');
        setTestId(null);
        setResult(null);
        setApiError(null);
        setElapsed(0);
        setTestedSN('');
    };

    const isRunning = status === 'IN_PROGRESS';
    const isDone = status === 'PASS' || status === 'FAIL';

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div style={{ padding: '2rem', maxWidth: '960px', margin: '0 auto' }} className="fade-in">

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="btn-secondary"
                    style={{ padding: '0.4rem 0.875rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    Back
                </button>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <h1 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 700, color: 'var(--color-neutral-900)' }}>
                            {device?.name || deviceId}
                        </h1>
                        {device && (
                            <span className={`badge ${device.status === 'RUNNING' ? 'badge-running' : device.status === 'OFFLINE' ? 'badge-offline' : 'badge-idle'}`}>
                                {device.status}
                            </span>
                        )}
                    </div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-neutral-400)', fontFamily: 'var(--font-mono)' }}>
                        {deviceId}
                    </p>
                </div>
            </div>

            {/* Two column layout */}
            <div className="station-grid">

                {/* ── LEFT: Test Control ── */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <p style={{ margin: '0 0 0.125rem', fontSize: '1rem', fontWeight: 700, color: 'var(--color-neutral-800)' }}>Test Station</p>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-neutral-400)' }}>Enter serial number and start the test cycle.</p>
                    </div>

                    <div className="divider" style={{ margin: 0 }} />

                    {/* Serial input */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-neutral-600)', marginBottom: '0.4rem' }}>
                            PCB Serial Number
                        </label>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={serialNo === '' ? '' : String(serialNo)}
                            onChange={e => {
                                const v = e.target.value;
                                if (v === '' || /^\d+$/.test(v)) {
                                    setSerialNo(v === '' ? '' : parseInt(v, 10));
                                    if (v) setSerialError('');
                                }
                            }}
                            disabled={isRunning || starting}
                            placeholder="e.g. 124"
                            className={`input-field${serialError ? ' error' : ''}`}
                            style={{ opacity: (isRunning || starting) ? 0.6 : 1 }}
                        />
                        {serialError && (
                            <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: 'var(--color-fail-text)' }}>{serialError}</p>
                        )}
                        {!serialError && serialNo === '' && !isRunning && (
                            <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: 'var(--color-neutral-400)' }}>
                                Auto-increments after each test.
                            </p>
                        )}
                    </div>

                    {/* Running state */}
                    {isRunning && (
                        <div style={{
                            background: 'var(--color-running-bg)', border: '1px solid var(--color-running-border)',
                            borderRadius: '0.625rem', padding: '1rem',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
                                <span className="spinner" />
                                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-running-text)' }}>
                                    Testing S/N {testedSN}
                                </span>
                            </div>
                            <div style={{ background: 'var(--color-accent-100)', borderRadius: '999px', height: '4px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                                <div className="indeterminate-bar" />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-running-text)' }}>
                                <span>Waiting for ESP32 data...</span>
                                <span style={{ fontFamily: 'var(--font-mono)' }}>{fmtElapsed(elapsed)}</span>
                            </div>
                        </div>
                    )}

                    {/* Result */}
                    {isDone && result && (
                        <div style={{
                            background: status === 'PASS' ? 'var(--color-pass-bg)' : 'var(--color-fail-bg)',
                            border: `1px solid ${status === 'PASS' ? 'var(--color-pass-border)' : 'var(--color-fail-border)'}`,
                            borderRadius: '0.625rem', padding: '1rem',
                            display: 'flex', flexDirection: 'column', gap: '0.625rem',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <PassFailBadge result={status} size="md" />
                                <span style={{ fontSize: '0.78rem', color: 'var(--color-neutral-500)', fontFamily: 'var(--font-mono)' }}>
                                    S/N {testedSN}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--color-neutral-600)' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" style={{ width: 14, height: 14, flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                </svg>
                                <span><strong>{result.totalCycles}</strong> cycles completed</span>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {apiError && (
                        <div style={{
                            background: 'var(--color-fail-bg)', border: '1px solid var(--color-fail-border)',
                            borderRadius: '0.5rem', padding: '0.75rem', fontSize: '0.8rem', color: 'var(--color-fail-text)',
                        }}>
                            {apiError}
                        </div>
                    )}

                    {/* Next serial preview */}
                    {isDone && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.625rem 0.875rem', background: 'var(--color-neutral-50)',
                            borderRadius: '0.5rem', border: '1px solid var(--color-neutral-200)',
                            fontSize: '0.78rem', color: 'var(--color-neutral-500)',
                        }}>
                            <svg xmlns="http://www.w3.org/2000/svg" style={{ width: 14, height: 14, color: 'var(--color-accent-500)', flexShrink: 0 }}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            <span>Next serial ready:</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-accent-600)' }}>{serialNo}</span>
                        </div>
                    )}

                    {/* Buttons */}
                    <div style={{ display: 'flex', gap: '0.625rem' }}>
                        {!isRunning && !isDone && (
                            <button
                                onClick={handleStart}
                                disabled={serialNo === '' || starting}
                                className="btn-primary"
                                style={{ flex: 1 }}
                            >
                                {starting ? (
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                        <span className="spinner" style={{ width: 14, height: 14, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                                        Starting...
                                    </span>
                                ) : 'Start Test'}
                            </button>
                        )}
                        {isRunning && (
                            <button disabled className="btn-primary" style={{ flex: 1 }}>
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    <span className="spinner" style={{ width: 14, height: 14, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                                    Running...
                                </span>
                            </button>
                        )}
                        {isDone && (
                            <>
                                <button onClick={handleNewTest} className="btn-secondary" style={{ flex: 1 }}>New Test</button>
                                {testId && (
                                    <button onClick={() => navigate(`/test/${testId}`)} className="btn-primary" style={{ flex: 1 }}>
                                        View Detail
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* ── RIGHT: Recent Tests ── */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-neutral-800)' }}>Recent Tests</p>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-400)' }}>Last 5 results</span>
                    </div>

                    {recentLoad ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {[1, 2, 3].map(i => (
                                <div key={i} style={{ height: '44px', background: 'var(--color-neutral-100)', borderRadius: '0.5rem', animation: 'pulse 1.5s infinite' }} />
                            ))}
                        </div>
                    ) : recent.length === 0 ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1rem', gap: '0.5rem' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" style={{ width: 32, height: 32, color: 'var(--color-neutral-300)' }}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.25}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                            </svg>
                            <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--color-neutral-400)', textAlign: 'center' }}>
                                No tests yet for this device.
                            </p>
                        </div>
                    ) : (
                        <div style={{ flex: 1 }}>
                            {recent.map(test => (
                                <RecentRow key={test.id} test={test} onClick={() => navigate(`/test/${test.id}`)} />
                            ))}
                        </div>
                    )}

                    <div style={{ paddingTop: '0.875rem', borderTop: '1px solid var(--color-neutral-100)', marginTop: '0.5rem' }}>
                        <button
                            onClick={() => navigate(`/history?deviceId=${deviceId}`)}
                            className="btn-ghost"
                            style={{ width: '100%', textAlign: 'center', fontSize: '0.8rem' }}
                        >
                            View all tests for this device →
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}