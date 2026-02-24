import client from './client';

export async function splitDataset(projectId: string, trainRatio = 0.8): Promise<void> {
  await client.post(`/api/projects/${projectId}/export/split`, { train_ratio: trainRatio });
}

export async function downloadExport(projectId: string): Promise<Blob> {
  const res = await client.post(`/api/projects/${projectId}/export/download`, {}, {
    responseType: 'blob',
  });
  return res.data;
}
