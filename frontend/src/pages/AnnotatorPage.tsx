import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IconArrowLeft } from '@tabler/icons-react';
import { AnnotationCanvas } from '../components/annotator/AnnotationCanvas';
import { Toolbar } from '../components/annotator/Toolbar';
import { ClassSelector } from '../components/annotator/ClassSelector';
import { AnnotationList } from '../components/annotator/AnnotationList';
import { ImageNavigator } from '../components/annotator/ImageNavigator';
import { useAnnotationStore } from '../store/annotationStore';
import { useProjectStore } from '../store/projectStore';
import { getImageFileUrl } from '../api/images';

export function AnnotatorPage() {
  const { projectId, imageId } = useParams<{ projectId: string; imageId: string }>();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [loading, setLoading] = useState(true);

  const { images, fetchImages, fetchClasses } = useProjectStore();
  const { loadAnnotations, reset } = useAnnotationStore();

  const currentIndex = images.findIndex((img) => img.id === imageId);
  const token = localStorage.getItem('access_token');
  const imageUrl = projectId && imageId
    ? `${getImageFileUrl(projectId, imageId)}?token=${token}`
    : '';

  useEffect(() => {
    if (!projectId) return;
    fetchClasses(projectId);
    fetchImages(projectId);
  }, [projectId, fetchClasses, fetchImages]);

  useEffect(() => {
    if (!projectId || !imageId) return;
    setLoading(true);
    loadAnnotations(projectId, imageId).finally(() => setLoading(false));
  }, [projectId, imageId, loadAnnotations]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => reset();
  }, [reset]);

  const handleNavigate = useCallback(
    (index: number) => {
      if (index >= 0 && index < images.length) {
        navigate(`/projects/${projectId}/annotate/${images[index].id}`);
      }
    },
    [images, projectId, navigate]
  );

  if (loading && images.length === 0) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-void)',
      }}>
        <div className="hex-loader" />
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: 'var(--bg-void)',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '8px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(5, 6, 10, 0.9)',
        backdropFilter: 'blur(12px)',
        animation: 'fadeInDown 0.4s var(--ease-out-expo) both',
        position: 'relative',
        zIndex: 10,
      }}>
        {/* Neon bottom accent */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(0,240,255,0.15), transparent)',
        }} />

        <button
          className="neon-btn"
          style={{ padding: '4px 10px', fontSize: '0.6rem' }}
          onClick={() => navigate(`/projects/${projectId}`)}
        >
          <IconArrowLeft size={12} />
          Projeto
        </button>

        <div style={{
          width: 1,
          height: 20,
          background: 'var(--border-subtle)',
        }} />

        <div className="anotai-logo" style={{ fontSize: '0.85rem' }}>
          <span className="logo-anot">anot</span>
          <span className="logo-ai">AI</span>
        </div>

        <div style={{ flex: 1 }} />

        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.65rem',
          color: 'var(--text-muted)',
          letterSpacing: '0.05em',
        }}>
          {images[currentIndex]?.filename}
        </span>
      </div>

      {/* Main area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left toolbar */}
        <Toolbar />

        {/* Canvas */}
        <div
          ref={containerRef}
          style={{
            flex: 1,
            overflow: 'hidden',
            background: 'var(--bg-deep)',
            position: 'relative',
          }}
        >
          {/* Corner markers */}
          <div style={{
            position: 'absolute', top: 8, left: 8, width: 16, height: 16,
            borderTop: '1px solid rgba(0,240,255,0.15)', borderLeft: '1px solid rgba(0,240,255,0.15)',
            zIndex: 2, pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', top: 8, right: 8, width: 16, height: 16,
            borderTop: '1px solid rgba(0,240,255,0.15)', borderRight: '1px solid rgba(0,240,255,0.15)',
            zIndex: 2, pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: 8, left: 8, width: 16, height: 16,
            borderBottom: '1px solid rgba(0,240,255,0.15)', borderLeft: '1px solid rgba(0,240,255,0.15)',
            zIndex: 2, pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: 8, right: 8, width: 16, height: 16,
            borderBottom: '1px solid rgba(0,240,255,0.15)', borderRight: '1px solid rgba(0,240,255,0.15)',
            zIndex: 2, pointerEvents: 'none',
          }} />

          <AnnotationCanvas
            imageUrl={imageUrl}
            containerWidth={containerSize.width}
            containerHeight={containerSize.height}
          />
        </div>

        {/* Right sidebar */}
        <div style={{
          width: 200,
          borderLeft: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
          overflowY: 'auto',
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          animation: 'slideInRight 0.4s var(--ease-out-expo) both',
        }}>
          <ClassSelector />
          <div className="neon-divider" />
          <AnnotationList />
        </div>
      </div>

      {/* Bottom navigator */}
      <ImageNavigator
        images={images}
        currentIndex={currentIndex}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
