import { create } from 'zustand';
import { Vertex } from '../types/api';
import { LocalAnnotation, ToolMode, DrawingState } from '../types/annotation';
import * as annotationApi from '../api/annotations';
import { pixelToNormalized } from '../utils/coordinates';

interface AnnotationState {
  // Current editing session
  currentImageId: string | null;
  currentProjectId: string | null;
  annotations: LocalAnnotation[];
  drawingVertices: Vertex[];
  drawingState: DrawingState;
  selectedAnnotationId: string | null;
  selectedVertexIndex: number | null;
  activeClassId: string | null;

  // Undo/redo
  undoStack: LocalAnnotation[][];
  redoStack: LocalAnnotation[][];

  // Canvas state
  stageScale: number;
  stagePosition: { x: number; y: number };

  // Tool mode
  activeTool: ToolMode;

  // Dirty tracking
  isDirty: boolean;

  // Image dimensions
  imageWidth: number;
  imageHeight: number;

  // Actions
  setImageDimensions: (w: number, h: number) => void;
  setActiveTool: (tool: ToolMode) => void;
  setActiveClass: (classId: string | null) => void;
  setStageScale: (scale: number) => void;
  setStagePosition: (pos: { x: number; y: number }) => void;

  // Drawing
  addDrawingVertex: (pixelX: number, pixelY: number) => void;
  closePolygon: () => void;
  cancelDrawing: () => void;

  // Selection
  selectAnnotation: (id: string | null) => void;
  selectVertex: (index: number | null) => void;

  // Editing
  moveVertex: (annotationId: string, vertexIndex: number, pixelX: number, pixelY: number) => void;
  deleteSelectedAnnotation: () => void;
  deleteSelectedVertex: () => void;
  changeAnnotationClass: (annotationId: string, classId: string) => void;

  // Undo/redo
  undo: () => void;
  redo: () => void;

  // Server sync
  loadAnnotations: (projectId: string, imageId: string) => Promise<void>;
  saveAnnotations: () => Promise<void>;
  reset: () => void;
}

function generateId(): string {
  return crypto.randomUUID();
}

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
  currentImageId: null,
  currentProjectId: null,
  annotations: [],
  drawingVertices: [],
  drawingState: 'idle',
  selectedAnnotationId: null,
  selectedVertexIndex: null,
  activeClassId: null,
  undoStack: [],
  redoStack: [],
  stageScale: 1,
  stagePosition: { x: 0, y: 0 },
  activeTool: 'draw',
  isDirty: false,
  imageWidth: 1,
  imageHeight: 1,

  setImageDimensions: (w, h) => set({ imageWidth: w, imageHeight: h }),
  setActiveTool: (tool) => set({ activeTool: tool, selectedAnnotationId: null, selectedVertexIndex: null }),
  setActiveClass: (classId) => set({ activeClassId: classId }),
  setStageScale: (scale) => set({ stageScale: scale }),
  setStagePosition: (pos) => set({ stagePosition: pos }),

  addDrawingVertex: (pixelX, pixelY) => {
    const { imageWidth, imageHeight, drawingVertices, drawingState, activeClassId } = get();
    if (!activeClassId) return;

    const vertex = pixelToNormalized(pixelX, pixelY, imageWidth, imageHeight);

    // Check if clicking near first vertex to close polygon
    if (drawingState === 'drawing' && drawingVertices.length >= 3) {
      const first = drawingVertices[0];
      const dx = (vertex.x - first.x) * imageWidth;
      const dy = (vertex.y - first.y) * imageHeight;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 10) {
        get().closePolygon();
        return;
      }
    }

    set({
      drawingVertices: [...drawingVertices, vertex],
      drawingState: 'drawing',
    });
  },

  closePolygon: () => {
    const { drawingVertices, activeClassId, annotations, undoStack } = get();
    if (drawingVertices.length < 3 || !activeClassId) return;

    const newAnnotation: LocalAnnotation = {
      id: generateId(),
      classId: activeClassId,
      vertices: [...drawingVertices],
      isNew: true,
    };

    set({
      undoStack: [...undoStack, structuredClone(annotations)].slice(-50),
      redoStack: [],
      annotations: [...annotations, newAnnotation],
      drawingVertices: [],
      drawingState: 'idle',
      isDirty: true,
    });
  },

  cancelDrawing: () => {
    set({
      drawingVertices: [],
      drawingState: 'idle',
      selectedAnnotationId: null,
      selectedVertexIndex: null,
    });
  },

  selectAnnotation: (id) => set({ selectedAnnotationId: id, selectedVertexIndex: null }),
  selectVertex: (index) => set({ selectedVertexIndex: index }),

  moveVertex: (annotationId, vertexIndex, pixelX, pixelY) => {
    const { annotations, undoStack, imageWidth, imageHeight } = get();
    const vertex = pixelToNormalized(pixelX, pixelY, imageWidth, imageHeight);

    const updated = annotations.map((ann) => {
      if (ann.id !== annotationId) return ann;
      const newVertices = [...ann.vertices];
      newVertices[vertexIndex] = vertex;
      return { ...ann, vertices: newVertices };
    });

    set({
      undoStack: [...undoStack, structuredClone(annotations)].slice(-50),
      redoStack: [],
      annotations: updated,
      isDirty: true,
    });
  },

  deleteSelectedAnnotation: () => {
    const { selectedAnnotationId, annotations, undoStack } = get();
    if (!selectedAnnotationId) return;

    set({
      undoStack: [...undoStack, structuredClone(annotations)].slice(-50),
      redoStack: [],
      annotations: annotations.filter((a) => a.id !== selectedAnnotationId),
      selectedAnnotationId: null,
      selectedVertexIndex: null,
      isDirty: true,
    });
  },

  deleteSelectedVertex: () => {
    const { selectedAnnotationId, selectedVertexIndex, annotations, undoStack } = get();
    if (!selectedAnnotationId || selectedVertexIndex === null) return;

    const ann = annotations.find((a) => a.id === selectedAnnotationId);
    if (!ann || ann.vertices.length <= 3) return;

    const updated = annotations.map((a) => {
      if (a.id !== selectedAnnotationId) return a;
      const newVertices = a.vertices.filter((_, i) => i !== selectedVertexIndex);
      return { ...a, vertices: newVertices };
    });

    set({
      undoStack: [...undoStack, structuredClone(annotations)].slice(-50),
      redoStack: [],
      annotations: updated,
      selectedVertexIndex: null,
      isDirty: true,
    });
  },

  changeAnnotationClass: (annotationId, classId) => {
    const { annotations, undoStack } = get();
    const updated = annotations.map((a) =>
      a.id === annotationId ? { ...a, classId } : a
    );
    set({
      undoStack: [...undoStack, structuredClone(annotations)].slice(-50),
      redoStack: [],
      annotations: updated,
      isDirty: true,
    });
  },

  undo: () => {
    const { undoStack, annotations, redoStack } = get();
    if (undoStack.length === 0) return;

    const previous = undoStack[undoStack.length - 1];
    set({
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, structuredClone(annotations)],
      annotations: previous,
      isDirty: true,
    });
  },

  redo: () => {
    const { redoStack, annotations, undoStack } = get();
    if (redoStack.length === 0) return;

    const next = redoStack[redoStack.length - 1];
    set({
      redoStack: redoStack.slice(0, -1),
      undoStack: [...undoStack, structuredClone(annotations)],
      annotations: next,
      isDirty: true,
    });
  },

  loadAnnotations: async (projectId, imageId) => {
    const state = get();
    if (state.isDirty && state.currentImageId) {
      await state.saveAnnotations();
    }

    const serverAnnotations = await annotationApi.listAnnotations(projectId, imageId);
    const localAnnotations: LocalAnnotation[] = serverAnnotations.map((a) => ({
      id: a.id,
      classId: a.class_id,
      vertices: a.vertices,
    }));

    set({
      currentProjectId: projectId,
      currentImageId: imageId,
      annotations: localAnnotations,
      drawingVertices: [],
      drawingState: 'idle',
      selectedAnnotationId: null,
      selectedVertexIndex: null,
      undoStack: [],
      redoStack: [],
      isDirty: false,
    });
  },

  saveAnnotations: async () => {
    const { currentProjectId, currentImageId, annotations, isDirty } = get();
    if (!currentProjectId || !currentImageId || !isDirty) return;

    await annotationApi.bulkSaveAnnotations(
      currentProjectId,
      currentImageId,
      annotations.map((a) => ({
        class_id: a.classId,
        vertices: a.vertices,
      }))
    );

    set({ isDirty: false });
  },

  reset: () => {
    set({
      currentImageId: null,
      currentProjectId: null,
      annotations: [],
      drawingVertices: [],
      drawingState: 'idle',
      selectedAnnotationId: null,
      selectedVertexIndex: null,
      activeClassId: null,
      undoStack: [],
      redoStack: [],
      stageScale: 1,
      stagePosition: { x: 0, y: 0 },
      activeTool: 'draw',
      isDirty: false,
    });
  },
}));
