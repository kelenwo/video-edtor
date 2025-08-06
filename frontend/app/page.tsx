'use client'
import React from 'react';
import type { NextPage } from 'next';
import { House } from 'lucide-react';

// Reusable Icon component for SVG paths
const Icon = ({ path, className = "w-5 h-5" }: { path: string; className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d={path} clipRule="evenodd" />
    </svg>
);

const ProjectLandingPage: NextPage = () => {
    // Mock data for recent projects
    const recentProjects = [
        {
            title: "Summer Vlog '24",
            lastModified: "2 hours ago",
            thumbnail: "https://images.pexels.com/photos/3769747/pexels-photo-3769747.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
        },
        {
            title: "Client Commercial - Rev. 3",
            lastModified: "Yesterday at 4:30 PM",
            thumbnail: "https://images.pexels.com/photos/1595385/pexels-photo-1595385.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
        },
        {
            title: "Pasta Picasso B-Roll",
            lastModified: "3 days ago",
            thumbnail: "https://images.pexels.com/photos/4058411/pexels-photo-4058411.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
        },
        {
            title: "Birthday Party Edit",
            lastModified: "Last week",
            thumbnail: "https://images.pexels.com/photos/2291079/pexels-photo-2291079.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
        },
        {
            title: "Corporate Interview",
            lastModified: "June 15, 2024",
            thumbnail: "https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
        },
        {
            title: "Drone Footage - Coastline",
            lastModified: "June 12, 2024",
            thumbnail: "https://images.pexels.com/photos/36717/amazing-animal-beautiful-beautifull.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
        },
    ];

    return (
        <div className="bg-[#1e1e1e] h-screen w-screen text-gray-300 flex font-sans overflow-hidden">
            {/* Left Sidebar */}
            <aside className="w-64 bg-[#252526] flex-shrink-0 flex flex-col">
                <div className="h-20 flex items-center px-6">
                    <Icon path="M12 4.75L19.25 9L12 13.25L4.75 9L12 4.75ZM4.75 10.5L12 14.75L19.25 10.5L12 19.25L4.75 10.5Z" className="w-9 h-9 text-blue-500 mr-3" />
                    <span className="text-xl font-semibold text-white">VideoFusion</span>
                </div>
                <nav className="flex-1 px-4 space-y-2">
                    <SidebarLink label="Home" icon={<House width={16} height={16} />} active />

                </nav>
                <div className="p-4">
                    <div className="flex items-center p-3 rounded-lg hover:bg-[#3c3c3c]">
                        <img src="https://placehold.co/40x40/8B5CF6/FFFFFF?text=A" alt="User Avatar" className="w-10 h-10 rounded-full" />
                        <div className="ml-4">
                            <p className="font-semibold text-white">Alex Doe</p>
                            <p className="text-xs text-gray-400">View Profile</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-y-auto">
                <div className="px-10 py-8">
                    {/* Header */}
                    <header className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-white">Welcome back, Alex</h1>
                            <p className="text-gray-400">Let's create something amazing today.</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center space-x-2 transition-transform duration-200 hover:scale-105">
                                <Icon path="M12 4v16m8-8H4" className="w-6 h-6" />
                                <span>New Project</span>
                            </button>
                            <button className="bg-[#3c3c3c] hover:bg-[#4f4f4f] text-white font-semibold py-3 px-6 rounded-lg">
                                Open Project
                            </button>
                        </div>
                    </header>

                    {/* Recent Projects */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-white">Recent Projects</h2>
                            <div className="flex items-center space-x-2 p-1 bg-[#2d2d2d] rounded-md">
                                <button className="p-1.5 rounded text-white bg-[#3c3c3c]">
                                    <Icon path="M3.375 4.5C2.339 4.5 1.5 5.34 1.5 6.375V17.625C1.5 18.66 2.34 19.5 3.375 19.5H20.625C21.66 19.5 22.5 18.66 22.5 17.625V6.375C22.5 5.339 21.66 4.5 20.625 4.5H3.375Z" />
                                </button>
                                <button className="p-1.5 rounded text-gray-400 hover:bg-[#3c3c3c]">
                                    <Icon path="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm0 6a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {recentProjects.map((project, index) => (
                                <ProjectCard key={index} {...project} />
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

// Helper component for sidebar navigation links
const SidebarLink = ({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) => (
    <a href="#" className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${active ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:bg-[#3c3c3c] hover:text-white'}`}>
        {icon}
        <span className="font-medium">{label}</span>
    </a>
);

// Helper component for the recent project cards
const ProjectCard = ({ thumbnail, title, lastModified }: { thumbnail: string; title: string; lastModified: string }) => (
    <div className="bg-[#2d2d2d] rounded-lg overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-blue-600/20 hover:-translate-y-1">
        <div className="relative aspect-video bg-black">
            <img
                src={thumbnail}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x225/000000/FFFFFF?text=Error'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 bg-black/40 rounded-full text-white hover:bg-blue-600">
                    <Icon path="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </button>
            </div>
        </div>
        <div className="p-4">
            <h3 className="font-semibold text-white truncate">{title}</h3>
            <p className="text-sm text-gray-400">{lastModified}</p>
        </div>
    </div>
);

export default ProjectLandingPage;
