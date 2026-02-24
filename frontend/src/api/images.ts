import client from './client';
import { ImageData, AssignmentStatsItem } from '../types/api';

export async function listImages(projectId: string, skip = 0, limit = 1000): Promise<ImageData[]> {
  const res = await client.get(`/api/projects/${projectId}/images`, { params: { skip, limit } });
  return res.data;
}

export async function uploadImages(projectId: string, files: File[]): Promise<ImageData[]> {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }
  const res = await client.post(`/api/projects/${projectId}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function deleteImage(projectId: string, imageId: string): Promise<void> {
  await client.delete(`/api/projects/${projectId}/images/${imageId}`);
}

export function getImageFileUrl(projectId: string, imageId: string): string {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  return `${baseUrl}/api/projects/${projectId}/images/${imageId}/file`;
}

export function getThumbnailUrl(projectId: string, imageId: string): string {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  return `${baseUrl}/api/projects/${projectId}/images/${imageId}/thumbnail`;
}

// Assignment
export async function assignImages(projectId: string, userId: string, imageIds: string[]): Promise<{ assigned: number }> {
  const res = await client.post(`/api/projects/${projectId}/images/assign`, { user_id: userId, image_ids: imageIds });
  return res.data;
}

export async function autoAssign(projectId: string, userIds: string[], countPerUser?: number): Promise<{ assigned: number }> {
  const res = await client.post(`/api/projects/${projectId}/images/auto-assign`, {
    user_ids: userIds,
    count_per_user: countPerUser ?? null,
  });
  return res.data;
}

export async function listUnassigned(projectId: string): Promise<ImageData[]> {
  const res = await client.get(`/api/projects/${projectId}/images/unassigned`);
  return res.data;
}

export async function getAssignmentStats(projectId: string): Promise<AssignmentStatsItem[]> {
  const res = await client.get(`/api/projects/${projectId}/images/stats`);
  return res.data;
}
