import { create } from 'zustand';
import { Project, ProjectClass, ImageData } from '../types/api';
import * as projectApi from '../api/projects';
import * as imageApi from '../api/images';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  classes: ProjectClass[];
  images: ImageData[];
  loading: boolean;

  fetchProjects: () => Promise<void>;
  createProject: (name: string, description?: string) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (project: Project) => void;
  fetchClasses: (projectId: string) => Promise<void>;
  createClass: (projectId: string, name: string, color: string) => Promise<ProjectClass>;
  deleteClass: (projectId: string, classId: string) => Promise<void>;
  fetchImages: (projectId: string) => Promise<void>;
  uploadImages: (projectId: string, files: File[]) => Promise<void>;
  deleteImage: (projectId: string, imageId: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  classes: [],
  images: [],
  loading: false,

  fetchProjects: async () => {
    set({ loading: true });
    const projects = await projectApi.listProjects();
    set({ projects, loading: false });
  },

  createProject: async (name, description) => {
    const project = await projectApi.createProject(name, description);
    set((s) => ({ projects: [project, ...s.projects] }));
    return project;
  },

  deleteProject: async (id) => {
    await projectApi.deleteProject(id);
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
  },

  setCurrentProject: (project) => set({ currentProject: project }),

  fetchClasses: async (projectId) => {
    const classes = await projectApi.listClasses(projectId);
    set({ classes });
  },

  createClass: async (projectId, name, color) => {
    const cls = await projectApi.createClass(projectId, name, color);
    set((s) => ({ classes: [...s.classes, cls] }));
    return cls;
  },

  deleteClass: async (projectId, classId) => {
    await projectApi.deleteClass(projectId, classId);
    set((s) => ({ classes: s.classes.filter((c) => c.id !== classId) }));
  },

  fetchImages: async (projectId) => {
    set({ loading: true });
    const images = await imageApi.listImages(projectId);
    set({ images, loading: false });
  },

  uploadImages: async (projectId, files) => {
    const newImages = await imageApi.uploadImages(projectId, files);
    set((s) => ({ images: [...newImages, ...s.images] }));
  },

  deleteImage: async (projectId, imageId) => {
    await imageApi.deleteImage(projectId, imageId);
    set((s) => ({ images: s.images.filter((i) => i.id !== imageId) }));
  },
}));
