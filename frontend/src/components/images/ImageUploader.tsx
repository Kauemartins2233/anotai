import { useCallback, useState } from 'react';
import { IconUpload, IconCloudUpload } from '@tabler/icons-react';
import { useProjectStore } from '../../store/projectStore';

interface Props {
  projectId: string;
}

export function ImageUploader({ projectId }: Props) {
  const { uploadImages } = useProjectStore();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
      if (fileArray.length === 0) return;
      setUploading(true);
      try {
        await uploadImages(projectId, fileArray);
      } catch (err) {
        console.error('Upload failed:', err);
      } finally {
        setUploading(false);
      }
    },
    [projectId, uploadImages]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      style={{
        padding: '32px 20px',
        textAlign: 'center',
        border: `1px dashed ${isDragging ? 'var(--neon-cyan)' : 'var(--border-default)'}`,
        borderRadius: 8,
        background: isDragging ? 'rgba(0, 240, 255, 0.03)' : 'var(--bg-card)',
        cursor: 'pointer',
        transition: 'all 0.3s var(--ease-out-expo)',
        position: 'relative',
        overflow: 'hidden',
      }}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = 'image/*';
        input.onchange = () => input.files && handleFiles(input.files);
        input.click();
      }}
    >
      {isDragging && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, rgba(0,240,255,0.05), transparent)',
          animation: 'fadeInScale 0.3s var(--ease-out-expo)',
        }} />
      )}

      {uploading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <div className="hex-loader" style={{ width: 24, height: 24 }} />
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.7rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--neon-cyan)',
          }}>
            Enviando...
          </span>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <IconCloudUpload
            size={36}
            color={isDragging ? 'var(--neon-cyan)' : 'var(--text-muted)'}
            style={{ transition: 'color 0.3s', marginBottom: 8 }}
          />
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.9rem',
            fontWeight: 500,
            color: 'var(--text-secondary)',
          }}>
            Arraste imagens aqui ou clique para selecionar
          </p>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            color: 'var(--text-muted)',
            marginTop: 6,
          }}>
            JPG, PNG, WEBP
          </p>
        </div>
      )}
    </div>
  );
}
