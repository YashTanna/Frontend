import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getTestHistory, getErrorMessage } from '../api/testApi';
import PassFailBadge from '../components/PassFailBadge';

export default function TestHistory() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const deviceIdFromUrl = searchParams.get('deviceId') || '';

    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({ status: '', deviceId: deviceIdFromUrl });

    const fetchHistory = (pageNum, reset) => {
        setLoading(true);
        const params = { page: pageNum, limit: 20 };
        if (filters.status) params.status = filters.status;
        if (filters.deviceId) params.deviceId = filters.deviceId;

        getTestHistory(params)
            .then(res => {
                const incoming = res.data?.tests || res.data || [];
                setTests(prev => reset ? incoming : [...prev, ...incoming]);
                setHasMore(incoming.length === 20);
                setError(null);
            })
            .catch(err => setError(getErrorMessage(err)))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        setPage(1);
        fetchHistory(1, true);
    }, [filters]);

    const handleLoadMore = () => {
        const next = page + 1;
        setPage(next);
        fetchHistory(next, false);
    };

    // ── Styles ──────────────────────────────────────────────────────────────────
    const s = {
        page: { padding: '2rem', maxWidth: '1100px', margin: '0 auto' },
        heading: { margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-neutral-900)' },
        subheading: { margin: '0 0 1.5rem', fontSize: '0.875rem', color: 'var(--color-neutral-500)' },
        filterRow: { display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' },
        select: {
            background: 'var(--color-neutral-0)', border: '1px solid var(--color-neutral-300)',
            borderRadius: '0.5rem', padding: '0.5rem 0.875rem', fontSize: '0.875rem',
            color: 'var(--color-neutral-700)', outline: 'none', cursor: 'pointer',
        },
        input: {
            background: 'var(--color-neutral-0)', border: '1px solid var(--color-neutral-300)',
            borderRadius: '0.5rem', padding: '0.5rem 0.875rem', fontSize: '0.875rem',
            color: 'var(--color-neutral-700)', outline: 'none', width: '220px',
        },
        table: { width: '100%', borderCollapse: 'collapse' },
        th: {
            textAlign: 'left', fontSize: '0.72rem', fontWeight: 700,
            color: 'var(--color-neutral-400)', textTransform: 'uppercase',
            letterSpacing: '0.06em', paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--color-neutral-200)',
        },
        tr: { borderBottom: '1px solid var(--color-neutral-100)', cursor: 'pointer', transition: 'background 0.15s' },
        td: { padding: '0.875rem 1.5rem 0.875rem 0', verticalAlign: 'middle' },
    };

    return (
        <div style={s.page}>
            <h1 style={s.heading}>Test History</h1>
            <p style={s.subheading}>All completed PCB tests across all devices.</p>

            {/* Filters */}
            <div style={s.filterRow}>
                <select
                    value={filters.status}
                    onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                    style={s.select}
                >
                    <option value="">All Results</option>
                    <option value="PASS">PASS only</option>
                    <option value="FAIL">FAIL only</option>
                </select>

                <input
                    type="text"
                    placeholder="Filter by Device ID..."
                    value={filters.deviceId}
                    onChange={e => setFilters(f => ({ ...f, deviceId: e.target.value }))}
                    style={s.input}
                />

                {(filters.status || filters.deviceId) && (
                    <button
                        onClick={() => setFilters({ status: '', deviceId: '' })}
                        className="btn-secondary"
                        style={{ padding: '0.5rem 0.875rem', fontSize: '0.8rem' }}
                    >
                        Clear filters
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="card" style={{ padding: '0 1.25rem', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={s.table}>
                        <thead>
                            <tr>
                                {['S/N', 'Test ID', 'Device', 'Result', 'Date', ''].map((h, i) => (
                                    <th key={h} style={{ ...s.th, padding: `1rem ${i === 5 ? '0' : '1.5rem'} 0.75rem 0` }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {/* Loading skeletons */}
                            {loading && tests.length === 0 && [1, 2, 3, 4, 5].map(i => (
                                <tr key={i}>
                                    {[1, 2, 3, 4, 5, 6].map(j => (
                                        <td key={j} style={{ ...s.td }}>
                                            <div style={{ height: '14px', background: 'var(--color-neutral-100)', borderRadius: '4px', width: j === 6 ? '40px' : '80px', animation: 'pulse 1.5s infinite' }} />
                                        </td>
                                    ))}
                                </tr>
                            ))}

                            {/* Empty state */}
                            {!loading && tests.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-neutral-400)', fontSize: '0.875rem' }}>
                                        No test records found.
                                    </td>
                                </tr>
                            )}

                            {/* Data rows */}
                            {tests.map(t => (
                                <tr
                                    key={t.id}
                                    style={s.tr}
                                    onClick={() => navigate(`/test/${t.id}`)}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-neutral-50)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    {/* S/N */}
                                    <td style={s.td}>
                                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-accent-600)' }}>
                                            {t.serialNo}
                                        </span>
                                    </td>
                                    {/* Test ID */}
                                    <td style={s.td}>
                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--color-neutral-400)' }}>
                                            #{t.id}
                                        </span>
                                    </td>
                                    {/* Device */}
                                    <td style={s.td}>
                                        {t.deviceName && t.deviceName !== t.deviceId
                                            ? <>
                                                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-neutral-700)' }}>{t.deviceName}</p>
                                                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--color-neutral-400)', fontFamily: 'var(--font-mono)' }}>{t.deviceId}</p>
                                            </>
                                            : <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-neutral-700)', fontFamily: 'var(--font-mono)' }}>{t.deviceId}</p>
                                        }
                                    </td>
                                    {/* Result */}
                                    <td style={s.td}>
                                        <PassFailBadge result={t.status} size="sm" />
                                    </td>
                                    {/* Date */}
                                    <td style={s.td}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--color-neutral-500)', whiteSpace: 'nowrap' }}>
                                            {t.createdAt ? new Date(t.createdAt).toLocaleString() : '—'}
                                        </span>
                                    </td>
                                    {/* Arrow */}
                                    <td style={{ ...s.td, textAlign: 'right', paddingRight: '1rem' }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" style={{ width: 14, height: 14, color: 'var(--color-neutral-300)' }}
                                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                        </svg>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Error */}
            {error && (
                <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--color-fail-text)' }}>
                    {error}
                </p>
            )}

            {/* Load more */}
            {hasMore && !loading && (
                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <button onClick={handleLoadMore} className="btn-secondary">
                        Load more
                    </button>
                </div>
            )}

            {/* Loading more indicator */}
            {loading && tests.length > 0 && (
                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <span className="spinner" />
                </div>
            )}
        </div>
    );
}