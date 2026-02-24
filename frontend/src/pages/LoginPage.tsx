import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError('Email ou senha incorretos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background */}
      <div className="anotai-bg">
        <div className="grid-overlay" />
        <div className="scanline" />
      </div>

      {/* Floating orbs */}
      <div style={{
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,240,255,0.08), transparent 70%)',
        top: '10%',
        right: '15%',
        animation: 'float 6s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,0,229,0.06), transparent 70%)',
        bottom: '15%',
        left: '10%',
        animation: 'float 8s ease-in-out infinite 1s',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: 420,
        padding: '0 20px',
        animation: 'fadeInUp 0.8s var(--ease-out-expo) both',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div className="anotai-logo" style={{ fontSize: '2.2rem', justifyContent: 'center', display: 'flex' }}>
            <span className="logo-anot">anot</span>
            <span className="logo-ai">AI</span>
          </div>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginTop: 16,
            animation: 'fadeInUp 0.8s var(--ease-out-expo) both 0.2s',
          }}>
            Segmentation Annotation Platform
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel" style={{
          padding: 32,
          animation: 'fadeInUp 0.8s var(--ease-out-expo) both 0.1s',
        }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {error && (
                <div style={{
                  padding: '10px 14px',
                  background: 'rgba(255, 50, 50, 0.08)',
                  border: '1px solid rgba(255, 50, 50, 0.2)',
                  borderRadius: 4,
                  color: '#ff5050',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                }}>
                  {error}
                </div>
              )}

              <div className="neon-input">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="neon-input">
                <label>Senha</label>
                <input
                  type="password"
                  placeholder="........"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                className={`neon-btn neon-btn--solid ${loading ? 'neon-btn--loading' : ''}`}
                type="submit"
                disabled={loading}
                style={{ width: '100%', marginTop: 8 }}
              >
                {!loading && 'Entrar'}
              </button>
            </div>
          </form>

          <p style={{
            textAlign: 'center',
            marginTop: 20,
            fontFamily: 'var(--font-body)',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
          }}>
            Conta fornecida pelo administrador
          </p>
        </div>
      </div>
    </div>
  );
}
