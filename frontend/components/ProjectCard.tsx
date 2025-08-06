'use client'

import React from 'react';
import { ClockIcon, StarIcon, MoreVerticalIcon, PlayIcon } from 'lucide-react';
import { Project } from '../redux/projectsSlice';

interface ProjectCardProps {
  project: Project;
  viewMode: 'grid' | 'list';
  onOpen: () => void;
}

export const ProjectCard = ({
  project,
  viewMode,
  onOpen
}: ProjectCardProps) => {
  if (viewMode === 'list') {
    return (
      <div 
        className="bg-white rounded-md border border-gray-200 p-3 flex items-center hover:shadow-md transition-shadow cursor-pointer" 
        onClick={onOpen}
      >
        <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden mr-4 flex-shrink-0">
          {project.thumbnail ? (
            <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-blue-100">
              <PlayIcon size={16} className="text-blue-600" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-800 truncate">{project.name}</h3>
          <div className="flex items-center text-xs text-gray-500 mt-1">
            <ClockIcon size={12} className="mr-1" />
            <span>{new Date(project.lastModified).toLocaleDateString()}</span>
          </div>
        </div>
        <button className="p-1 rounded-full hover:bg-gray-100">
          <MoreVerticalIcon size={16} className="text-gray-500" />
        </button>
      </div>
    );
  }

  return (
    <div 
      className="bg-white rounded-md border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer" 
      onClick={onOpen}
    >
      <div className="aspect-video bg-gray-200 relative">
        {project.thumbnail ? (
          <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-blue-100">
            <PlayIcon size={24} className="text-blue-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
          <button className="p-3 bg-white rounded-full">
            <PlayIcon size={16} className="text-gray-800" />
          </button>
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-800 truncate">{project.name}</h3>
          <button className="p-1 rounded-full hover:bg-gray-100">
            <MoreVerticalIcon size={16} className="text-gray-500" />
          </button>
        </div>
        <div className="flex items-center text-xs text-gray-500 mt-1">
          <ClockIcon size={12} className="mr-1" />
          <span>{new Date(project.lastModified).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};