import { useNavigate } from 'react-router-dom';

const statusBadge = (status) => {
    if (status === 'RUNNING') return <span className="badge badge-running"><span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-running-text)', display: 'inline-block' }} />Running</span>;
    if (status === 'OFFLINE') return <span className="badge badge-offline">Offline</span>;
    return <span className="badge badge-idle">Idle</span>;
};

export default function DeviceSelectCard({ device }) {
    const navigate = useNavigate();

    const isOffline = device.status === 'OFFLINE';

    return (
        <div
            className={isOffline ? 'card' : 'card-hover'}
            style={{ opacity: isOffline ? 0.55 : 1 }}
            onClick={() => !isOffline && navigate(`/station/${device.deviceId}`)}
        >
            {/* Top row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
                {/* Icon */}
                <div style={{
                    width: 44, height: 44, borderRadius: '10px',
                    background: isOffline ? 'var(--color-neutral-100)' : 'var(--color-accent-50)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                    <svg xmlns="http://www.w3.org/2000/svg"
                        style={{ width: 22, height: 22, color: isOffline ? 'var(--color-neutral-400)' : 'var(--color-accent-600)' }}
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
                    {isOffline ? 'Device offline' : 'Click to open station'}
                </span>
                {!isOffline && (
                    <svg xmlns="http://www.w3.org/2000/svg"
                        style={{ width: 16, height: 16, color: 'var(--color-accent-500)' }}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                )}
            </div>
        </div>
    );
}