import { Vertex } from './api';

export interface LocalAnnotation {
  id: string;
  classId: string;
  vertices: Vertex[];
  isNew?: boolean;
}

export type ToolMode = 'draw' | 'edit' | 'pan';

export type DrawingState = 'idle' | 'drawing';
