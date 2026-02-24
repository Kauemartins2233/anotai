import { IconTrash, IconPolygon } from '@tabler/icons-react';
import { useAnnotationStore } from '../../store/annotationStore';
import { useProjectStore } from '../../store/projectStore';

export function AnnotationList() {
  const {
    annotations,
    selectedAnnotationId,
    selectAnnotation,
    deleteSelectedAnnotation,
  } = useAnnotationStore();
  const { classes } = useProjectStore();

  const classMap = Object.fromEntries(classes.map((c) => [c.id, c]));

  return (
    <div>
      <div className="section-label">
        Anotacoes
        <span style={{
          marginLeft: 8,
          fontFamily: 'var(--font-mono)',
          color: 'var(--neon-cyan)',
        }}>
          {annotations.length}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {annotations.map((ann, i) => {
          const cls = classMap[ann.classId];
          const isSelected = selectedAnnotationId === ann.id;
          return (
            <button
              key={ann.id}
              onClick={() => selectAnnotation(ann.id)}
              className="stagger-item"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '5px 8px',
                borderRadius: 3,
                border: isSelected ? `1px solid ${cls?.color || 'var(--border-glow)'}` : '1px solid var(--border-subtle)',
                background: isSelected ? `${cls?.color || 'var(--neon-cyan)'}10` : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                width: '100%',
                animationDelay: `${i * 0.03}s`,
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: cls?.color || '#999',
                  boxShadow: isSelected ? `0 0 4px ${cls?.color}` : 'none',
                }} />
                <span style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}>
                  {cls?.name || '?'} #{i + 1}
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.55rem',
                  color: 'var(--text-muted)',
                }}>
                  {ann.vertices.length}v
                </span>
              </div>
              {isSelected && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSelectedAnnotation();
                  }}
                  style={{
                    color: '#ff5050',
                    cursor: 'pointer',
                    display: 'flex',
                  }}
                >
                  <IconTrash size={11} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
