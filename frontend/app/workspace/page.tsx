'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Club,
  Plus,
  Upload,
  Text,
  Video,
  Music,
  Image,
  Mic,
  MessageSquare,
  ChevronLeft,
  AlertTriangle,
  Info,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Minus,
  Maximize2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Move,
  ZoomIn,
  ZoomOut,
  ChevronUp,
  ChevronDown,
  MousePointer
} from 'lucide-react';
import {
  SidebarButton,
  ControlSection,
  IconButton,
  InputWithLabel,
  TimelineTrack
} from '@/components/ui';
import VideoPlayer from '@/components/VideoPlayer';
import AdvancedTimeline, { TimelineTrack as TimelineTrackType, TimelineClip } from '@/components/AdvancedTimeline';
import MediaUpload from '@/components/MediaUpload';
import SimpleVideoPlayer from '@/components/SimpleVideoPlayer';

interface MediaFile {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image';
  file: File;
  url: string;
  thumbnail?: string;
  duration?: number;
}

const VideoEditorPage: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [activePanel, setActivePanel] = useState<'text' | 'upload'>('text');
  const [currentVideoSrc, setCurrentVideoSrc] = useState<string>('');
  const [currentVideoPoster, setCurrentVideoPoster] = useState<string>('');
  const [uploadedMedia, setUploadedMedia] = useState<MediaFile[]>([]);
  const [tracks, setTracks] = useState<TimelineTrackType[]>([]);

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const handleDurationChange = (newDuration: number) => {
    setDuration(newDuration);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleTracksChange = (newTracks: TimelineTrackType[]) => {
    setTracks(newTracks);
  };

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
  };

  const handleSidebarButtonClick = (button: string) => {
    if (button === 'upload') {
      setActivePanel('upload');
    } else if (button === 'text') {
      setActivePanel('text');
    }
  };

  const handleMediaSelect = (media: MediaFile) => {
    console.log('Media selected:', media);
    
    // Add to uploaded media list
    setUploadedMedia(prev => [...prev, media]);

    // If it's a video, update the main video player
    if (media.type === 'video') {
      console.log('Setting video source to:', media.url);
      setCurrentVideoSrc(media.url);
      setCurrentVideoPoster(media.thumbnail || '');
    }

    // Create a new clip for the timeline
    const newClip: TimelineClip = {
      id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: media.name,
      type: media.type,
      src: media.url,
      start: 0, // Start at beginning of timeline
      duration: media.duration || 10,
      color: media.type === 'video' ? '#8b5cf6' : media.type === 'audio' ? '#10b981' : '#3b82f6',
      thumbnail: media.thumbnail
    };

    // Always create a new track for each uploaded media
    const newTrack: TimelineTrackType = {
      id: `${media.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `${media.name} (${media.type})`,
      type: media.type,
      color: media.type === 'video' ? '#8b5cf6' : media.type === 'audio' ? '#10b981' : '#3b82f6',
      height: media.type === 'video' ? 80 : 60,
      visible: true,
      clips: [newClip]
    };

    // Add the new track to the timeline
    setTracks(prev => [...prev, newTrack]);

    // Switch back to text panel after adding media
    setActivePanel('text');
  };

  const handleCloseUpload = () => {
    setActivePanel('text');
  };

  const handleClipSelect = (clip: TimelineClip) => {
    console.log('Clip selected:', clip);
    if (clip.type === 'video') {
      console.log('Setting video source to clip:', clip.src);
      setCurrentVideoSrc(clip.src);
      setCurrentVideoPoster(clip.thumbnail || '');
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-[#121212] h-screen w-screen text-gray-300 flex font-sans overflow-hidden">
      {/* Main Content Area */}
      <div className="flex flex-1">
        {/* Left Sidebar */}
        <aside className="w-[72px] bg-[#252526] flex flex-col items-center py-4 space-y-1 flex-shrink-0">
          <button className="p-3 my-1 rounded-lg text-blue-500">
            <Club className="w-7 h-7" />
          </button>
          <SidebarButton icon={Plus} label="Add" />
          <SidebarButton 
            icon={Upload} 
            label="Uploads" 
            active={activePanel === 'upload'}
            onClick={() => handleSidebarButtonClick('upload')}
          />
          <SidebarButton 
            icon={Text} 
            label="Text" 
            active={activePanel === 'text'}
            onClick={() => handleSidebarButtonClick('text')}
          />
          <SidebarButton icon={Video} label="Videos" />
          <SidebarButton icon={Music} label="Audios" />
          <SidebarButton icon={Image} label="Photos" />
          <SidebarButton icon={Mic} label="Records" />
          <SidebarButton icon={MessageSquare} label="Subtitles" />
        </aside>

        {/* Main Content & Timeline */}
        <main className="flex flex-col flex-1 bg-[#1e1e1e]">
          {/* Project Header */}
          <div className="flex items-center justify-between h-14 bg-[#1e1e1e] border-b border-gray-700 px-4 flex-shrink-0">
            <h1 className="text-lg font-semibold">Untitled project</h1>
            <div className="flex items-center space-x-4">
              <AlertTriangle className="w-5 h-5" />
              <Info className="w-5 h-5" />
              <div className="flex -space-x-2">
                <img src="https://placehold.co/32x32/8B5CF6/FFFFFF?text=A" alt="User Avatar 1" className="w-8 h-8 rounded-full border-2 border-[#1e1e1e]" />
                <img src="https://placehold.co/32x32/EC4899/FFFFFF?text=B" alt="User Avatar 2" className="w-8 h-8 rounded-full border-2 border-[#1e1e1e]" />
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-lg text-sm">
                Export
              </button>
            </div>
          </div>

          <div className="flex flex-1 overflow-y-auto">
            {/* Dynamic Panel - Text Options or Upload */}
            <div className="w-[300px] bg-[#2d2d2d] flex-shrink-0">
              {activePanel === 'text' ? (
                <div className="p-4 space-y-4 overflow-y-auto h-full">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Text</h2>
                    <ChevronLeft className="w-6 h-6 transform rotate-180" />
                  </div>
                  <div className="space-y-3">
                    <ControlSection title="Align">
                      <div className="flex items-center justify-between bg-[#3c3c3c] rounded-md p-1">
                        <IconButton icon={AlignLeft} />
                        <IconButton icon={AlignCenter} />
                        <IconButton icon={AlignRight} />
                        <IconButton icon={AlignJustify} active />
                        <IconButton icon={AlignLeft} />
                        <IconButton icon={AlignRight} />
                      </div>
                    </ControlSection>

                    <ControlSection title="Position">
                      <div className="grid grid-cols-3 gap-2">
                        <InputWithLabel label="X" value="35" />
                        <InputWithLabel label="Y" value="30" />
                        <InputWithLabel label="θ" value="0" />
                      </div>
                    </ControlSection>

                    <ControlSection title="Size">
                      <div className="grid grid-cols-3 gap-2">
                        <InputWithLabel label="W" value="135" />
                        <InputWithLabel label="H" value="28" />
                        <div className="flex items-center justify-center">
                          <Move className="w-5 h-5" />
                        </div>
                      </div>
                    </ControlSection>
                    
                    <ControlSection title="Radius">
                      <InputWithLabel label="L" value="0" />
                    </ControlSection>

                    <ControlSection title="Text">
                      <input 
                        type="text" 
                        defaultValue="Pasta Picasso" 
                        className="w-full bg-[#3c3c3c] rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      />
                    </ControlSection>

                    <ControlSection title="Mitr">
                      <div className="flex items-center justify-between bg-[#3c3c3c] rounded-md p-1">
                        <select className="bg-transparent text-sm w-full focus:outline-none">
                          <option>Medium</option>
                          <option>Light</option>
                          <option>Bold</option>
                        </select>
                      </div>
                    </ControlSection>

                    <div className="grid grid-cols-3 gap-2">
                      <InputWithLabel label="Size" value="20" hasPlusMinus />
                      <InputWithLabel label="A" value="0" hasPlusMinus />
                      <InputWithLabel label="I" value="100%" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <IconButton icon={Bold} />
                      <IconButton icon={Italic} />
                      <IconButton icon={Underline} />
                      <IconButton icon={Strikethrough} />
                    </div>
                  </div>
                  
                  <ControlSection title="Fill">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-md bg-white"></div>
                      <InputWithLabel label="Color" value="FFFFFF" />
                      <InputWithLabel label="" value="100%" />
                    </div>
                  </ControlSection>
                  
                  <ControlSection title="Border">
                    {/* Empty for now as per design */}
                  </ControlSection>
                </div>
              ) : (
                <MediaUpload 
                  onMediaSelect={handleMediaSelect}
                  onClose={handleCloseUpload}
                />
              )}
            </div>

            {/* Video Canvas - Main Workspace */}
            <div className="flex-1 flex flex-col bg-[#121212]">
              {/* Video Player Controls */}
              <div className="flex items-center justify-between p-4 bg-[#1e1e1e] border-b border-gray-700">
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={handlePlayPause}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                  <span className="text-sm font-medium">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-400">{Math.round(zoom * 100)}%</span>
                  <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Video Canvas */}
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-4xl aspect-video bg-black rounded-lg relative overflow-hidden">
                  {currentVideoSrc ? (
                    <SimpleVideoPlayer
                      src={currentVideoSrc}
                      poster={currentVideoPoster}
                      onTimeUpdate={handleTimeUpdate}
                      onDurationChange={handleDurationChange}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      className="w-full h-full"
                      isPlaying={isPlaying}
                      onPlayPause={handlePlayPause}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                      <div className="text-6xl mb-4">🎬</div>
                      <h3 className="text-xl font-semibold mb-2">No Video Loaded</h3>
                      <p className="text-sm text-gray-500">Upload a video to get started</p>
                    </div>
                  )}
                  
                  {/* Debug info */}
                  <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
                    <div>Current Source: {currentVideoSrc ? currentVideoSrc.substring(0, 50) + '...' : 'None'}</div>
                    <div>Uploaded Media: {uploadedMedia.length} files</div>
                    <div>Tracks: {tracks.length}</div>
                  </div>
                </div>
              </div>

              {/* Bottom Controls */}
              <div className="flex items-center justify-center space-x-6 p-4 bg-[#1e1e1e] border-t border-gray-700">
                <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                  <RotateCcw className="w-5 h-5" />
                </button>
                <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                  <RotateCw className="w-5 h-5" />
                </button>
                <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                  <AlignLeft className="w-5 h-5" />
                </button>
                <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                  <AlignRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Timeline Section */}
          <div className="h-[280px] bg-[#252526] flex-shrink-0 p-4 flex flex-col border-t border-gray-700">
            <AdvancedTimeline
              tracks={tracks}
              onTracksChange={handleTracksChange}
              currentTime={currentTime}
              duration={duration}
              onTimeChange={setCurrentTime}
              onPlayPause={handlePlayPause}
              isPlaying={isPlaying}
              zoom={zoom}
              onZoomChange={handleZoomChange}
              onClipSelect={handleClipSelect}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default VideoEditorPage; 