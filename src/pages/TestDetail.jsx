import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTestById, getErrorMessage } from '../api/testApi';
import CycleChart from '../components/CycleChart';
import PassFailBadge from '../components/PassFailBadge';

export default function TestDetail() {
    const { testId } = useParams();
    const navigate = useNavigate();
    const [test, setTest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        getTestById(testId)
            .then(res => setTest(res.data))
            .catch(err => setError(getErrorMessage(err)))
            .finally(() => setLoading(false));
    }, [testId]);

    const s = {
        page: { padding: '2rem', maxWidth: '960px', margin: '0 auto' },
        label: { margin: 0, fontSize: '0.72rem', color: 'var(--color-neutral-400)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 },
        value: { margin: 0, fontSize: '0.875rem', color: 'var(--color-neutral-700)', fontFamily: 'var(--font-mono)' },
        th: { textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-neutral-400)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 0.75rem 0.75rem 0', borderBottom: '1px solid var(--color-neutral-200)' },
        td: { padding: '0.75rem 0.75rem 0.75rem 0', borderBottom: '1px solid var(--color-neutral-100)', fontSize: '0.875rem', color: 'var(--color-neutral-700)' },
        tdMono: { padding: '0.75rem 0.75rem 0.75rem 0', borderBottom: '1px solid var(--color-neutral-100)', fontSize: '0.875rem', color: 'var(--color-accent-600)', fontFamily: 'var(--font-mono)', fontWeight: 500 },
        tdMuted: { padding: '0.75rem 0.75rem 0.75rem 0', borderBottom: '1px solid var(--color-neutral-100)', fontSize: '0.78rem', color: 'var(--color-neutral-400)', fontFamily: 'var(--font-mono)' },
    };

    if (loading) return (
        <div style={s.page}>
            {[1, 2, 3].map(i => (
                <div key={i} className="card" style={{ height: '6rem', background: 'var(--color-neutral-100)', animation: 'pulse 1.5s infinite', marginBottom: '1rem' }} />
            ))}
        </div>
    );

    if (error) return (
        <div style={s.page}>
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ color: 'var(--color-fail-text)', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>
                <button onClick={() => navigate(-1)} className="btn-secondary">Go Back</button>
            </div>
        </div>
    );

    if (!test) return null;

    const measurements = [...(test.measurements || [])].sort((a, b) => a.cycleNo - b.cycleNo);

    return (
        <div style={s.page} className="fade-in">

            {/* Header */}
            <div className="detail-header">
                <button onClick={() => navigate(-1)} className="btn-secondary" style={{ padding: '0.4rem 0.875rem', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    Back
                </button>
                <div className="detail-header-meta">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <h1 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 700, color: 'var(--color-neutral-900)' }}>Test Detail</h1>
                        <PassFailBadge result={test.status === 'PASS' ? 'pass' : 'fail'} size="sm" />
                    </div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-neutral-400)', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                        Test #{test.id} &nbsp;·&nbsp; S/N {test.serialNo}
                        {test.deviceId && ` · ${test.deviceId}`}
                        {test.deviceName && ` — ${test.deviceName}`}
                    </p>
                </div>
                {test.createdAt && (
                    <span className="detail-header-date">
                        {new Date(test.createdAt).toLocaleString()}
                    </span>
                )}
            </div>

            {/* Summary bar */}
            <div className="card detail-summary-bar">
                <div>
                    <p style={s.label}>Result</p>
                    <div style={{ marginTop: '0.25rem' }}><PassFailBadge result={test.status === 'PASS' ? 'pass' : 'fail'} size="md" /></div>
                </div>
                <div>
                    <p style={s.label}>Serial No.</p>
                    <p style={{ ...s.value, fontSize: '1rem', fontWeight: 700, color: 'var(--color-neutral-800)' }}>{test.serialNo}</p>
                </div>
                {test.totalCycles && (
                    <div>
                        <p style={s.label}>Total Cycles</p>
                        <p style={{ ...s.value, fontSize: '1rem', fontWeight: 700, color: 'var(--color-neutral-800)' }}>{test.totalCycles}</p>
                    </div>
                )}
                {test.createdAt && (
                    <div style={{ marginLeft: 'auto', minWidth: 0 }}>
                        <p style={s.label}>Date</p>
                        <p style={{ ...s.value, fontFamily: 'var(--font-sans)', color: 'var(--color-neutral-600)' }}>{new Date(test.createdAt).toLocaleString()}</p>
                    </div>
                )}
            </div>

            {/* PASS — show charts and measurement table */}
            {test.status === 'PASS' && measurements.length > 0 && (
                <>
                    <div className="card" style={{ marginBottom: '1.25rem' }}>
                        <p style={{ margin: '0 0 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-neutral-400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Cycle Charts
                        </p>
                        <CycleChart measurements={measurements} />
                    </div>

                    <div className="card" style={{ overflowX: 'auto' }}>
                        <p style={{ margin: '0 0 1rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-neutral-400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Per-Cycle Breakdown ({measurements.length} cycles)
                        </p>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    {['Cycle', 'Voltage (V)', 'Current (A)', 'Charge Time (ms)', 'Peak Voltage (V)'].map(h => (
                                        <th key={h} style={s.th}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {measurements.map(row => (
                                    <tr key={row.cycleNo}>
                                        <td style={s.tdMuted}>{row.cycleNo}</td>
                                        <td style={s.tdMono}>{row.voltage?.toFixed(3)}</td>
                                        <td style={s.tdMono}>{row.current?.toFixed(3)}</td>
                                        <td style={s.tdMono}>{row.chargeTime}</td>
                                        <td style={s.tdMono}>{row.peakVoltage?.toFixed(3) ?? '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* FAIL — show simple message instead of charts */}
            {test.status === 'FAIL' && (
                <div className="card" style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '1.25rem', border: '1px solid var(--color-fail-border)',
                    background: 'var(--color-fail-bg)',
                }}>
                    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: 24, height: 24, color: 'var(--color-fail-text)', flexShrink: 0 }}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <div>
                        <p style={{ margin: '0 0 0.25rem', fontWeight: 600, color: 'var(--color-fail-text)', fontSize: '0.9rem' }}>
                            Test Failed
                        </p>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-fail-text)', opacity: 0.8 }}>
                            Measurement data is not available for failed tests.
                        </p>
                    </div>
                </div>
            )}

        </div>
    );
}