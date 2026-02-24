import { useEffect, useState } from 'react';
import { Modal } from '@mantine/core';
import { IconWand, IconChartBar } from '@tabler/icons-react';
import { ProjectMember, AssignmentStatsItem } from '../../types/api';
import * as imageApi from '../../api/images';
import * as projectApi from '../../api/projects';

interface Props {
  projectId: string;
  totalImages: number;
}

export function ImageAssigner({ projectId, totalImages }: Props) {
  const [stats, setStats] = useState<AssignmentStatsItem[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [unassignedCount, setUnassignedCount] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [countPerUser, setCountPerUser] = useState('');

  const fetchData = async () => {
    const [statsData, membersData, unassigned] = await Promise.all([
      imageApi.getAssignmentStats(projectId),
      projectApi.listMembers(projectId),
      imageApi.listUnassigned(projectId),
    ]);
    setStats(statsData);
    setMembers(membersData);
    setUnassignedCount(unassigned.length);
  };

  useEffect(() => {
    fetchData();
  }, [projectId, totalImages]);

  const totalAssigned = stats.reduce((sum, s) => sum + s.assigned, 0);

  const openAutoAssign = () => {
    setSelectedUserIds(members.map((m) => m.user_id));
    setCountPerUser('');
    setModalOpen(true);
  };

  const handleAutoAssign = async () => {
    if (selectedUserIds.length === 0) return;
    const count = countPerUser ? parseInt(countPerUser) : undefined;
    await imageApi.autoAssign(projectId, selectedUserIds, count);
    setModalOpen(false);
    fetchData();
  };

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  return (
    <div className="glass-panel" style={{ padding: 20, marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span className="section-label" style={{ margin: 0 }}>
          <IconChartBar size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />
          Atribuicao de Imagens
        </span>
        <button className="neon-btn neon-btn--green" style={{ padding: '4px 10px', fontSize: '0.6rem' }} onClick={openAutoAssign}>
          <IconWand size={12} />
          Auto-distribuir
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <span className="neon-badge">{totalImages} total</span>
        <span className="neon-badge neon-badge--green">{totalAssigned} atribuidas</span>
        <span className="neon-badge" style={{
          background: 'rgba(255,165,0,0.1)',
          border: '1px solid rgba(255,165,0,0.3)',
          color: '#ffa500',
        }}>
          {unassignedCount} nao atribuidas
        </span>
      </div>

      {/* Stats per user */}
      {stats.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {stats.map((s) => {
            const progress = s.assigned > 0 ? (s.annotated / s.assigned) * 100 : 0;
            return (
              <div key={s.user_id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '8px 12px',
                background: 'var(--bg-elevated)',
                borderRadius: 4,
                border: '1px solid var(--border-subtle)',
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-primary)', minWidth: 80 }}>
                  {s.username}
                </span>
                <div style={{ flex: 1, height: 6, background: 'var(--bg-card)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    width: `${progress}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, var(--neon-cyan), var(--neon-green))',
                    borderRadius: 3,
                    transition: 'width 0.3s',
                  }} />
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', minWidth: 60, textAlign: 'right' }}>
                  {s.annotated}/{s.assigned}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Auto-assign Modal */}
      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="Auto-distribuir Imagens" centered size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '8px 0' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {unassignedCount} imagens nao atribuidas serao distribuidas entre os membros selecionados.
          </p>

          <div>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>
              Membros
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {members.map((m) => (
                <label key={m.user_id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 10px',
                  background: selectedUserIds.includes(m.user_id) ? 'rgba(0,240,255,0.05)' : 'transparent',
                  border: `1px solid ${selectedUserIds.includes(m.user_id) ? 'rgba(0,240,255,0.2)' : 'var(--border-subtle)'}`,
                  borderRadius: 4,
                  cursor: 'pointer',
                }}>
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(m.user_id)}
                    onChange={() => toggleUser(m.user_id)}
                  />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                    {m.username}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="neon-input">
            <label>Quantidade por usuario (opcional)</label>
            <input
              type="number"
              placeholder="Deixe vazio para distribuir todas"
              value={countPerUser}
              onChange={(e) => setCountPerUser(e.target.value)}
              min={1}
            />
          </div>

          <button className="neon-btn neon-btn--solid" onClick={handleAutoAssign} style={{ width: '100%' }} disabled={selectedUserIds.length === 0}>
            Distribuir
          </button>
        </div>
      </Modal>
    </div>
  );
}
