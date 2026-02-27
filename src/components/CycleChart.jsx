import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px', fontSize: 11, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <p style={{ color: '#94a3b8', marginBottom: 4, fontFamily: 'JetBrains Mono', margin: '0 0 4px' }}>Cycle {label}</p>
            {payload.map((entry) => (
                <p key={entry.name} style={{ color: entry.color, fontFamily: 'JetBrains Mono', margin: '2px 0' }}>
                    {entry.name}: <span style={{ fontWeight: 600 }}>{entry.value?.toFixed(3)}</span>
                </p>
            ))}
        </div>
    );
};

export default function CycleChart({ measurements = [] }) {
    // Sort by cycleNo and keep cycleNo as the X axis key directly
    const data = [...measurements]
        .sort((a, b) => a.cycleNo - b.cycleNo)
        .map(m => ({
            cycleNo: m.cycleNo,          // ← used as X axis — shows actual cycle numbers (1,2,3...)
            Voltage: m.voltage ?? 0,
            Current: m.current ?? 0,
            ChargeTime: m.chargeTime ?? 0,
        }));

    const axisTick = { fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono' };
    const gridColor = '#f1f5f9';
    const margin = { top: 8, right: 16, left: 0, bottom: 4 };

    // Derive X axis domain from actual data so it always fits all cycles
    const cycleNos = data.map(d => d.cycleNo);
    const xMin = cycleNos.length ? Math.min(...cycleNos) : 1;
    const xMax = cycleNos.length ? Math.max(...cycleNos) : 1;

    const chartSection = (title, dataKey, color) => (
        <div style={{ marginBottom: '1.75rem' }}>
            <p style={{ margin: '0 0 0.625rem', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {title}
            </p>
            <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data} margin={margin}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis
                        dataKey="cycleNo"
                        tick={axisTick}
                        domain={[xMin, xMax]}
                        type="number"
                        tickCount={data.length}   // ← show a tick for every cycle
                        label={{ value: 'Cycle', position: 'insideBottom', offset: -2, style: { fill: '#cbd5e1', fontSize: 10 } }}
                        height={36}
                    />
                    <YAxis tick={axisTick} width={45} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                        type="monotone"
                        dataKey={dataKey}
                        stroke={color}
                        strokeWidth={2}
                        dot={{ fill: color, r: 4, strokeWidth: 0 }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        isAnimationActive={false}   // ← disable animation so all points show immediately
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );

    if (!data.length) return (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
            No measurement data available.
        </div>
    );

    return (
        <div>
            {chartSection('Voltage per Cycle (V)', 'Voltage', '#16a34a')}
            {chartSection('Current per Cycle (A)', 'Current', '#2563eb')}
            {chartSection('Charge Time per Cycle (ms)', 'ChargeTime', '#d97706')}
        </div>
    );
}