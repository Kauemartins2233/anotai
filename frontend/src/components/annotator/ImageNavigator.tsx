import { IconChevronLeft, IconChevronRight, IconCheck } from '@tabler/icons-react';
import { ImageData } from '../../types/api';

interface Props {
  images: ImageData[];
  currentIndex: number;
  onNavigate: (index: number) => void;
}

export function ImageNavigator({ images, currentIndex, onNavigate }: Props) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      padding: '8px 16px',
      borderTop: '1px solid var(--border-subtle)',
      background: 'var(--bg-surface)',
    }}>
      <button
        className="neon-btn"
        style={{ padding: '4px 12px', fontSize: '0.6rem' }}
        disabled={currentIndex <= 0}
        onClick={() => onNavigate(currentIndex - 1)}
      >
        <IconChevronLeft size={12} />
        Anterior
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          color: 'var(--text-primary)',
        }}>
          <span style={{ color: 'var(--neon-cyan)' }}>{currentIndex + 1}</span>
          <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>/</span>
          {images.length}
        </span>
        {images[currentIndex]?.annotation_count > 0 && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            padding: '1px 6px',
            background: 'rgba(57, 255, 20, 0.1)',
            border: '1px solid rgba(57, 255, 20, 0.2)',
            borderRadius: 2,
            color: 'var(--neon-green)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.55rem',
          }}>
            <IconCheck size={9} />
            anotado
          </span>
        )}
      </div>

      <button
        className="neon-btn"
        style={{ padding: '4px 12px', fontSize: '0.6rem' }}
        disabled={currentIndex >= images.length - 1}
        onClick={() => onNavigate(currentIndex + 1)}
      >
        Proximo
        <IconChevronRight size={12} />
      </button>
    </div>
  );
}
