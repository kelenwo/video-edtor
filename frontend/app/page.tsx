'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SearchIcon, PlusIcon, UserIcon, GridIcon, ListIcon, ClockIcon, StarIcon, SlidersIcon, HelpCircleIcon, BellIcon, LogOutIcon } from 'lucide-react';
import { useAppSelector } from '../redux/hooks';
import { selectProjects } from '../redux/projectsSlice';
import { ProjectCard } from '../components/ProjectCard';
import { CreateNewCard } from '../components/CreateNewCard';
import { AuthModal } from '../components/AuthModal';
import { apiService } from './services/api';

const LandingPage = () => {
  const projects = useAppSelector(selectProjects);
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<'home' | 'recent' | 'starred'>('home');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    setIsAuthenticated(apiService.isAuthenticated());
  }, []);

  const handleCreateNew = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    router.push('/editor/new');
  };

  const handleOpenProject = (projectId: string) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    router.push(`/editor/${projectId}`);
  };

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    apiService.logout();
    setIsAuthenticated(false);
  };

  // Filter projects based on search term
  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-3 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="text-blue-500 font-bold text-xl">VideoEditor</div>
            <div className="relative">
              <SearchIcon size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search your projects"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full hover:bg-gray-100">
              <HelpCircleIcon size={20} className="text-gray-600" />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100">
              <BellIcon size={20} className="text-gray-600" />
            </button>
            {isAuthenticated ? (
              <>
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <UserIcon size={16} className="text-blue-600" />
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-full hover:bg-gray-100"
                  title="Logout"
                >
                  <LogOutIcon size={20} className="text-gray-600" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex items-center mb-8 border-b border-gray-200">
          <button
            className={`px-4 py-3 text-sm font-medium ${
              selectedTab === 'home'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setSelectedTab('home')}
          >
            Home
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${
              selectedTab === 'recent'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setSelectedTab('recent')}
          >
            Recent
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${
              selectedTab === 'starred'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setSelectedTab('starred')}
          >
            Starred
          </button>
        </div>

        {/* Quick actions */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Create new</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <CreateNewCard
              title="Blank Project"
              description="Start from scratch"
              onClick={handleCreateNew}
              icon={<PlusIcon size={24} className="text-blue-500" />}
            />
            <CreateNewCard
              title="Social Media Video"
              description="16:9 aspect ratio"
              onClick={handleCreateNew}
              icon={<PlusIcon size={24} className="text-purple-500" />}
            />
            <CreateNewCard
              title="Instagram Story"
              description="9:16 aspect ratio"
              onClick={handleCreateNew}
              icon={<PlusIcon size={24} className="text-pink-500" />}
            />
            <CreateNewCard
              title="YouTube Video"
              description="16:9 aspect ratio"
              onClick={handleCreateNew}
              icon={<PlusIcon size={24} className="text-red-500" />}
            />
          </div>
        </div>

        {/* Projects list */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Your projects</h2>
            <div className="flex items-center space-x-2">
              <button
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                onClick={() => setViewMode('grid')}
              >
                <GridIcon size={16} className="text-gray-700" />
              </button>
              <button
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                onClick={() => setViewMode('list')}
              >
                <ListIcon size={16} className="text-gray-700" />
              </button>
              <button className="p-2 rounded hover:bg-gray-100">
                <SlidersIcon size={16} className="text-gray-700" />
              </button>
            </div>
          </div>
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No projects found. Create a new project to get started.</p>
              <button
                onClick={handleCreateNew}
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600"
              >
                Create New Project
              </button>
            </div>
          ) : (
            <div
              className={`grid ${
                viewMode === 'grid'
                  ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                  : 'grid-cols-1'
              } gap-4`}
            >
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  viewMode={viewMode}
                  onOpen={() => handleOpenProject(project.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onAuthenticated={handleAuthenticated}
        />
      )}
    </div>
  );
};

export default LandingPage;
