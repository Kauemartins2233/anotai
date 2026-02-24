import { useEffect, useState } from 'react';
import { Modal } from '@mantine/core';
import { IconPlus, IconTrash, IconUsers } from '@tabler/icons-react';
import { ProjectMember, User } from '../../types/api';
import * as projectApi from '../../api/projects';
import * as adminApi from '../../api/admin';

interface Props {
  projectId: string;
}

export function MemberManager({ projectId }: Props) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');

  const fetchMembers = async () => {
    const data = await projectApi.listMembers(projectId);
    setMembers(data);
  };

  useEffect(() => {
    fetchMembers();
  }, [projectId]);

  const openAddModal = async () => {
    const users = await adminApi.listUsers();
    setAllUsers(users);
    setSelectedUserId('');
    setModalOpen(true);
  };

  const handleAdd = async () => {
    if (!selectedUserId) return;
    await projectApi.addMember(projectId, selectedUserId);
    setModalOpen(false);
    fetchMembers();
  };

  const handleRemove = async (userId: string) => {
    await projectApi.removeMember(projectId, userId);
    fetchMembers();
  };

  const availableUsers = allUsers.filter(
    (u) => !members.some((m) => m.user_id === u.id) && !u.is_admin
  );

  return (
    <div className="glass-panel" style={{ padding: 20, marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span className="section-label" style={{ margin: 0 }}>
          <IconUsers size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />
          Membros
        </span>
        <button className="neon-btn" style={{ padding: '4px 10px', fontSize: '0.6rem' }} onClick={openAddModal}>
          <IconPlus size={12} />
          Adicionar
        </button>
      </div>

      {members.length === 0 ? (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
          Nenhum membro adicionado
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {members.map((m) => (
            <div key={m.user_id} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: 'var(--bg-elevated)',
              borderRadius: 4,
              border: '1px solid var(--border-subtle)',
            }}>
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                  {m.username}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: 8 }}>
                  {m.email}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="neon-badge">{m.role}</span>
                <button
                  onClick={() => handleRemove(m.user_id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: 2,
                    transition: 'color 0.3s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ff5050')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <IconTrash size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="Adicionar Membro" centered size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '8px 0' }}>
          {availableUsers.length === 0 ? (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Nenhum usuario disponivel. Crie novos usuarios primeiro.
            </p>
          ) : (
            <>
              <div className="neon-input">
                <label>Selecionar Usuario</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 4,
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8rem',
                  }}
                >
                  <option value="">-- Selecionar --</option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
              <button className="neon-btn neon-btn--solid" onClick={handleAdd} style={{ width: '100%' }} disabled={!selectedUserId}>
                Adicionar Membro
              </button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
