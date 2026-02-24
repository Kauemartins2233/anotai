import client from './client';
import { User } from '../types/api';

export async function listUsers(): Promise<User[]> {
  const res = await client.get('/api/admin/users');
  return res.data;
}

export async function createUser(email: string, username: string, password: string): Promise<User> {
  const res = await client.post('/api/admin/users', { email, username, password });
  return res.data;
}

export async function updateUser(userId: string, data: { is_active?: boolean; is_admin?: boolean }): Promise<User> {
  const res = await client.patch(`/api/admin/users/${userId}`, data);
  return res.data;
}
