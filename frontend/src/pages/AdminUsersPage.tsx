import { useEffect, useState } from 'react';
import { Modal } from '@mantine/core';
import { IconPlus, IconShield, IconUserOff, IconUserCheck } from '@tabler/icons-react';
import { User } from '../types/api';
import * as adminApi from '../api/admin';

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await adminApi.listUsers();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async () => {
    if (!email.trim() || !username.trim() || !password.trim()) return;
    setError('');
    try {
      await adminApi.createUser(email, username, password);
      setModalOpen(false);
      setEmail('');
      setUsername('');
      setPassword('');
      fetchUsers();
    } catch {
      setError('Erro ao criar usuario. Email ou username ja em uso.');
    }
  };

  const toggleActive = async (user: User) => {
    await adminApi.updateUser(user.id, { is_active: !user.is_active });
    fetchUsers();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
        <div className="hex-loader" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', animation: 'fadeInUp 0.6s var(--ease-out-expo) both' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.1rem',
            fontWeight: 700,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            margin: 0,
          }}>
            Gerenciar Usuarios
          </h2>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            letterSpacing: '0.05em',
            marginTop: 6,
          }}>
            {users.length} usuario{users.length !== 1 ? 's' : ''} cadastrado{users.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="neon-btn neon-btn--solid" onClick={() => setModalOpen(true)}>
          <IconPlus size={14} />
          Criar Usuario
        </button>
      </div>

      {/* Users table */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              {['Username', 'Email', 'Status', 'Role', 'Acoes'].map((h) => (
                <th key={h} style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.65rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  fontWeight: 500,
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                  {user.username}
                </td>
                <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {user.email}
                </td>
                <td style={{ padding: '10px 16px' }}>
                  <span className={`neon-badge ${user.is_active ? 'neon-badge--green' : ''}`}
                    style={!user.is_active ? { background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.3)', color: '#ff5050' } : {}}>
                    {user.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td style={{ padding: '10px 16px' }}>
                  {user.is_admin && (
                    <span className="neon-badge" style={{
                      background: 'rgba(255,0,229,0.1)',
                      border: '1px solid rgba(255,0,229,0.3)',
                      color: 'var(--neon-magenta)',
                    }}>
                      <IconShield size={10} />
                      ADMIN
                    </span>
                  )}
                  {!user.is_admin && (
                    <span className="neon-badge">Anotador</span>
                  )}
                </td>
                <td style={{ padding: '10px 16px' }}>
                  <button
                    className="neon-btn"
                    style={{ padding: '4px 10px', fontSize: '0.6rem' }}
                    onClick={() => toggleActive(user)}
                  >
                    {user.is_active ? <IconUserOff size={12} /> : <IconUserCheck size={12} />}
                    {user.is_active ? 'Desativar' : 'Ativar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="Criar Usuario" centered size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '8px 0' }}>
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
            <label>Username</label>
            <input placeholder="nome_usuario" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
          </div>
          <div className="neon-input">
            <label>Email</label>
            <input type="email" placeholder="email@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="neon-input">
            <label>Senha</label>
            <input type="password" placeholder="........" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="neon-btn neon-btn--solid" onClick={handleCreate} style={{ width: '100%' }}>
            Criar Usuario
          </button>
        </div>
      </Modal>
    </div>
  );
}
