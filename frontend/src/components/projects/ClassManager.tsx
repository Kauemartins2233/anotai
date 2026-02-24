import { useState } from 'react';
import { ColorInput } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useProjectStore } from '../../store/projectStore';
import { getNextColor } from '../../utils/colors';

interface Props {
  projectId: string;
  readOnly?: boolean;
}

export function ClassManager({ projectId, readOnly }: Props) {
  const { classes, createClass, deleteClass } = useProjectStore();
  const [name, setName] = useState('');
  const [color, setColor] = useState(() => getNextColor([]));

  const handleAdd = async () => {
    if (!name.trim()) return;
    await createClass(projectId, name.trim(), color);
    setName('');
    setColor(getNextColor(classes.map((c) => c.color)));
  };

  return (
    <div className="glass-panel" style={{ padding: 20, marginBottom: 20 }}>
      <div className="section-label">Classes</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {classes.map((cls, i) => (
          <div key={cls.id} className="stagger-item" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 4,
            animationDelay: `${i * 0.05}s`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                background: cls.color,
                boxShadow: `0 0 8px ${cls.color}40`,
              }} />
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}>
                {cls.name}
              </span>
              <span className="neon-badge" style={{ fontSize: '0.6rem', padding: '1px 6px' }}>
                {cls.class_index}
              </span>
            </div>
            {!readOnly && (
              <button
                onClick={() => deleteClass(projectId, cls.id)}
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
                <IconTrash size={13} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add class (admin only) */}
      {!readOnly && (
        <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'flex-end' }}>
          <div className="neon-input" style={{ flex: 1 }}>
            <input
              placeholder="Nome da classe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              style={{ padding: '7px 10px', fontSize: '0.85rem' }}
            />
          </div>
          <ColorInput
            size="xs"
            value={color}
            onChange={setColor}
            w={70}
            withEyeDropper={false}
            styles={{
              input: {
                background: 'var(--bg-elevated)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              },
            }}
          />
          <button
            className="neon-btn neon-btn--green"
            onClick={handleAdd}
            style={{ padding: '7px 10px' }}
          >
            <IconPlus size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
