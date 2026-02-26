import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTestHistory, getErrorMessage } from '../api/testApi';
import PassFailBadge from '../components/PassFailBadge';

export default function TestHistory() {
    const navigate = useNavigate();
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);

    // Filters — "status" matches Spring Boot TestStatus enum: PASS | FAIL
    const [filters, setFilters] = useState({ status: '', deviceId: '' });

    const fetchHistory = (pageNum = 1, reset = false) => {
        setLoading(true);
        const params = { page: pageNum, limit: 20 };
        if (filters.status) params.status = filters.status;
        if (filters.deviceId) params.deviceId = filters.deviceId;

        getTestHistory(params)
            .then(res => {
                const incoming = res.data.tests || res.data || [];
                setTests(reset ? incoming : prev => [...prev, ...incoming]);
                setHasMore(incoming.length === 20);
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

    return (
        <div className="p-6 max-w-6xl mx-auto">

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-white">Test History</h1>
                <p className="text-sm text-muted mt-1">All completed PCB tests across all devices.</p>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-6">
                <select
                    value={filters.status}
                    onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                    className="bg-surface-700 border border-surface-600 text-sm text-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-brand-500"
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
                    className="bg-surface-700 border border-surface-600 text-sm text-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-brand-500 w-56"
                />
            </div>

            {/* Table */}
            <div className="card overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-surface-600">
                            {['S/N', 'Test ID', 'Device', 'Result', 'Date', ''].map(h => (
                                <th key={h} className="text-left text-xs text-muted font-medium pb-3 pr-4 whitespace-nowrap">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {tests.length === 0 && !loading && (
                            <tr>
                                <td colSpan={6} className="py-12 text-center text-muted text-sm">
                                    No test records found.
                                </td>
                            </tr>
                        )}

                        {tests.map(t => (
                            <tr
                                key={t.id}
                                className="border-b border-surface-700 hover:bg-surface-700/40 transition-colors cursor-pointer"
                                onClick={() => navigate(`/test/${t.id}`)}
                            >
                                {/* serialNo is a Long from PcbTest entity */}
                                <td className="py-3 pr-4 font-mono text-sm text-brand-400">{t.serialNo}</td>
                                <td className="py-3 pr-4 font-mono text-xs text-gray-500">#{t.id}</td>
                                <td className="py-3 pr-4 text-xs">
                                    <p className="text-gray-300 font-mono">{t.deviceId}</p>
                                    {t.deviceName && <p className="text-muted">{t.deviceName}</p>}
                                </td>
                                <td className="py-3 pr-4">
                                    <PassFailBadge result={t.status === 'PASS' ? 'pass' : 'fail'} size="sm" />
                                </td>
                                <td className="py-3 pr-4 text-xs text-muted whitespace-nowrap">
                                    {t.createdAt ? new Date(t.createdAt).toLocaleString() : '—'}
                                </td>
                                <td className="py-3 text-xs text-brand-400 hover:underline">Details →</td>
                            </tr>
                        ))}

                        {/* Loading skeleton rows */}
                        {loading && tests.length === 0 && [1, 2, 3, 4, 5].map(i => (
                            <tr key={i} className="border-b border-surface-700">
                                {[1, 2, 3, 4, 5, 6].map(j => (
                                    <td key={j} className="py-3 pr-4">
                                        <div className="h-3 bg-surface-600 rounded animate-pulse w-16" />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {error && <p className="mt-4 text-xs text-red-400">{error}</p>}

            {hasMore && !loading && tests.length > 0 && (
                <div className="mt-4 text-center">
                    <button onClick={handleLoadMore} className="btn-ghost">Load More</button>
                </div>
            )}
        </div>
    );
}