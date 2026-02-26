import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { getReports, getErrorMessage } from '../api/testApi';

const RANGES = [
    { label: 'Last 7 days', value: '7d' },
    { label: 'Last 30 days', value: '30d' },
    { label: 'Last 90 days', value: '90d' },
];

const PIE_COLORS = ['#22c55e', '#ef4444'];

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-surface-700 border border-surface-500 rounded-lg px-3 py-2 text-xs shadow-lg">
            <p className="text-muted mb-1">{label}</p>
            {payload.map((e) => (
                <p key={e.name} style={{ color: e.fill || e.color }} className="font-mono">
                    {e.name}: <span className="font-semibold">{e.value}</span>
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
            .then((res) => setData(res.data))
            .catch((err) => setError(getErrorMessage(err)))
            .finally(() => setLoading(false));
    }, [range]);

    const passFailPie = data
        ? [
            { name: 'PASS', value: data.totalPass || 0 },
            { name: 'FAIL', value: data.totalFail || 0 },
        ]
        : [];

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-semibold text-white">Reports</h1>
                    <p className="text-sm text-muted mt-1">Production analytics and test trends.</p>
                </div>
                {/* Range selector */}
                <div className="flex gap-1 bg-surface-800 border border-surface-600 rounded-lg p-1">
                    {RANGES.map((r) => (
                        <button
                            key={r.value}
                            onClick={() => setRange(r.value)}
                            className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${range === r.value
                                ? 'bg-brand-500 text-white'
                                : 'text-muted hover:text-gray-300'
                                }`}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <p className="text-red-400 text-sm mb-6">{error}</p>
            )}

            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Total Tests', value: data?.totalTests, accent: false },
                    { label: 'Passed', value: data?.totalPass, accent: true },
                    { label: 'Failed', value: data?.totalFail, red: true },
                    {
                        label: 'Pass Rate', value: data?.totalTests
                            ? `${((data.totalPass / data.totalTests) * 100).toFixed(1)}%`
                            : '—',
                        accent: true
                    },
                ].map((s) => (
                    <div key={s.label} className="card">
                        {loading
                            ? <div className="h-7 w-16 bg-surface-600 rounded animate-pulse" />
                            : <p className={`text-2xl font-bold font-mono ${s.red ? 'text-red-400' : s.accent ? 'text-brand-400' : 'text-white'}`}>
                                {s.value ?? '—'}
                            </p>
                        }
                        <p className="text-xs text-muted mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Daily tests bar chart */}
                <div className="card lg:col-span-2">
                    <p className="section-title">Tests Per Day</p>
                    {loading
                        ? <div className="h-48 bg-surface-700 rounded animate-pulse" />
                        : (
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={data?.dailyStats || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2a1f" />
                                    <XAxis dataKey="date" tick={{ fill: '#6b7c6d', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                                    <YAxis tick={{ fill: '#6b7c6d', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="pass" name="PASS" fill="#22c55e" radius={[3, 3, 0, 0]} />
                                    <Bar dataKey="fail" name="FAIL" fill="#ef4444" radius={[3, 3, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )
                    }
                </div>

                {/* Pass/Fail pie */}
                <div className="card">
                    <p className="section-title">Pass / Fail Ratio</p>
                    {loading
                        ? <div className="h-48 bg-surface-700 rounded animate-pulse" />
                        : (
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={passFailPie}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={80}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {passFailPie.map((_, i) => (
                                            <Cell key={i} fill={PIE_COLORS[i]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend
                                        formatter={(value) => (
                                            <span style={{ color: '#6b7c6d', fontSize: 11 }}>{value}</span>
                                        )}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )
                    }
                </div>
            </div>
        </div>
    );
}