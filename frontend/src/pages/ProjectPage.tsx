import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IconArrowLeft, IconDownload, IconPhoto } from '@tabler/icons-react';
import { useProjectStore } from '../store/projectStore';
import { useAuthStore } from '../store/authStore';
import { ClassManager } from '../components/projects/ClassManager';
import { MemberManager } from '../components/projects/MemberManager';
import { ImageAssigner } from '../components/projects/ImageAssigner';
import { ImageUploader } from '../components/images/ImageUploader';
import { ImageGrid } from '../components/images/ImageGrid';
import { ExportModal } from '../components/export/ExportModal';
import { ImageData } from '../types/api';

export function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.is_admin ?? false;
  const {
    currentProject,
    images,
    loading,
    setCurrentProject,
    fetchClasses,
    fetchImages,
    deleteImage,
  } = useProjectStore();
  const [exportOpen, setExportOpen] = useState(false);
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    import('../api/projects').then(({ getProject }) =>
      getProject(projectId).then((p) => setCurrentProject(p))
    );
    fetchClasses(projectId);
    fetchImages(projectId);
  }, [projectId, fetchClasses, fetchImages, setCurrentProject]);

  const handleImageClick = (image: ImageData) => {
    if (selectionMode && isAdmin) {
      setSelectedImageIds((prev) => {
        const next = new Set(prev);
        if (next.has(image.id)) next.delete(image.id);
        else next.add(image.id);
        return next;
      });
      return;
    }
    navigate(`/projects/${projectId}/annotate/${image.id}`);
  };

  if (loading && !currentProject) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
        <div className="hex-loader" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', animation: 'fadeInUp 0.6s var(--ease-out-expo) both' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <button
          className="neon-btn"
          style={{ padding: '6px 12px', fontSize: '0.65rem' }}
          onClick={() => navigate('/')}
        >
          <IconArrowLeft size={13} />
          Voltar
        </button>
        <div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            margin: 0,
          }}>
            {currentProject?.name}
          </h2>
          {currentProject?.description && (
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              marginTop: 4,
            }}>
              {currentProject.description}
            </p>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Left sidebar */}
        <div style={{ animation: 'slideInLeft 0.6s var(--ease-out-expo) both 0.1s' }}>
          <ClassManager projectId={projectId!} readOnly={!isAdmin} />

          {isAdmin && (
            <>
              <MemberManager projectId={projectId!} />
              <ImageAssigner projectId={projectId!} totalImages={images.length} />
            </>
          )}
        </div>

        {/* Right: Upload + Images */}
        <div style={{ animation: 'slideInRight 0.6s var(--ease-out-expo) both 0.1s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="section-label" style={{ margin: 0 }}>
                <IconPhoto size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                Imagens
              </span>
              <span className="neon-badge">{images.length}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {isAdmin && (
                <>
                  <button
                    className={`neon-btn ${selectionMode ? 'neon-btn--solid' : ''}`}
                    style={{ padding: '6px 14px', fontSize: '0.6rem' }}
                    onClick={() => {
                      setSelectionMode(!selectionMode);
                      setSelectedImageIds(new Set());
                    }}
                  >
                    {selectionMode ? `${selectedImageIds.size} selecionadas` : 'Selecionar'}
                  </button>
                  <button
                    className="neon-btn neon-btn--green"
                    style={{ padding: '6px 14px', fontSize: '0.6rem' }}
                    onClick={() => setExportOpen(true)}
                  >
                    <IconDownload size={13} />
                    Exportar YOLO
                  </button>
                </>
              )}
            </div>
          </div>

          {isAdmin && <ImageUploader projectId={projectId!} />}

          <div className="neon-divider" style={{ margin: '20px 0' }} />

          <ImageGrid
            projectId={projectId!}
            images={images}
            onImageClick={handleImageClick}
            onDelete={isAdmin ? (imageId) => deleteImage(projectId!, imageId) : undefined}
            isAdmin={isAdmin}
            selectionMode={selectionMode}
            selectedImageIds={selectedImageIds}
            onSelectionChange={setSelectedImageIds}
          />
        </div>
      </div>

      {isAdmin && (
        <ExportModal
          projectId={projectId!}
          opened={exportOpen}
          onClose={() => setExportOpen(false)}
        />
      )}
    </div>
  );
}
