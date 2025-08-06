'use client'

import React, { useState } from 'react';
import { ArrowLeftIcon, ArrowRightIcon, UndoIcon, RedoIcon, SaveIcon, UserIcon, DownloadIcon } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { selectProjectName, setProjectName } from '../redux/videoEditorSlice';

export const Header = ({
  onBackToHome
}: {
  onBackToHome?: () => void;
}) => {
  const dispatch = useAppDispatch();
  const projectName = useAppSelector(selectProjectName);
  const [isEditing, setIsEditing] = useState(false);

  const handleNameClick = () => {
    setIsEditing(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setProjectName(e.target.value));
  };

  const handleNameBlur = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 py-2 px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-blue-500 font-bold text-xl">VideoEditor</div>
          <div className="flex items-center space-x-2 ml-4">
            {onBackToHome && (
              <button 
                className="p-1 rounded hover:bg-gray-100 flex items-center text-sm text-gray-600" 
                onClick={onBackToHome}
              >
                <ArrowLeftIcon size={16} className="mr-1" />
                Back to Projects
              </button>
            )}
            <button className="p-1 rounded hover:bg-gray-100">
              <ArrowLeftIcon size={18} className="text-gray-600" />
            </button>
            <button className="p-1 rounded hover:bg-gray-100">
              <ArrowRightIcon size={18} className="text-gray-600" />
            </button>
          </div>
          {isEditing ? (
            <input
              type="text"
              value={projectName}
              onChange={handleNameChange}
              onBlur={handleNameBlur}
              onKeyDown={handleKeyDown}
              autoFocus
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            />
          ) : (
            <div
              onClick={handleNameClick}
              className="text-gray-700 font-medium text-sm cursor-pointer hover:underline"
            >
              {projectName}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 mr-4">
            <button className="p-1 rounded hover:bg-gray-100">
              <UndoIcon size={18} className="text-gray-600" />
            </button>
            <button className="p-1 rounded hover:bg-gray-100">
              <RedoIcon size={18} className="text-gray-600" />
            </button>
            <button className="p-1 rounded hover:bg-gray-100">
              <SaveIcon size={18} className="text-gray-600" />
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <UserIcon size={16} className="text-blue-600" />
            </div>
            <button className="bg-blue-500 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-blue-600 flex items-center">
              <DownloadIcon size={16} className="mr-1" />
              Export
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};