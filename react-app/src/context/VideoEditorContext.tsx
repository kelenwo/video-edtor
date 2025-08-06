import React, { useState, createContext, useContext } from 'react';
import { Project } from './ProjectsContext';
export type MediaItem = {
  id: string;
  type: 'video' | 'audio' | 'image' | 'text';
  name: string;
  duration: number; // in seconds
  startTime: number; // position in timeline
  endTime: number; // position in timeline
  track: number; // track number
  color?: string; // for visual distinction
  content?: string; // for text
  url?: string; // for video/audio/image
  position?: {
    x: number;
    y: number;
  }; // position for text/image overlays
  fontSize?: number; // for text
  fontFamily?: string; // for text
  fontColor?: string; // for text
  fontWeight?: string; // for text
  fontStyle?: string; // for text
  textAlign?: 'left' | 'center' | 'right'; // for text
  isMuted?: boolean; // for audio/video
};
type VideoEditorContextType = {
  currentTime: number;
  setCurrentTime: (time: number) => void;
  duration: number;
  setDuration: (duration: number) => void;
  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
  mediaItems: MediaItem[];
  addMediaItem: (item: Omit<MediaItem, 'id'>) => string;
  updateMediaItem: (id: string, updates: Partial<MediaItem>) => void;
  removeMediaItem: (id: string) => void;
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
  projectName: string;
  setProjectName: (name: string) => void;
  projectId: string | null;
  isDraggingText: boolean;
  setIsDraggingText: (isDragging: boolean) => void;
  activeTextItem: string | null;
  setActiveTextItem: (id: string | null) => void;
  showTrimControls: boolean;
  setShowTrimControls: (show: boolean) => void;
  trimItemId: string | null;
  setTrimItemId: (id: string | null) => void;
};
const VideoEditorContext = createContext<VideoEditorContextType | undefined>(undefined);
export const useVideoEditor = () => {
  const context = useContext(VideoEditorContext);
  if (context === undefined) {
    throw new Error('useVideoEditor must be used within a VideoEditorProvider');
  }
  return context;
};
interface VideoEditorProviderProps {
  children: ReactNode;
  initialProject?: Project;
}
export const VideoEditorProvider = ({
  children,
  initialProject
}: VideoEditorProviderProps) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialProject?.duration || 60); // Default 60 seconds
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState(initialProject?.name || 'Untitled project');
  const [projectId, setProjectId] = useState<string | null>(initialProject?.id || null);
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [activeTextItem, setActiveTextItem] = useState<string | null>(null);
  const [showTrimControls, setShowTrimControls] = useState(false);
  const [trimItemId, setTrimItemId] = useState<string | null>(null);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(initialProject?.mediaItems || [{
    id: '1',
    type: 'video',
    name: 'Cooking Footage',
    duration: 30,
    startTime: 0,
    endTime: 30,
    track: 0,
    color: '#9d84e8',
    url: 'https://cdn.coverr.co/videos/coverr-cooking-vegetables-in-a-pan-5858/1080p.mp4',
    isMuted: false
  }, {
    id: '2',
    type: 'text',
    name: 'Title Text',
    duration: 15,
    startTime: 5,
    endTime: 20,
    track: 1,
    content: 'Pasta Picasso',
    position: {
      x: 50,
      y: 20
    },
    fontSize: 32,
    fontFamily: 'Arial',
    fontColor: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center'
  }, {
    id: '3',
    type: 'audio',
    name: 'Background Music',
    duration: 45,
    startTime: 0,
    endTime: 45,
    track: 2,
    color: '#4caf50',
    url: 'https://example.com/audio1.mp3',
    isMuted: false
  }]);
  const addMediaItem = (item: Omit<MediaItem, 'id'>) => {
    const newItem = {
      ...item,
      id: Math.random().toString(36).substr(2, 9)
    };
    setMediaItems([...mediaItems, newItem]);
    return newItem.id;
  };
  const updateMediaItem = (id: string, updates: Partial<MediaItem>) => {
    setMediaItems(mediaItems.map(item => item.id === id ? {
      ...item,
      ...updates
    } : item));
  };
  const removeMediaItem = (id: string) => {
    setMediaItems(mediaItems.filter(item => item.id !== id));
  };
  return <VideoEditorContext.Provider value={{
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    isPlaying,
    setIsPlaying,
    mediaItems,
    addMediaItem,
    updateMediaItem,
    removeMediaItem,
    selectedItemId,
    setSelectedItemId,
    projectName,
    setProjectName,
    projectId,
    isDraggingText,
    setIsDraggingText,
    activeTextItem,
    setActiveTextItem,
    showTrimControls,
    setShowTrimControls,
    trimItemId,
    setTrimItemId
  }}>
      {children}
    </VideoEditorContext.Provider>;
};