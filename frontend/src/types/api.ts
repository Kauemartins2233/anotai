export interface User {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  image_count: number;
  annotation_count: number;
  member_count: number;
}

export interface ProjectClass {
  id: string;
  project_id: string;
  name: string;
  class_index: number;
  color: string;
}

export interface ProjectMember {
  user_id: string;
  username: string;
  email: string;
  role: string;
  joined_at: string;
}

export interface ImageData {
  id: string;
  project_id: string;
  filename: string;
  width: number;
  height: number;
  file_size: number;
  dataset_split: string | null;
  uploaded_at: string;
  annotation_count: number;
  assigned_to: string | null;
}

export interface Vertex {
  x: number;
  y: number;
}

export interface Annotation {
  id: string;
  image_id: string;
  class_id: string;
  vertices: Vertex[];
  created_by: string;
  created_at: string;
}

export interface AssignmentStatsItem {
  user_id: string;
  username: string;
  assigned: number;
  annotated: number;
}
