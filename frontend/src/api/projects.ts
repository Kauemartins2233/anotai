import client from './client';
import { Project, ProjectClass, ProjectMember } from '../types/api';

export async function listProjects(): Promise<Project[]> {
  const res = await client.get('/api/projects');
  return res.data;
}

export async function createProject(name: string, description?: string): Promise<Project> {
  const res = await client.post('/api/projects', { name, description });
  return res.data;
}

export async function getProject(id: string): Promise<Project> {
  const res = await client.get(`/api/projects/${id}`);
  return res.data;
}

export async function deleteProject(id: string): Promise<void> {
  await client.delete(`/api/projects/${id}`);
}

export async function listClasses(projectId: string): Promise<ProjectClass[]> {
  const res = await client.get(`/api/projects/${projectId}/classes`);
  return res.data;
}

export async function createClass(projectId: string, name: string, color: string): Promise<ProjectClass> {
  const res = await client.post(`/api/projects/${projectId}/classes`, { name, color });
  return res.data;
}

export async function updateClass(projectId: string, classId: string, data: { name?: string; color?: string }): Promise<ProjectClass> {
  const res = await client.put(`/api/projects/${projectId}/classes/${classId}`, data);
  return res.data;
}

export async function deleteClass(projectId: string, classId: string): Promise<void> {
  await client.delete(`/api/projects/${projectId}/classes/${classId}`);
}

// Members
export async function listMembers(projectId: string): Promise<ProjectMember[]> {
  const res = await client.get(`/api/projects/${projectId}/members`);
  return res.data;
}

export async function addMember(projectId: string, userId: string, role = 'annotator'): Promise<ProjectMember> {
  const res = await client.post(`/api/projects/${projectId}/members`, { user_id: userId, role });
  return res.data;
}

export async function removeMember(projectId: string, userId: string): Promise<void> {
  await client.delete(`/api/projects/${projectId}/members/${userId}`);
}
