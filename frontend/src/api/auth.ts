import client from './client';
import { User, TokenResponse } from '../types/api';

export async function login(email: string, password: string): Promise<TokenResponse> {
  const res = await client.post('/api/auth/login', { email, password });
  return res.data;
}

export async function getMe(): Promise<User> {
  const res = await client.get('/api/auth/me');
  return res.data;
}
