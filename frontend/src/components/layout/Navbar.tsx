import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { IconShield, IconUsers } from '@tabler/icons-react';

export function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{
      height: 60,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(5, 6, 10, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      animation: 'fadeInDown 0.5s var(--ease-out-expo) both',
      position: 'relative',
      zIndex: 100,
    }}>
      {/* Neon bottom line */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(0,240,255,0.2), rgba(255,0,229,0.15), transparent)',
      }} />

      <div className="anotai-logo" onClick={() => navigate('/')}>
        <span className="logo-anot">anot</span>
        <span className="logo-ai">AI</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {user?.is_admin && (
          <button
            className="neon-btn"
            style={{ padding: '4px 10px', fontSize: '0.6rem' }}
            onClick={() => navigate('/admin/users')}
          >
            <IconUsers size={12} />
            Usuarios
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            letterSpacing: '0.05em',
          }}>
            {user?.username}
          </span>
          {user?.is_admin && (
            <span className="neon-badge" style={{
              background: 'rgba(255,0,229,0.1)',
              border: '1px solid rgba(255,0,229,0.3)',
              color: 'var(--neon-magenta)',
              padding: '1px 6px',
              fontSize: '0.55rem',
            }}>
              <IconShield size={9} />
              ADMIN
            </span>
          )}
        </div>
        <div style={{
          width: 4,
          height: 4,
          borderRadius: '50%',
          background: 'var(--neon-green)',
          boxShadow: '0 0 6px var(--neon-green)',
        }} />
        <button
          className="neon-btn neon-btn--magenta"
          style={{ padding: '6px 14px', fontSize: '0.65rem' }}
          onClick={handleLogout}
        >
          Sair
        </button>
      </div>
    </nav>
  );
}
