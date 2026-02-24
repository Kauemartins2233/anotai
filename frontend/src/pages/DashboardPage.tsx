import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '@mantine/core';
import { IconPlus, IconTrash, IconPhoto, IconTag, IconUsers } from '@tabler/icons-react';
import { useProjectStore } from '../store/projectStore';
import { useAuthStore } from '../store/authStore';

export function DashboardPage() {
  const { projects, loading, fetchProjects, createProject, deleteProject } = useProjectStore();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.is_admin ?? false;
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    const project = await createProject(name, description || undefined);
    setModalOpen(false);
    setName('');
    setDescription('');
    navigate(`/projects/${project.id}`);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
        <div className="hex-loader" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', animation: 'fadeInUp 0.6s var(--ease-out-expo) both' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 40,
      }}>
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
            {isAdmin ? 'Todos os Projetos' : 'Meus Projetos'}
          </h2>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            letterSpacing: '0.05em',
            marginTop: 6,
          }}>
            {projects.length} projeto{projects.length !== 1 ? 's' : ''} encontrado{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {isAdmin && (
            <>
              <button className="neon-btn" onClick={() => navigate('/admin/users')}>
                <IconUsers size={14} />
                Gerenciar Usuarios
              </button>
              <button className="neon-btn neon-btn--solid" onClick={() => setModalOpen(true)}>
                <IconPlus size={14} />
                Novo Projeto
              </button>
            </>
          )}
        </div>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          animation: 'fadeInUp 0.8s var(--ease-out-expo) both 0.2s',
        }}>
          <div style={{
            width: 80,
            height: 80,
            margin: '0 auto 24px',
            border: '1px solid var(--border-default)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'glowPulse 3s ease-in-out infinite',
          }}>
            <IconPlus size={32} color="var(--neon-cyan)" style={{ opacity: 0.5 }} />
          </div>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.75rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}>
            {isAdmin ? 'Nenhum projeto ainda' : 'Voce nao foi adicionado a nenhum projeto'}
          </p>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            marginTop: 8,
          }}>
            {isAdmin ? 'Crie um novo projeto para comecar a anotar suas imagens' : 'Aguarde o administrador adiciona-lo a um projeto'}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 20,
        }}>
          {projects.map((project, i) => (
            <div
              key={project.id}
              className="neon-card neon-card--clickable stagger-item"
              style={{ animationDelay: `${i * 0.08}s` }}
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--text-primary)',
                  margin: 0,
                }}>
                  {project.name}
                </h3>
                {isAdmin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteProject(project.id);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      padding: 4,
                      transition: 'color 0.3s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#ff5050')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    <IconTrash size={14} />
                  </button>
                )}
              </div>

              {project.description && (
                <p style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  marginBottom: 16,
                  lineHeight: 1.4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}>
                  {project.description}
                </p>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 'auto', flexWrap: 'wrap' }}>
                <span className="neon-badge">
                  <IconPhoto size={11} />
                  {project.image_count} imagens
                </span>
                <span className="neon-badge neon-badge--green">
                  <IconTag size={11} />
                  {project.annotation_count} anotacoes
                </span>
                {isAdmin && (
                  <span className="neon-badge" style={{
                    background: 'rgba(0,240,255,0.08)',
                    border: '1px solid rgba(0,240,255,0.2)',
                    color: 'var(--neon-cyan)',
                  }}>
                    <IconUsers size={11} />
                    {project.member_count} membros
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Novo Projeto"
        centered
        size="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '8px 0' }}>
          <div className="neon-input">
            <label>Nome do Projeto</label>
            <input
              placeholder="Ex: Dataset Carros"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </div>
          <div className="neon-input">
            <label>Descricao</label>
            <textarea
              placeholder="Descricao opcional do projeto..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>
          <button className="neon-btn neon-btn--solid" onClick={handleCreate} style={{ width: '100%' }}>
            Criar Projeto
          </button>
        </div>
      </Modal>
    </div>
  );
}
