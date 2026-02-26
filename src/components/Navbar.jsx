import { NavLink } from 'react-router-dom';

const links = [
    {
        to: '/dashboard',
        label: 'Dashboard',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
        ),
    },
    {
        to: '/history',
        label: 'Test History',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
        ),
    },
    {
        to: '/reports',
        label: 'Reports',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
        ),
    },
];

export default function Navbar() {
    return (
        <aside style={{
            width: '220px',
            flexShrink: 0,
            background: 'var(--color-neutral-0)',
            borderRight: '1px solid var(--color-neutral-200)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
        }}>
            {/* Brand */}
            <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid var(--color-neutral-100)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: 'var(--color-accent-600)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                        <svg xmlns="http://www.w3.org/2000/svg" style={{ width: 16, height: 16, color: 'white' }} viewBox="0 0 24 24" fill="currentColor">
                            <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-neutral-900)', lineHeight: 1.2 }}>BoostTest</p>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--color-neutral-400)', lineHeight: 1.2 }}>IoT Tester</p>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, padding: '0.75rem 0.625rem' }}>
                <p className="section-title" style={{ padding: '0 0.5rem' }}>Menu</p>
                {links.map(link => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        style={({ isActive }) => ({
                            display: 'flex', alignItems: 'center', gap: '0.625rem',
                            padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
                            fontSize: '0.875rem', fontWeight: 500,
                            textDecoration: 'none',
                            marginBottom: '2px',
                            color: isActive ? 'var(--color-accent-700)' : 'var(--color-neutral-600)',
                            background: isActive ? 'var(--color-accent-50)' : 'transparent',
                            transition: 'all 0.15s',
                        })}
                    >
                        {link.icon}
                        {link.label}
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--color-neutral-100)' }}>
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--color-neutral-400)' }}>ESP32 Boost Tester</p>
                <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--color-neutral-300)', fontFamily: 'var(--font-mono)' }}>v1.0.0</p>
            </div>
        </aside>
    );
}