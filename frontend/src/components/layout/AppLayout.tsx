import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export function AppLayout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Animated background */}
      <div className="anotai-bg">
        <div className="grid-overlay" />
        <div className="scanline" />
      </div>

      <Navbar />

      <main style={{ flex: 1, position: 'relative', zIndex: 1, padding: 24 }}>
        <Outlet />
      </main>
    </div>
  );
}
