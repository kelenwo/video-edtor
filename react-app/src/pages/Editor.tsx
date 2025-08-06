import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { VideoPreview } from '../components/VideoPreview';
import { Timeline } from '../components/Timeline';
import { Sidebar } from '../components/Sidebar';
import { VideoEditorProvider } from '../context/VideoEditorContext';
import { useProjects } from '../context/ProjectsContext';
export const Editor = () => {
  const {
    projectId
  } = useParams<{
    projectId: string;
  }>();
  const {
    getProject
  } = useProjects();
  const navigate = useNavigate();
  // Get project data
  const project = getProject(projectId || '');
  // If project doesn't exist, redirect to landing page
  if (!project && projectId !== 'new') {
    return <Navigate to="/" replace />;
  }
  return <VideoEditorProvider initialProject={project}>
      <div className="flex flex-col w-full h-screen bg-gray-50">
        <Header onBackToHome={() => navigate('/')} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <VideoPreview />
            <Timeline />
          </div>
        </div>
      </div>
    </VideoEditorProvider>;
};