import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import TestStation from './pages/Teststation';
import TestHistory from './pages/TestHistory';
import TestDetail from './pages/TestDetail';
import Reports from './pages/Reports';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--color-neutral-50)' }}>
        <Navbar />
        <main style={{ flex: 1, overflowY: 'auto' }}>
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