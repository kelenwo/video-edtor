import React, { useState, createContext, useContext } from 'react';
export interface Project {
  id: string;
  name: string;
  thumbnail?: string;
  lastModified: number;
  duration: number;
  mediaItems?: any[];
}
interface ProjectsContextType {
  projects: Project[];
  addProject: (project: Omit<Project, 'id'>) => string;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  getProject: (id: string) => Project | undefined;
}
const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);
export const useProjects = () => {
  const context = useContext(ProjectsContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectsProvider');
  }
  return context;
};
export const ProjectsProvider = ({
  children
}: {
  children: ReactNode;
}) => {
  const [projects, setProjects] = useState<Project[]>([{
    id: '1',
    name: 'Product Showcase',
    thumbnail: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8dmlkZW8lMjBlZGl0aW5nfGVufDB8fDB8fHww',
    lastModified: Date.now() - 86400000 * 2,
    duration: 45
  }, {
    id: '2',
    name: 'Travel Vlog - Japan',
    thumbnail: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8dmlkZW8lMjBlZGl0aW5nfGVufDB8fDB8fHww',
    lastModified: Date.now() - 86400000 * 5,
    duration: 120
  }, {
    id: '3',
    name: 'Social Media Ad',
    thumbnail: 'https://images.unsplash.com/photo-1574717024453-354056cb8514?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dmlkZW8lMjBlZGl0aW5nfGVufDB8fDB8fHww',
    lastModified: Date.now() - 86400000 * 1,
    duration: 30
  }, {
    id: '4',
    name: 'Tutorial - After Effects',
    thumbnail: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHZpZGVvJTIwZWRpdGluZ3xlbnwwfHwwfHx8MA%3D%3D',
    lastModified: Date.now() - 86400000 * 10,
    duration: 600
  }, {
    id: '5',
    name: 'Wedding Highlights',
    lastModified: Date.now() - 86400000 * 3,
    duration: 180
  }]);
  const addProject = (project: Omit<Project, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setProjects([...projects, {
      ...project,
      id
    }]);
    return id;
  };
  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(projects.map(project => project.id === id ? {
      ...project,
      ...updates
    } : project));
  };
  const deleteProject = (id: string) => {
    setProjects(projects.filter(project => project.id !== id));
  };
  const getProject = (id: string) => {
    return projects.find(project => project.id === id);
  };
  return <ProjectsContext.Provider value={{
    projects,
    addProject,
    updateProject,
    deleteProject,
    getProject
  }}>
      {children}
    </ProjectsContext.Provider>;
};