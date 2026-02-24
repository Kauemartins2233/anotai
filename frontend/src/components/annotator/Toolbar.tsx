import { Tooltip } from '@mantine/core';
import {
  IconPencil,
  IconPointer,
  IconHandStop,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconTrash,
  IconDeviceFloppy,
  IconZoomIn,
  IconZoomOut,
} from '@tabler/icons-react';
import { useAnnotationStore } from '../../store/annotationStore';
import { ToolMode } from '../../types/annotation';

export function Toolbar() {
  const {
    activeTool,
    setActiveTool,
    undo,
    redo,
    undoStack,
    redoStack,
    deleteSelectedAnnotation,
    selectedAnnotationId,
    saveAnnotations,
    isDirty,
    stageScale,
    setStageScale,
  } = useAnnotationStore();

  const tools: { tool: ToolMode; icon: React.ReactNode; label: string }[] = [
    { tool: 'draw', icon: <IconPencil size={17} />, label: 'Desenhar (D)' },
    { tool: 'edit', icon: <IconPointer size={17} />, label: 'Editar (E)' },
    { tool: 'pan', icon: <IconHandStop size={17} />, label: 'Pan (Space)' },
  ];

  const ToolButton = ({ icon, label, active, disabled, onClick, color }: {
    icon: React.ReactNode; label: string; active?: boolean; disabled?: boolean;
    onClick: () => void; color?: string;
  }) => (
    <Tooltip label={label} position="right">
      <button
        onClick={onClick}
        disabled={disabled}
        style={{
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: active ? '1px solid var(--neon-cyan)' : '1px solid transparent',
          borderRadius: 4,
          background: active ? 'rgba(0, 240, 255, 0.1)' : 'transparent',
          color: disabled ? 'var(--text-muted)' : (color || (active ? 'var(--neon-cyan)' : 'var(--text-secondary)')),
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          boxShadow: active ? '0 0 8px rgba(0,240,255,0.2)' : 'none',
          opacity: disabled ? 0.3 : 1,
        }}
        onMouseEnter={(e) => {
          if (!disabled && !active) {
            e.currentTarget.style.background = 'rgba(0, 240, 255, 0.05)';
            e.currentTarget.style.color = 'var(--neon-cyan)';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && !active) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = color || 'var(--text-secondary)';
          }
        }}
      >
        {icon}
      </button>
    </Tooltip>
  );

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4,
      padding: '10px 6px',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-subtle)',
      width: 50,
      animation: 'slideInLeft 0.4s var(--ease-out-expo) both',
    }}>
      {tools.map(({ tool, icon, label }) => (
        <ToolButton
          key={tool}
          icon={icon}
          label={label}
          active={activeTool === tool}
          onClick={() => setActiveTool(tool)}
        />
      ))}

      <div className="neon-divider" style={{ margin: '4px 0', width: '80%' }} />

      <ToolButton icon={<IconZoomIn size={17} />} label="Zoom In" onClick={() => setStageScale(Math.min(stageScale * 1.2, 5))} />
      <ToolButton icon={<IconZoomOut size={17} />} label="Zoom Out" onClick={() => setStageScale(Math.max(stageScale / 1.2, 0.1))} />

      <div className="neon-divider" style={{ margin: '4px 0', width: '80%' }} />

      <ToolButton icon={<IconArrowBackUp size={17} />} label="Desfazer (Ctrl+Z)" disabled={undoStack.length === 0} onClick={undo} />
      <ToolButton icon={<IconArrowForwardUp size={17} />} label="Refazer (Ctrl+Shift+Z)" disabled={redoStack.length === 0} onClick={redo} />

      <div className="neon-divider" style={{ margin: '4px 0', width: '80%' }} />

      <ToolButton
        icon={<IconTrash size={17} />}
        label="Deletar selecionado"
        disabled={!selectedAnnotationId}
        onClick={deleteSelectedAnnotation}
        color="#ff5050"
      />

      <div style={{ flex: 1 }} />

      <Tooltip label={isDirty ? 'Salvar (Ctrl+S)' : 'Salvo'} position="right">
        <button
          onClick={saveAnnotations}
          style={{
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: isDirty ? '1px solid var(--neon-green)' : '1px solid transparent',
            borderRadius: 4,
            background: isDirty ? 'rgba(57, 255, 20, 0.1)' : 'transparent',
            color: isDirty ? 'var(--neon-green)' : 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.3s',
            boxShadow: isDirty ? '0 0 10px rgba(57,255,20,0.2)' : 'none',
            animation: isDirty ? 'glowPulse 2s ease-in-out infinite' : 'none',
          }}
        >
          <IconDeviceFloppy size={17} />
        </button>
      </Tooltip>
    </div>
  );
}
