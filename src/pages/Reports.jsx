import { useState } from 'react';
import * as XLSX from 'xlsx';
import { getTestsForExport, getTestById, getErrorMessage } from '../api/testApi';

// ── Cycle config — 12 total, remove index 0 and 11, keep middle 10 ────────────
// Cycles 0-7 = voltage input, measure current
// Cycles 8-11 = current input, measure voltage drop
// After removing index 0 and 11: kept indices [1,2,3,4,5,6,7,8,9,10]
const KEPT_INDICES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const CYCLE_LABELS = {
    1: '10V', 2: '11V', 3: '12V', 4: '14V',
    5: '18V', 6: '24V', 7: '32V',
    8: '18.5mA', 9: '20mA', 10: '25mA',
};

const REF_TIME = {
    1: '<5000', 2: '<4000', 3: '<2500', 4: '<1600',
    5: '<850', 6: '<500', 7: '<250',
    8: '<5000', 9: '<4000', 10: '<2600',
};

const REF_CV = {
    1: '<20', 2: '<22', 3: '<24', 4: '<28.5',
    5: '<37', 6: '<49.7', 7: '<67',
    8: '>9.5', 9: '>10.3', 10: '>12.5',
};

// Quick preset ranges
const PRESETS = ['7d', '30d', '90d'];

function getPresetDates(preset) {
    const to = new Date();
    const from = new Date();
    const days = parseInt(preset);
    from.setDate(from.getDate() - days);
    return {
        from: from.toISOString().split('T')[0],
        to: to.toISOString().split('T')[0],
    };
}

// ── Excel generator ───────────────────────────────────────────────────────────
async function generateExcel(tests, fromDate, toDate) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([]);

    // Helper to set cell with style info stored separately (SheetJS CE supports basic styles)
    const sc = (r, c, v) => {
        const addr = XLSX.utils.encode_cell({ r, c });
        ws[addr] = { v, t: typeof v === 'number' ? 'n' : 's' };
    };

    // ── ROW 0: Company header ──────────────────────────────────────────────────
    sc(0, 0, 'ROTEX AUTOMATION LIMITED (RAL-I)');
    sc(0, 5, 'FORMAT');
    sc(0, 9, 'Document No.');
    sc(0, 10, '');

    // ── ROW 1: Inspection Report title ────────────────────────────────────────
    sc(1, 5, 'INSPECTION REPORT');
    sc(1, 9, 'Rev. No.');
    sc(1, 10, '');

    // ── ROW 2: Rev date ───────────────────────────────────────────────────────
    sc(2, 9, 'Rev.Date');
    sc(2, 10, '');

    // ── ROW 3: blank separator ────────────────────────────────────────────────

    // ── ROW 4: Info row 1 ─────────────────────────────────────────────────────
    sc(4, 0, 'DESCRIPTION: BOOSTER CIRCUIT ASSEMBLY');
    sc(4, 3, 'SUPPLIER NAME : ATYANTECH PVT. LTD');
    sc(4, 6, 'ACCEPTED: ALL');
    sc(4, 8, 'INWARD OS/PO : 1600024311');

    // ── ROW 5: Info row 2 ─────────────────────────────────────────────────────
    sc(5, 0, 'DRG.NO:');
    sc(5, 1, 'Rev.No: 0');
    sc(5, 3, `TOTAL QTY: ${tests.length}`);
    sc(5, 6, 'REJECTED: NIL');
    sc(5, 8, 'Supplier C/H.NO: U1/INV/2526/0204');

    // ── ROW 6: Info row 3 ─────────────────────────────────────────────────────
    sc(6, 0, 'Item.No: 90000000674');
    sc(6, 3, 'MATERIAL GRADE : ASSEMBLY');
    sc(6, 6, 'REWORK: NIL');
    sc(6, 8, `INSPECTION DATE: ${fromDate} To ${toDate}`);

    // ── ROW 7: blank separator ────────────────────────────────────────────────

    // ── ROW 8: Table header row 1 — Reference Time ────────────────────────────
    sc(8, 0, '');
    sc(8, 1, 'Reference Time');
    KEPT_INDICES.forEach((idx, i) => sc(8, 2 + i, REF_TIME[idx]));
    sc(8, 12, '');

    // ── ROW 9: Table header row 2 — Reference Current/Voltage ─────────────────
    sc(9, 0, '');
    sc(9, 1, 'Reference Current/Voltage');
    KEPT_INDICES.forEach((idx, i) => sc(9, 2 + i, REF_CV[idx]));
    sc(9, 12, '');

    // ── ROW 10: Table header row 3 — Serial No / Input / cycle labels / Result ─
    sc(10, 0, 'Serial No');
    sc(10, 1, 'Input');
    KEPT_INDICES.forEach((idx, i) => sc(10, 2 + i, CYCLE_LABELS[idx]));
    sc(10, 12, 'Test Result');

    // ── DATA ROWS: 2 rows per test ─────────────────────────────────────────────
    let currentRow = 11;

    for (const test of tests) {
        // Fetch full test detail with measurements
        let measurements = [];
        try {
            const res = await getTestById(test.id || test.testId);
            measurements = res.data?.measurements || [];
        } catch (e) {
            // If fetch fails, leave measurements empty
        }

        const status = test.status || '';

        // Row A: Response (mS) — chargeTime values
        sc(currentRow, 0, test.serialNo ?? '');
        sc(currentRow, 1, 'Response(mS)');
        KEPT_INDICES.forEach((idx, i) => {
            const m = measurements.find(m => m.cycleNo === idx);
            sc(currentRow, 2 + i, m ? (m.chargeTime ?? '') : '');
        });
        sc(currentRow, 12, status);

        // Row B: Current (mA) / Voltage Drop (V)
        sc(currentRow + 1, 0, '');    // serial no blank on second row
        sc(currentRow + 1, 1, 'Current(mA)/Voltage Drop(V)');
        KEPT_INDICES.forEach((idx, i) => {
            const m = measurements.find(m => m.cycleNo === idx);
            // Cycles 1-7 (voltage input) → show current
            // Cycles 8-10 (current input) → show voltage
            const val = m
                ? (idx <= 7 ? (m.current ?? '') : (m.voltage ?? ''))
                : '';
            sc(currentRow + 1, 2 + i, val);
        });
        sc(currentRow + 1, 12, '');   // result only on first row

        currentRow += 2;
    }

    // ── Column widths ──────────────────────────────────────────────────────────
    ws['!cols'] = [
        { wch: 12 },  // A — Serial No
        { wch: 28 },  // B — Input label
        ...KEPT_INDICES.map(() => ({ wch: 10 })),  // C–L — cycle columns
        { wch: 12 },  // M — Test Result
    ];

    // ── Merge cells for company header ────────────────────────────────────────
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 2, c: 3 } },   // Company name
        { s: { r: 1, c: 5 }, e: { r: 2, c: 8 } },   // INSPECTION REPORT title
        // Info rows
        { s: { r: 4, c: 0 }, e: { r: 4, c: 2 } },
        { s: { r: 5, c: 0 }, e: { r: 5, c: 0 } },
        { s: { r: 6, c: 0 }, e: { r: 6, c: 2 } },
        // Result column merges per test (2 rows → 1)
        ...tests.map((_, i) => ({
            s: { r: 11 + i * 2, c: 12 },
            e: { r: 11 + i * 2 + 1, c: 12 },
        })),
        // Serial No column merges per test
        ...tests.map((_, i) => ({
            s: { r: 11 + i * 2, c: 0 },
            e: { r: 11 + i * 2 + 1, c: 0 },
        })),
    ];

    // Set sheet range
    const lastRow = currentRow - 1;
    ws['!ref'] = XLSX.utils.encode_range({ r: 0, c: 0 }, { r: lastRow, c: 12 });

    XLSX.utils.book_append_sheet(wb, ws, 'Inspection Report');
    XLSX.writeFile(wb, `Inspection_Report_${fromDate}_to_${toDate}.xlsx`);
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Reports() {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

    const [fromDate, setFromDate] = useState(weekAgo);
    const [toDate, setToDate] = useState(today);
    const [deviceId, setDeviceId] = useState('');
    const [activePreset, setActivePreset] = useState('7d');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState('');

    const handlePreset = (preset) => {
        setActivePreset(preset);
        const { from, to } = getPresetDates(preset);
        setFromDate(from);
        setToDate(to);
    };

    const handleFromChange = (e) => {
        setFromDate(e.target.value);
        setActivePreset(null);
    };

    const handleToChange = (e) => {
        setToDate(e.target.value);
        setActivePreset(null);
    };

    const handleDownload = async () => {
        if (!fromDate || !toDate) {
            setError('Please select both from and to dates.');
            return;
        }
        if (fromDate > toDate) {
            setError('From date cannot be after To date.');
            return;
        }

        setLoading(true);
        setError(null);
        setProgress('Fetching tests...');

        try {
            const params = { fromDate, toDate };
            if (deviceId) params.deviceId = deviceId;

            const res = await getTestsForExport(fromDate, toDate, deviceId || undefined);
            const tests = res.data?.content || res.data?.tests || res.data || [];

            if (!tests.length) {
                setError('No tests found for the selected date range.');
                setLoading(false);
                setProgress('');
                return;
            }

            setProgress(`Generating Excel for ${tests.length} tests...`);
            await generateExcel(tests, fromDate, toDate);
            setProgress('');
        } catch (err) {
            setError(getErrorMessage(err));
            setProgress('');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        padding: '0.5rem 0.75rem',
        border: '1px solid var(--color-neutral-200)',
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        color: 'var(--color-neutral-700)',
        background: 'var(--color-neutral-0)',
        outline: 'none',
        width: '100%',
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>

            {/* Page title */}
            <div style={{ marginBottom: '1.75rem' }}>
                <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-neutral-900)' }}>
                    Reports
                </h1>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-neutral-500)' }}>
                    Download inspection report as Excel file.
                </p>
            </div>

            <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* Quick presets */}
                <div>
                    <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-neutral-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Quick Range
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {PRESETS.map(p => (
                            <button
                                key={p}
                                onClick={() => handlePreset(p)}
                                style={{
                                    padding: '0.375rem 1rem',
                                    borderRadius: '0.375rem',
                                    border: '1px solid',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                    borderColor: activePreset === p ? 'var(--color-accent-600)' : 'var(--color-neutral-200)',
                                    background: activePreset === p ? 'var(--color-accent-50)' : 'white',
                                    color: activePreset === p ? 'var(--color-accent-700)' : 'var(--color-neutral-600)',
                                }}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Date pickers */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-neutral-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                            From Date
                        </label>
                        <input
                            type="date"
                            value={fromDate}
                            max={toDate}
                            onChange={handleFromChange}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-neutral-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                            To Date
                        </label>
                        <input
                            type="date"
                            value={toDate}
                            min={fromDate}
                            max={today}
                            onChange={handleToChange}
                            style={inputStyle}
                        />
                    </div>
                </div>

                {/* Device filter */}
                <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-neutral-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                        Device ID (optional)
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. esp32_01 — leave blank for all devices"
                        value={deviceId}
                        onChange={e => setDeviceId(e.target.value)}
                        style={inputStyle}
                    />
                </div>

                {/* Error */}
                {error && (
                    <div style={{ padding: '0.75rem 1rem', background: 'var(--color-fail-bg)', border: '1px solid var(--color-fail-border)', borderRadius: '0.5rem', fontSize: '0.85rem', color: 'var(--color-fail-text)' }}>
                        {error}
                    </div>
                )}

                {/* Progress */}
                {progress && (
                    <div style={{ padding: '0.75rem 1rem', background: 'var(--color-accent-50)', border: '1px solid var(--color-accent-200)', borderRadius: '0.5rem', fontSize: '0.85rem', color: 'var(--color-accent-700)' }}>
                        {progress}
                    </div>
                )}

                {/* Download button */}
                <button
                    onClick={handleDownload}
                    disabled={loading}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        background: loading ? 'var(--color-neutral-200)' : 'var(--color-accent-600)',
                        color: loading ? 'var(--color-neutral-400)' : 'white',
                        border: 'none', borderRadius: '0.5rem',
                        fontSize: '0.875rem', fontWeight: 600,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s',
                    }}
                >
                    {loading ? (
                        <>
                            <svg style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="8" />
                            </svg>
                            Generating...
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            Download Excel Report
                        </>
                    )}
                </button>

                {/* Info note */}
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-neutral-400)', textAlign: 'center' }}>
                    Report follows ROTEX Automation Inspection Report format.
                    Only PASS tests with measurements are included.
                </p>

            </div>
        </div>
    );
}