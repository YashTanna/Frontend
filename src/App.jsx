import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import TestStation from './pages/TestStation';
import TestHistory from './pages/TestHistory';
import TestDetail from './pages/TestDetail';
import Reports from './pages/Reports';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className={`app-layout${sidebarOpen ? ' sidebar-open' : ''}`}>

        {/* Mobile hamburger */}
        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
          <svg xmlns="http://www.w3.org/2000/svg" style={{ width: 20, height: 20, color: 'var(--color-neutral-700)' }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        {/* Overlay */}
        <div
          className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Sidebar */}
        <Navbar
          className={`sidebar-desktop ${sidebarOpen ? 'open' : ''}`}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main content */}
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/station/:deviceId" element={<TestStation />} />
            <Route path="/history" element={<TestHistory />} />
            <Route path="/test/:testId" element={<TestDetail />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>

      </div>
    </BrowserRouter>
  );
}