import { useState, useEffect } from 'react';
import { getReports, getErrorMessage } from '../api/testApi';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    PieChart, Pie, Cell, ResponsiveContainer, Legend
} from 'recharts';

const RANGES = ['7d', '30d', '90d'];

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px', fontSize: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            {label && <p style={{ color: '#94a3b8', marginBottom: 4, margin: '0 0 4px' }}>{label}</p>}
            {payload.map(e => (
                <p key={e.name} style={{ color: e.fill || e.color, margin: '2px 0', fontFamily: 'var(--font-mono)' }}>
                    {e.name}: <strong>{e.value}</strong>
                </p>
            ))}
        </div>
    );
};

export default function Reports() {
    const [range, setRange] = useState('7d');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        getReports(range)
            .then(res => { setData(res.data); setError(null); })
            .catch(err => setError(getErrorMessage(err)))
            .finally(() => setLoading(false));
    }, [range]);

    const axisTick = { fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono' };

    // Handle both totalTests and totalTest field names from backend
    const totalCount = data ? (data.totalTests ?? data.totalTest ?? 0) : 0;
    const passCount = data ? (data.totalPass ?? data.totalPassed ?? 0) : 0;
    const failCount = data ? (data.totalFail ?? data.totalFailed ?? 0) : 0;

    const pieData = data ? [
        { name: 'PASS', value: passCount, color: '#16a34a' },
        { name: 'FAIL', value: failCount, color: '#dc2626' },
    ] : [];

    const stats = data ? [
        { label: 'Total Tests', value: totalCount, color: 'var(--color-neutral-800)' },
        { label: 'Passed', value: passCount, color: 'var(--color-pass-text)' },
        { label: 'Failed', value: failCount, color: 'var(--color-fail-text)' },
        { label: 'Pass Rate', value: totalCount > 0 ? `${((passCount / totalCount) * 100).toFixed(1)}%` : '—', color: 'var(--color-accent-600)' },
    ] : [];

    return (
        <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-neutral-900)' }}>Reports</h1>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-neutral-500)' }}>Test analytics across all devices.</p>
                </div>
                {/* Range selector */}
                <div style={{ display: 'flex', background: 'var(--color-neutral-100)', borderRadius: '0.5rem', padding: '3px' }}>
                    {RANGES.map(r => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            style={{
                                padding: '0.375rem 0.875rem', borderRadius: '0.375rem', border: 'none',
                                fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                                background: range === r ? 'white' : 'transparent',
                                color: range === r ? 'var(--color-accent-600)' : 'var(--color-neutral-500)',
                                boxShadow: range === r ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            }}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: 'var(--color-fail-bg)', border: '1px solid var(--color-fail-border)', borderRadius: '0.5rem', fontSize: '0.85rem', color: 'var(--color-fail-text)' }}>
                    {error}
                </div>
            )}

            {/* Stat cards */}
            <div className="reports-stats-grid">
                {loading ? [1, 2, 3, 4].map(i => (
                    <div key={i} className="card" style={{ height: '80px', background: 'var(--color-neutral-100)', animation: 'pulse 1.5s infinite' }} />
                )) : stats.map(s => (
                    <div key={s.label} className="card" style={{ padding: '1rem' }}>
                        <p style={{ margin: '0 0 0.25rem', fontSize: '1.75rem', fontWeight: 700, color: s.color, fontFamily: 'var(--font-sans)' }}>
                            {s.value}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-neutral-400)' }}>{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Charts row */}
            <div className="reports-charts-grid">

                {/* Bar chart */}
                <div className="card">
                    <p style={{ margin: '0 0 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-neutral-400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Daily Test Results
                    </p>
                    {loading ? (
                        <div style={{ height: 260, background: 'var(--color-neutral-100)', borderRadius: '0.5rem', animation: 'pulse 1.5s infinite' }} />
                    ) : (
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={data?.dailyStats || []} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="date" tick={axisTick} />
                                <YAxis tick={axisTick} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)' }} />
                                <Bar dataKey="pass" name="PASS" fill="#16a34a" radius={[3, 3, 0, 0]} />
                                <Bar dataKey="fail" name="FAIL" fill="#dc2626" radius={[3, 3, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Pie chart */}
                <div className="card">
                    <p style={{ margin: '0 0 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-neutral-400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Pass / Fail Ratio
                    </p>
                    {loading ? (
                        <div style={{ height: 260, background: 'var(--color-neutral-100)', borderRadius: '0.5rem', animation: 'pulse 1.5s infinite' }} />
                    ) : (
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="45%" innerRadius={65} outerRadius={95} paddingAngle={3} dataKey="value">
                                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>

            </div>
        </div>
    );
}