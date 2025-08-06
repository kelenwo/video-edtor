'use client'

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { selectProjectById } from '../../../redux/projectsSlice';
import { initializeProject } from '../../../redux/videoEditorSlice';
import { Header } from '../../../components/Header';
import { VideoPreview } from '../../../components/VideoPreview';
import { Timeline } from '../../../components/Timeline';
import { Sidebar } from '../../../components/Sidebar';

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const projectId = params.projectId as string;
  
  // Get project data from Redux store
  const project = useAppSelector(state => selectProjectById(state, projectId));
  
  useEffect(() => {
    if (projectId === 'new') {
      // Initialize new project
      dispatch(initializeProject({
        projectId: 'new',
        projectName: 'Untitled Project',
        duration: 60,
        mediaItems: []
      }));
    } else if (project) {
      // Initialize existing project
      dispatch(initializeProject({
        projectId: project.id,
        projectName: project.name,
        duration: project.duration,
        mediaItems: project.mediaItems || []
      }));
    } else if (projectId !== 'new') {
      // Project not found, redirect to home
      router.push('/');
      return;
    }
  }, [projectId, project, dispatch, router]);

  const handleBackToHome = () => {
    router.push('/');
  };

  return (
    <div className="flex flex-col w-full h-screen bg-gray-50">
      <Header onBackToHome={handleBackToHome} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <VideoPreview />
          <Timeline />
        </div>
      </div>
    </div>
  );
}