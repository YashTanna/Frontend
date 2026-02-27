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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
                <button onClick={() => navigate(-1)} className="btn-secondary" style={{ padding: '0.4rem 0.875rem', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    Back
                </button>
                <div style={{ flex: 1 }}>
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
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-neutral-400)' }}>
                        {new Date(test.createdAt).toLocaleString()}
                    </span>
                )}
            </div>

            {/* Summary bar */}
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '2rem', padding: '1rem 1.25rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
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
                    <div style={{ marginLeft: 'auto' }}>
                        <p style={s.label}>Date</p>
                        <p style={{ ...s.value, fontFamily: 'var(--font-sans)', color: 'var(--color-neutral-600)' }}>{new Date(test.createdAt).toLocaleString()}</p>
                    </div>
                )}
            </div>

            {/* Charts */}
            <div className="card" style={{ marginBottom: '1.25rem' }}>
                <p style={{ margin: '0 0 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-neutral-400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Cycle Charts
                </p>
                <CycleChart measurements={measurements} />
            </div>

            {/* Per-cycle table */}
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

        </div>
    );
}