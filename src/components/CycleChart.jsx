import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-surface-700 border border-surface-500 rounded-lg px-3 py-2 text-xs shadow-lg">
            <p className="text-muted mb-1 font-mono">Cycle {label}</p>
            {payload.map((entry) => (
                <p key={entry.name} style={{ color: entry.color }} className="font-mono">
                    {entry.name}: <span className="font-semibold">{entry.value?.toFixed(3)}</span>
                </p>
            ))}
        </div>
    );
};

/**
 * measurements — array of objects from PcbTestMeasurement entity:
 * [{ cycleNo, voltage, current, chargeTime, peakVoltage }, ...]
 */
export default function CycleChart({ measurements = [] }) {
    // Sort by cycleNo just in case backend returns out of order
    const data = [...measurements]
        .sort((a, b) => a.cycleNo - b.cycleNo)
        .map(m => ({
            cycle: m.cycleNo,
            Voltage: m.voltage ?? 0,
            Current: m.current ?? 0,
            ChargeTime: m.chargeTime ?? 0,
        }));

    const axisTick = { fill: '#6b7c6d', fontSize: 11, fontFamily: 'JetBrains Mono' };

    const chartProps = {
        margin: { top: 4, right: 8, left: 0, bottom: 4 },
    };

    return (
        <div className="space-y-6">

            {/* Voltage */}
            <div>
                <p className="section-title">Voltage per Cycle (V)</p>
                <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={data} {...chartProps}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e2a1f" />
                        <XAxis dataKey="cycle" tick={axisTick} />
                        <YAxis tick={axisTick} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="Voltage" stroke="#4ade80" strokeWidth={2}
                            dot={{ fill: '#4ade80', r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Current */}
            <div>
                <p className="section-title">Current per Cycle (A)</p>
                <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={data} {...chartProps}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e2a1f" />
                        <XAxis dataKey="cycle" tick={axisTick} />
                        <YAxis tick={axisTick} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="Current" stroke="#60a5fa" strokeWidth={2}
                            dot={{ fill: '#60a5fa', r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Charge Time */}
            <div>
                <p className="section-title">Charge Time per Cycle (ms)</p>
                <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={data} {...chartProps}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e2a1f" />
                        <XAxis dataKey="cycle" tick={axisTick} />
                        <YAxis tick={axisTick} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="ChargeTime" stroke="#f59e0b" strokeWidth={2}
                            dot={{ fill: '#f59e0b', r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

        </div>
    );
}