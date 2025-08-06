'use client'

import React, { useEffect, useState, useRef } from 'react';
import { PlayIcon, PauseIcon, SkipBackIcon, SkipForwardIcon, MaximizeIcon } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import {
  selectCurrentTime,
  selectDuration,
  selectIsPlaying,
  selectMediaItems,
  selectActiveTextItem,
  selectIsDraggingText,
  setCurrentTime,
  setIsPlaying,
  updateMediaItem,
  setActiveTextItem,
  setIsDraggingText
} from '../redux/videoEditorSlice';

export const VideoPreview = () => {
  const dispatch = useAppDispatch();
  const currentTime = useAppSelector(selectCurrentTime);
  const duration = useAppSelector(selectDuration);
  const isPlaying = useAppSelector(selectIsPlaying);
  const mediaItems = useAppSelector(selectMediaItems);
  const activeTextItem = useAppSelector(selectActiveTextItem);
  const isDraggingText = useAppSelector(selectIsDraggingText);

  const previewRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [dragStartPos, setDragStartPos] = useState({
    x: 0,
    y: 0
  });

  // Format time as MM:SS.MS
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time % 1) * 100);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  // Connect video playback to isPlaying state
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(err => {
          console.error('Video play error:', err);
          dispatch(setIsPlaying(false));
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, dispatch]);

  // Update video currentTime when timeline position changes
  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - currentTime) > 0.5) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  // Listen to video timeupdate event to sync with timeline
  useEffect(() => {
    const videoElement = videoRef.current;
    const handleTimeUpdate = () => {
      if (videoElement && !isDraggingText) {
        dispatch(setCurrentTime(videoElement.currentTime));
      }
    };

    const handleVideoEnded = () => {
      dispatch(setIsPlaying(false));
      dispatch(setCurrentTime(0));
    };

    if (videoElement) {
      videoElement.addEventListener('timeupdate', handleTimeUpdate);
      videoElement.addEventListener('ended', handleVideoEnded);
    }

    return () => {
      if (videoElement) {
        videoElement.removeEventListener('timeupdate', handleTimeUpdate);
        videoElement.removeEventListener('ended', handleVideoEnded);
      }
    };
  }, [dispatch, isDraggingText]);

  const togglePlayback = () => {
    dispatch(setIsPlaying(!isPlaying));
  };

  const skipBackward = () => {
    dispatch(setCurrentTime(Math.max(0, currentTime - 5)));
  };

  const skipForward = () => {
    dispatch(setCurrentTime(Math.min(duration, currentTime + 5)));
  };

  // Find active media items at current time
  const activeItems = mediaItems.filter(item => currentTime >= item.startTime && currentTime <= item.endTime);
  const activeTextItems = activeItems.filter(item => item.type === 'text');
  const activeVideoItems = activeItems.filter(item => item.type === 'video');

  // Handle text dragging
  const handleTextMouseDown = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    if (!previewRef.current) return;
    
    dispatch(setActiveTextItem(itemId));
    dispatch(setIsDraggingText(true));
    const rect = previewRef.current.getBoundingClientRect();
    setDragStartPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingText || !activeTextItem || !previewRef.current) return;
      
      const rect = previewRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      dispatch(updateMediaItem({
        id: activeTextItem,
        updates: {
          position: { x, y }
        }
      }));
    };

    const handleMouseUp = () => {
      dispatch(setIsDraggingText(false));
    };

    if (isDraggingText) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingText, activeTextItem, dispatch]);

  // Get the main video if available
  const mainVideo = activeVideoItems[0];

  return (
    <div className="flex-1 flex flex-col p-4 min-h-0">
      <div ref={previewRef} className="relative flex-1 bg-black rounded-lg flex items-center justify-center overflow-hidden">
        {/* Video element */}
        {mainVideo ? (
          <video 
            ref={videoRef} 
            src={mainVideo.url} 
            className="max-w-full max-h-full object-contain" 
            muted={mainVideo.isMuted} 
            loop 
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white">
            No video selected
          </div>
        )}

        {/* Text overlays */}
        {activeTextItems.map(item => (
          <div 
            key={item.id} 
            className={`absolute text-white cursor-move ${activeTextItem === item.id ? 'ring-2 ring-blue-500' : ''}`} 
            style={{
              top: `${item.position?.y || 20}%`,
              left: `${item.position?.x || 50}%`,
              transform: 'translate(-50%, -50%)',
              fontSize: `${item.fontSize || 32}px`,
              fontFamily: item.fontFamily || 'Arial',
              color: item.fontColor || '#ffffff',
              fontWeight: item.fontWeight || 'bold',
              fontStyle: item.fontStyle || 'normal',
              textAlign: item.textAlign || 'center',
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              padding: '4px 8px'
            }} 
            onMouseDown={e => handleTextMouseDown(e, item.id)}
          >
            {item.content}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={skipBackward} className="p-1 rounded-full hover:bg-gray-200">
            <SkipBackIcon size={20} className="text-gray-700" />
          </button>
          <button onClick={togglePlayback} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300">
            {isPlaying ? <PauseIcon size={20} className="text-gray-800" /> : <PlayIcon size={20} className="text-gray-800" />}
          </button>
          <button onClick={skipForward} className="p-1 rounded-full hover:bg-gray-200">
            <SkipForwardIcon size={20} className="text-gray-700" />
          </button>
        </div>
        <div className="text-sm text-gray-600">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
        <button className="p-1 rounded-full hover:bg-gray-200">
          <MaximizeIcon size={20} className="text-gray-700" />
        </button>
      </div>
    </div>
  );
};