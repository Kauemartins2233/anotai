import { useProjectStore } from '../../store/projectStore';
import { useAnnotationStore } from '../../store/annotationStore';

export function ClassSelector() {
  const { classes } = useProjectStore();
  const { activeClassId, setActiveClass } = useAnnotationStore();

  return (
    <div>
      <div className="section-label">Classe Ativa</div>
      {classes.length === 0 && (
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.65rem',
          color: 'var(--text-muted)',
          letterSpacing: '0.05em',
        }}>
          Adicione classes no projeto
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {classes.map((cls) => {
          const isActive = activeClassId === cls.id;
          return (
            <button
              key={cls.id}
              onClick={() => setActiveClass(cls.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 10px',
                borderRadius: 4,
                border: isActive ? `1px solid ${cls.color}` : '1px solid var(--border-subtle)',
                background: isActive ? `${cls.color}12` : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: isActive ? `0 0 10px ${cls.color}25` : 'none',
                textAlign: 'left',
                width: '100%',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.borderColor = 'var(--border-default)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
            >
              <div style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: cls.color,
                boxShadow: isActive ? `0 0 6px ${cls.color}` : 'none',
                transition: 'box-shadow 0.3s',
              }} />
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                flex: 1,
              }}>
                {cls.name}
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.55rem',
                color: 'var(--text-muted)',
              }}>
                {cls.class_index}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
