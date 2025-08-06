'use client'

import React, { useEffect, useState, useRef } from 'react';
import { PlayIcon, PauseIcon, SkipBackIcon, SkipForwardIcon, MaximizeIcon } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import {
  selectCurrentTime,
  selectDuration,
  selectIsPlaying,
  selectMediaItems,
  setCurrentTime,
  setIsPlaying
} from '../redux/videoEditorSlice';

export const VideoPreview = () => {
  const dispatch = useAppDispatch();
  const currentTime = useAppSelector(selectCurrentTime);
  const duration = useAppSelector(selectDuration);
  const isPlaying = useAppSelector(selectIsPlaying);
  const mediaItems = useAppSelector(selectMediaItems);

  const previewRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (isPlaying) {
        dispatch(setCurrentTime(video.currentTime));
      }
    };

    const handleEnded = () => {
      dispatch(setIsPlaying(false));
      dispatch(setCurrentTime(0));
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [isPlaying, dispatch]);

  const togglePlayPause = () => {
    dispatch(setIsPlaying(!isPlaying));
  };

  const skipBackward = () => {
    const newTime = Math.max(0, currentTime - 5);
    dispatch(setCurrentTime(newTime));
  };

  const skipForward = () => {
    const newTime = Math.min(duration, currentTime + 5);
    dispatch(setCurrentTime(newTime));
  };

  // Get current video item for preview
  const currentVideoItem = mediaItems.find(item => 
    item.type === 'video' && 
    currentTime >= item.startTime && 
    currentTime <= item.endTime
  );

  // Get current text items for overlay
  const currentTextItems = mediaItems.filter(item => 
    item.type === 'text' && 
    currentTime >= item.startTime && 
    currentTime <= item.endTime
  );

  return (
    <div className="flex-1 bg-gray-100 flex flex-col">
      {/* Preview Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div 
          ref={previewRef}
          className="relative bg-black rounded-lg overflow-hidden shadow-lg"
          style={{ width: '640px', height: '360px' }}
        >
          {/* Video */}
          {currentVideoItem?.url ? (
            <video
              ref={videoRef}
              src={currentVideoItem.url}
              className="w-full h-full object-cover"
              muted={currentVideoItem.isMuted}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              <div className="text-center text-gray-400">
                <PlayIcon size={48} className="mx-auto mb-2" />
                <p>No video selected</p>
                <p className="text-sm">Add a video to the timeline to preview</p>
              </div>
            </div>
          )}

          {/* Text Overlays */}
          {currentTextItems.map((textItem) => (
            <div
              key={textItem.id}
              className="absolute pointer-events-none"
              style={{
                left: `${textItem.position?.x || 50}%`,
                top: `${textItem.position?.y || 50}%`,
                transform: 'translate(-50%, -50%)',
                fontSize: `${textItem.fontSize || 32}px`,
                fontFamily: textItem.fontFamily || 'Arial',
                color: textItem.fontColor || '#ffffff',
                fontWeight: textItem.fontWeight || 'normal',
                fontStyle: textItem.fontStyle || 'normal',
                textAlign: textItem.textAlign || 'center'
              }}
            >
              {textItem.content}
            </div>
          ))}

          {/* Play overlay when paused */}
          {!isPlaying && currentVideoItem && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
              <button
                onClick={togglePlayPause}
                className="p-4 bg-white bg-opacity-20 backdrop-blur-sm rounded-full text-white hover:bg-opacity-30 transition-colors"
              >
                <PlayIcon size={32} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center justify-between">
          {/* Playback Controls */}
          <div className="flex items-center space-x-4">
            <button
              onClick={skipBackward}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <SkipBackIcon size={20} />
            </button>
            <button
              onClick={togglePlayPause}
              className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600"
            >
              {isPlaying ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
            </button>
            <button
              onClick={skipForward}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <SkipForwardIcon size={20} />
            </button>
          </div>

          {/* Time Display */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            <button className="p-2 rounded-full hover:bg-gray-100">
              <MaximizeIcon size={20} />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-100"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
            <input
              type="range"
              min="0"
              max={duration}
              value={currentTime}
              onChange={(e) => dispatch(setCurrentTime(Number(e.target.value)))}
              className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};