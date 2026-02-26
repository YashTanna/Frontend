export default function PassFailBadge({ result, size = 'sm' }) {
    if (!result) return null;
    const isPass = result === 'pass' || result === 'PASS' || result === true;

    const padding = size === 'lg' ? '0.35rem 1rem' : size === 'md' ? '0.3rem 0.875rem' : '0.2rem 0.625rem';
    const fontSize = size === 'lg' ? '0.8rem' : size === 'md' ? '0.72rem' : '0.65rem';

    return (
        <span className={isPass ? 'badge badge-pass' : 'badge badge-fail'}
            style={{ padding, fontSize }}>
            <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: isPass ? 'var(--color-pass-text)' : 'var(--color-fail-text)',
                flexShrink: 0,
            }} />
            {isPass ? 'PASS' : 'FAIL'}
        </span>
    );
}