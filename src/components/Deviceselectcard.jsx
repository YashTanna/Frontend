import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reserveDevice } from '../api/testApi';

const statusBadge = (status) => {
    if (status === 'RUNNING') return <span className="badge badge-running"><span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-running-text)', display: 'inline-block' }} />Running</span>;
    if (status === 'OFFLINE') return <span className="badge badge-offline">Offline</span>;
    if (status === 'RESERVED') return <span className="badge badge-running" style={{ background: 'var(--color-neutral-100)', color: 'var(--color-neutral-500)' }}>Reserved</span>;
    return <span className="badge badge-idle">Idle</span>;
};

export default function DeviceSelectCard({ device }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const isOffline = device.status === 'OFFLINE';
    const isReserved = device.status === 'RESERVED';
    const isRunning = device.status === 'RUNNING';
    const isBlocked = isOffline || isReserved || isRunning;

    const handleClick = async () => {
        if (isBlocked || loading) return;

        setLoading(true);
        try {
            await reserveDevice(device.deviceId);
            navigate(`/station/${device.deviceId}`);
        } catch (e) {
            // If reserve fails device may have just changed status — ignore and navigate anyway
            navigate(`/station/${device.deviceId}`);
        } finally {
            setLoading(false);
        }
    };

    const bottomText = () => {
        if (isOffline) return 'Device offline';
        if (isReserved) return 'In use by another user';
        if (isRunning) return 'Test in progress';
        if (loading) return 'Reserving...';
        return 'Click to open station';
    };

    return (
        <div
            className={isBlocked ? 'card' : 'card-hover'}
            style={{ opacity: isBlocked ? 0.55 : 1, cursor: isBlocked ? 'not-allowed' : loading ? 'wait' : 'pointer' }}
            onClick={handleClick}
        >
            {/* Top row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
                <div style={{
                    width: 44, height: 44, borderRadius: '10px',
                    background: isBlocked ? 'var(--color-neutral-100)' : 'var(--color-accent-50)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                    <svg xmlns="http://www.w3.org/2000/svg"
                        style={{ width: 22, height: 22, color: isBlocked ? 'var(--color-neutral-400)' : 'var(--color-accent-600)' }}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round"
                            d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
                    </svg>
                </div>
                {statusBadge(device.status)}
            </div>

            {/* Name & ID */}
            <p style={{ margin: '0 0 0.2rem', fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-neutral-800)' }}>
                {device.name || `Device ${device.deviceId}`}
            </p>
            <p style={{ margin: '0 0 1rem', fontSize: '0.75rem', color: 'var(--color-neutral-400)', fontFamily: 'var(--font-mono)' }}>
                {device.deviceId}
            </p>

            {/* Action row */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                paddingTop: '0.75rem', borderTop: '1px solid var(--color-neutral-100)',
            }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-neutral-400)' }}>
                    {bottomText()}
                </span>
                {!isBlocked && !loading && (
                    <svg xmlns="http://www.w3.org/2000/svg"
                        style={{ width: 16, height: 16, color: 'var(--color-accent-500)' }}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                )}
                {loading && (
                    <svg style={{ width: 16, height: 16, color: 'var(--color-accent-400)', animation: 'spin 1s linear infinite' }}
                        xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="8" />
                    </svg>
                )}
            </div>
        </div>
    );
}