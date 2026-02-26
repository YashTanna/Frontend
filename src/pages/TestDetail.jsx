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

    if (loading) {
        return (
            <div className="p-6 max-w-5xl mx-auto space-y-4">
                {[1, 2, 3].map(i => (
                    <div
                        key={i}
                        className="card"
                        style={{
                            height: "6rem",
                            background: "var(--color-neutral-100)",
                            animation: "pulse 1.5s infinite"
                        }}
                    />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 max-w-5xl mx-auto">
                <div className="card" style={{ textAlign: "center", padding: "4rem 2rem" }}>
                    <p style={{ color: "var(--color-fail-text)", fontSize: "0.875rem" }}>{error}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="btn-secondary"
                        style={{ marginTop: "1rem" }}
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (!test) return null;

    const measurements = [...(test.measurements || [])]
        .sort((a, b) => a.cycleNo - b.cycleNo);

    return (
        <>
            <div className="p-6 max-w-5xl mx-auto space-y-6 fade-in">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="btn-ghost text-xs px-3 py-1.5"
                    >
                        ← Back
                    </button>
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-semibold text-white">Test Detail</h1>
                            <PassFailBadge
                                result={test.status === 'PASS' ? 'pass' : 'fail'}
                                size="sm"
                            />
                        </div>
                        <p className="text-xs text-muted font-mono mt-0.5">
                            Test ID: {test.id}
                            &nbsp;·&nbsp;
                            S/N: {test.serialNo}
                            &nbsp;·&nbsp;
                            {test.deviceId}
                            {test.deviceName && ` — ${test.deviceName}`}
                        </p>
                    </div>
                    {test.createdAt && (
                        <p className="text-xs text-muted">
                            {new Date(test.createdAt).toLocaleString()}
                        </p>
                    )}
                </div>
            </div>

            <div
                className="card"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.5rem',
                    padding: '0.875rem 1.25rem',
                    flexWrap: 'wrap'
                }}
            >
                <PassFailBadge
                    result={test.status === 'PASS' ? 'pass' : 'fail'}
                    size="md"
                />
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.82rem',
                        color: 'var(--color-neutral-500)'
                    }}
                >
                    <span style={{ color: 'var(--color-neutral-400)' }}>S/N</span>
                    <span
                        style={{
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 600,
                            color: 'var(--color-neutral-800)'
                        }}
                    >
                        {test.serialNo}
                    </span>
                </div>
                {test.totalCycles && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--color-neutral-500)' }}>
                        <span style={{ color: 'var(--color-neutral-400)' }}>Cycles </span>
                        <span
                            style={{
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 600,
                                color: 'var(--color-neutral-800)'
                            }}
                        >
                            {test.totalCycles}
                        </span>
                    </div>
                )}
                {test.createdAt && (
                    <div
                        style={{
                            marginLeft: 'auto',
                            fontSize: '0.78rem',
                            color: 'var(--color-neutral-400)'
                        }}
                    >
                        {new Date(test.createdAt).toLocaleString()}
                    </div>
                )}
            </div>

            <div className="card">
                <p className="section-title">Cycle Charts</p>
                <CycleChart measurements={measurements} />
            </div>

            <div className="card" style={{ overflowX: "auto" }}>
                <p className="section-title">
                    Per-Cycle Breakdown ({measurements.length} cycles)
                </p>
                <table className="w-full text-sm">
                    <thead>
                        <tr style={{ borderBottom: "1px solid var(--color-neutral-200)" }}>
                            {['Cycle', 'Voltage (V)', 'Current (A)', 'Charge Time (ms)', 'Peak Voltage (V)']
                                .map(h => (
                                    <th
                                        key={h}
                                        style={{
                                            textAlign: "left",
                                            fontSize: "0.72rem",
                                            color: "var(--color-neutral-400)",
                                            fontWeight: 600,
                                            paddingBottom: "0.75rem",
                                            paddingRight: "1.5rem",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.06em"
                                        }}
                                    >
                                        {h}
                                    </th>
                                ))}
                        </tr>
                    </thead>
                    <tbody>
                        {measurements.map(row => (
                            <tr
                                key={row.cycleNo}
                                style={{ borderBottom: "1px solid var(--color-neutral-100)" }}
                            >
                                <td
                                    style={{
                                        padding: "0.625rem 1.5rem 0.625rem 0",
                                        fontFamily: "var(--font-mono)",
                                        color: "var(--color-neutral-400)",
                                        fontSize: "0.75rem"
                                    }}
                                >
                                    {row.cycleNo}
                                </td>
                                <td className="data-value" style={{ padding: "0.625rem 1.5rem 0.625rem 0" }}>
                                    {row.voltage?.toFixed(3)}
                                </td>
                                <td className="data-value" style={{ padding: "0.625rem 1.5rem 0.625rem 0" }}>
                                    {row.current?.toFixed(3)}
                                </td>
                                <td className="data-value" style={{ padding: "0.625rem 1.5rem 0.625rem 0" }}>
                                    {row.chargeTime}
                                </td>
                                <td className="data-value" style={{ padding: "0.625rem 1.5rem 0.625rem 0" }}>
                                    {row.peakVoltage?.toFixed(3) ?? '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}