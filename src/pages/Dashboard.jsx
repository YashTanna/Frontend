import { useState, useEffect } from 'react';
import { getDevices } from '../api/testApi';
import DeviceSelectCard from '../components/Deviceselectcard';

const MOCK_DEVICES = [
    { deviceId: 'ESP32-001', name: 'Device 01 — Line A', status: 'IDLE' },
    { deviceId: 'ESP32-002', name: 'Device 02 — Line B', status: 'RUNNING' },
    { deviceId: 'ESP32-003', name: 'Device 03 — Line C', status: 'OFFLINE' },
];

export default function Dashboard() {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getDevices()
            .then(res => setDevices(res.data))
            .catch(() => setDevices(MOCK_DEVICES))
            .finally(() => setLoading(false));
    }, []);

    const idle = devices.filter(d => d.status === 'IDLE').length;
    const running = devices.filter(d => d.status === 'RUNNING').length;
    const offline = devices.filter(d => d.status === 'OFFLINE').length;

    return (
        <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>

            {/* Page header */}
            <div style={{ marginBottom: '1.75rem' }}>
                <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-neutral-900)' }}>
                    Select Device
                </h1>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-neutral-500)' }}>
                    Choose an ESP32 device to open its test station.
                </p>
            </div>

            {/* Stats row */}
            {!loading && devices.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.875rem', marginBottom: '1.75rem' }}>
                    {[
                        { label: 'Total Devices', value: devices.length, color: 'var(--color-neutral-800)' },
                        { label: 'Idle', value: idle, color: 'var(--color-neutral-500)' },
                        { label: 'Running', value: running, color: 'var(--color-running-text)' },
                        { label: 'Offline', value: offline, color: '#92400e' },
                    ].map(s => (
                        <div key={s.label} className="card" style={{ padding: '1rem' }}>
                            <p style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 700, color: s.color, fontFamily: 'var(--font-mono)' }}>
                                {s.value}
                            </p>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-neutral-400)' }}>{s.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Devices grid */}
            <p className="section-title">Devices</p>

            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="card" style={{ height: '160px', background: 'var(--color-neutral-100)', animation: 'pulse 1.5s infinite' }} />
                    ))}
                </div>
            ) : devices.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p style={{ color: 'var(--color-neutral-400)', fontSize: '0.875rem' }}>No devices found.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                    {devices.map(device => (
                        <DeviceSelectCard key={device.deviceId} device={device} />
                    ))}
                </div>
            )}
        </div>
    );
}