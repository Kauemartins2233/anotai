import { IconTrash, IconTag, IconUser } from '@tabler/icons-react';
import { ImageData } from '../../types/api';
import { getThumbnailUrl } from '../../api/images';

interface Props {
  projectId: string;
  images: ImageData[];
  onImageClick: (image: ImageData) => void;
  onDelete?: (imageId: string) => void;
  isAdmin?: boolean;
  selectionMode?: boolean;
  selectedImageIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
}

export function ImageGrid({ projectId, images, onImageClick, onDelete, isAdmin, selectionMode, selectedImageIds }: Props) {
  const token = localStorage.getItem('access_token');

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
      gap: 14,
    }}>
      {images.map((img, i) => {
        const isSelected = selectionMode && selectedImageIds?.has(img.id);
        return (
          <div
            key={img.id}
            className="stagger-item"
            style={{
              background: 'var(--bg-card)',
              border: `1px solid ${isSelected ? 'var(--neon-cyan)' : 'var(--border-subtle)'}`,
              borderRadius: 6,
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'all 0.3s var(--ease-out-expo)',
              animationDelay: `${i * 0.04}s`,
              position: 'relative',
              boxShadow: isSelected ? '0 0 12px rgba(0,240,255,0.2)' : 'none',
            }}
            onClick={() => onImageClick(img)}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.borderColor = 'var(--border-glow)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3), 0 0 15px rgba(0,240,255,0.1)';
              }
              e.currentTarget.style.transform = 'translateY(-3px)';
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.boxShadow = 'none';
              }
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {/* Selection checkbox */}
            {selectionMode && (
              <div style={{
                position: 'absolute',
                top: 6,
                left: 6,
                zIndex: 10,
                width: 20,
                height: 20,
                borderRadius: 4,
                background: isSelected ? 'var(--neon-cyan)' : 'rgba(0,0,0,0.6)',
                border: `1px solid ${isSelected ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.3)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isSelected ? '#000' : 'transparent',
                fontSize: '0.7rem',
                fontWeight: 700,
              }}>
                {isSelected && '\u2713'}
              </div>
            )}

            <div style={{
              height: 140,
              overflow: 'hidden',
              background: 'var(--bg-elevated)',
              position: 'relative',
            }}>
              <img
                src={`${getThumbnailUrl(projectId, img.id)}?token=${token}`}
                alt={img.filename}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.5s var(--ease-out-expo)',
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLImageElement).style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLImageElement).style.transform = 'scale(1)';
                }}
              />
              {/* Annotation badge overlay */}
              {img.annotation_count > 0 && (
                <div style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  padding: '2px 6px',
                  background: 'rgba(57, 255, 20, 0.15)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(57, 255, 20, 0.3)',
                  borderRadius: 3,
                  color: 'var(--neon-green)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.6rem',
                  fontWeight: 500,
                }}>
                  <IconTag size={9} />
                  {img.annotation_count}
                </div>
              )}
              {/* Assigned-to badge (admin only) */}
              {isAdmin && img.assigned_to && (
                <div style={{
                  position: 'absolute',
                  bottom: 6,
                  left: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  padding: '2px 6px',
                  background: 'rgba(0,240,255,0.12)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(0,240,255,0.25)',
                  borderRadius: 3,
                  color: 'var(--neon-cyan)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.55rem',
                  fontWeight: 500,
                }}>
                  <IconUser size={8} />
                  {img.assigned_to}
                </div>
              )}
            </div>

            <div style={{
              padding: '8px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                color: 'var(--text-secondary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
              }}>
                {img.filename}
              </span>
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(img.id);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: 2,
                    marginLeft: 6,
                    transition: 'color 0.3s',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ff5050')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <IconTrash size={12} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
