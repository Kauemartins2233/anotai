import { useState } from 'react';
import { Modal, Slider } from '@mantine/core';
import { IconDownload, IconRefresh, IconCheck } from '@tabler/icons-react';
import { splitDataset, downloadExport } from '../../api/export';

interface Props {
  projectId: string;
  opened: boolean;
  onClose: () => void;
}

export function ExportModal({ projectId, opened, onClose }: Props) {
  const [trainRatio, setTrainRatio] = useState(80);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'split' | 'download'>('split');

  const handleSplit = async () => {
    setLoading(true);
    try {
      await splitDataset(projectId, trainRatio / 100);
      setStep('download');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      const blob = await downloadExport(projectId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dataset.zip';
      a.click();
      window.URL.revokeObjectURL(url);
      onClose();
      setStep('split');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Exportar Dataset" centered size="sm">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '8px 0' }}>
        {step === 'split' ? (
          <>
            <div className="section-label" style={{ margin: 0 }}>Proporcao Treino / Validacao</div>
            <Slider
              value={trainRatio}
              onChange={setTrainRatio}
              min={50}
              max={95}
              step={5}
              marks={[
                { value: 50, label: '50%' },
                { value: 70, label: '70%' },
                { value: 80, label: '80%' },
                { value: 90, label: '90%' },
              ]}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 20,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              marginTop: 4,
            }}>
              <span style={{ color: 'var(--neon-cyan)' }}>{trainRatio}% treino</span>
              <span style={{ color: 'var(--text-muted)' }}>|</span>
              <span style={{ color: 'var(--neon-magenta)' }}>{100 - trainRatio}% validacao</span>
            </div>
            <button
              className={`neon-btn neon-btn--solid ${loading ? 'neon-btn--loading' : ''}`}
              onClick={handleSplit}
              disabled={loading}
              style={{ width: '100%' }}
            >
              {!loading && 'Dividir Dataset'}
            </button>
          </>
        ) : (
          <>
            <div style={{
              padding: '14px 16px',
              background: 'rgba(57, 255, 20, 0.05)',
              border: '1px solid rgba(57, 255, 20, 0.2)',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              <IconCheck size={16} color="var(--neon-green)" />
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.85rem',
                fontWeight: 500,
                color: 'var(--neon-green)',
              }}>
                Dataset dividido com sucesso!
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className={`neon-btn neon-btn--green ${loading ? 'neon-btn--loading' : ''}`}
                onClick={handleDownload}
                disabled={loading}
                style={{ flex: 1 }}
              >
                {!loading && <><IconDownload size={13} /> Baixar ZIP</>}
              </button>
              <button
                className="neon-btn"
                onClick={() => setStep('split')}
                style={{ padding: '8px 14px' }}
              >
                <IconRefresh size={13} />
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
