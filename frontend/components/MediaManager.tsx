'use client';

import { useState, useRef } from 'react';
import { FaUpload, FaVideo, FaMusic, FaImage, FaFile, FaTrash, FaPlay } from 'react-icons/fa';

interface MediaItem {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image';
  url: string;
  thumbnail?: string;
  duration?: number;
  size: number;
  uploadedAt: Date;
}

interface MediaManagerProps {
  onMediaSelect: (media: MediaItem) => void;
  onMediaUpload: (files: FileList) => void;
}

export default function MediaManager({ onMediaSelect, onMediaUpload }: MediaManagerProps) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'video' | 'audio' | 'image'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      onMediaUpload(files);
      
      // Add to local media library
      Array.from(files).forEach(file => {
        const mediaItem: MediaItem = {
          id: Date.now().toString(),
          name: file.name,
          type: getFileType(file.type),
          url: URL.createObjectURL(file),
          size: file.size,
          uploadedAt: new Date(),
        };
        setMediaItems(prev => [...prev, mediaItem]);
      });
    }
  };

  const getFileType = (mimeType: string): 'video' | 'audio' | 'image' => {
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('image/')) return 'image';
    return 'video'; // fallback
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const filteredMedia = mediaItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || item.type === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onMediaUpload(files);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-editor-light-gray">
        <h3 className="text-lg font-semibold mb-4">Media Library</h3>
        
        {/* Upload Area */}
        <div 
          className="border-2 border-dashed border-editor-light-gray rounded-lg p-6 text-center hover:border-editor-blue transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <FaUpload size={24} className="mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-400 mb-2">Drag and drop files here or click to browse</p>
          <p className="text-xs text-gray-500">Supports video, audio, and image files</p>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="video/*,audio/*,image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Search and Tabs */}
      <div className="p-4 border-b border-editor-light-gray">
        <input
          type="text"
          placeholder="Search media..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-editor-light-gray border border-gray-600 rounded px-3 py-2 text-sm"
        />
        
        <div className="flex space-x-1 mt-3">
          {[
            { key: 'all', label: 'All', icon: FaFile },
            { key: 'video', label: 'Video', icon: FaVideo },
            { key: 'audio', label: 'Audio', icon: FaMusic },
            { key: 'image', label: 'Image', icon: FaImage },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center space-x-1 px-3 py-1 rounded text-xs transition-colors ${
                activeTab === key 
                  ? 'bg-editor-blue text-white' 
                  : 'bg-editor-light-gray text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Icon size={12} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Media Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredMedia.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <FaFile size={48} className="mx-auto mb-4" />
            <p>No media files found</p>
            <p className="text-sm">Upload some files to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredMedia.map((item) => (
              <div
                key={item.id}
                className="bg-editor-light-gray rounded-lg p-3 cursor-pointer hover:bg-gray-600 transition-colors"
                onClick={() => onMediaSelect(item)}
              >
                <div className="relative mb-2">
                  {item.thumbnail ? (
                    <img 
                      src={item.thumbnail} 
                      alt={item.name}
                      className="w-full h-20 object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-20 bg-editor-dark rounded flex items-center justify-center">
                      {item.type === 'video' && <FaVideo size={24} className="text-gray-400" />}
                      {item.type === 'audio' && <FaMusic size={24} className="text-gray-400" />}
                      {item.type === 'image' && <FaImage size={24} className="text-gray-400" />}
                    </div>
                  )}
                  {item.duration && (
                    <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
                      {formatDuration(item.duration)}
                    </div>
                  )}
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-gray-400">{formatFileSize(item.size)}</p>
                  <p className="text-xs text-gray-400">
                    {item.uploadedAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 