import client from './client';
import { Annotation, Vertex } from '../types/api';

export async function listAnnotations(projectId: string, imageId: string): Promise<Annotation[]> {
  const res = await client.get(`/api/projects/${projectId}/images/${imageId}/annotations`);
  return res.data;
}

export async function createAnnotation(
  projectId: string,
  imageId: string,
  classId: string,
  vertices: Vertex[]
): Promise<Annotation> {
  const res = await client.post(`/api/projects/${projectId}/images/${imageId}/annotations`, {
    class_id: classId,
    vertices,
  });
  return res.data;
}

export async function bulkSaveAnnotations(
  projectId: string,
  imageId: string,
  annotations: { class_id: string; vertices: Vertex[] }[]
): Promise<Annotation[]> {
  const res = await client.put(`/api/projects/${projectId}/images/${imageId}/annotations`, {
    annotations,
  });
  return res.data;
}

export async function deleteAnnotation(
  projectId: string,
  imageId: string,
  annotationId: string
): Promise<void> {
  await client.delete(`/api/projects/${projectId}/images/${imageId}/annotations/${annotationId}`);
}
