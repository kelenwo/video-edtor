'use client'

import React, { useEffect, useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { 
  selectCurrentTime, 
  selectDuration, 
  selectMediaItems, 
  selectSelectedItemId,
  setCurrentTime,
  setSelectedItemId,
  updateMediaItem 
} from '../redux/videoEditorSlice';
import { ZoomInIcon, ZoomOutIcon, ScissorsIcon, VolumeIcon, Volume2Icon, VolumeXIcon, TextIcon, ImageIcon, PlusIcon, XIcon, VideoIcon } from 'lucide-react';

export const Timeline = () => {
  const dispatch = useAppDispatch();
  const currentTime = useAppSelector(selectCurrentTime);
  const duration = useAppSelector(selectDuration);
  const mediaItems = useAppSelector(selectMediaItems);
  const selectedItemId = useAppSelector(selectSelectedItemId);
  
  const timelineRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'playhead' | 'move' | null>(null);

  // Time markers
  const timeMarkers = [];
  const markerStep = 5; // seconds
  for (let i = 0; i <= duration; i += markerStep) {
    timeMarkers.push(i);
  }

  const pixelsPerSecond = 100 * zoom;

  // Convert time to position
  const timeToPosition = (time: number) => {
    return time * pixelsPerSecond;
  };

  // Convert position to time
  const positionToTime = (position: number) => {
    return position / pixelsPerSecond;
  };

  // Handle timeline click to set playhead
  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const newTime = positionToTime(offsetX);
    if (newTime >= 0 && newTime <= duration) {
      dispatch(setCurrentTime(newTime));
    }
  };

  // Format time display
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle media item selection
  const handleItemClick = (itemId: string) => {
    dispatch(setSelectedItemId(itemId));
  };

  return (
    <div className="bg-gray-900 text-white flex flex-col h-64">
      {/* Timeline Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium">Timeline</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.5))}
              className="p-1 rounded hover:bg-gray-700"
            >
              <ZoomOutIcon size={16} />
            </button>
            <span className="text-xs text-gray-400">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(Math.min(3, zoom + 0.5))}
              className="p-1 rounded hover:bg-gray-700"
            >
              <ZoomInIcon size={16} />
            </button>
          </div>
        </div>
        <div className="text-sm text-gray-400">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Timeline Ruler */}
      <div className="flex-1 overflow-auto">
        <div 
          ref={timelineRef}
          className="relative h-full min-w-full cursor-pointer"
          style={{ width: `${timeToPosition(duration)}px` }}
          onClick={handleTimelineClick}
        >
          {/* Time markers */}
          <div className="absolute top-0 left-0 right-0 h-8 bg-gray-800 border-b border-gray-700">
            {timeMarkers.map((time) => (
              <div
                key={time}
                className="absolute flex flex-col items-center"
                style={{ left: `${timeToPosition(time)}px` }}
              >
                <div className="w-px h-4 bg-gray-600"></div>
                <span className="text-xs text-gray-400 mt-1">{formatTime(time)}</span>
              </div>
            ))}
          </div>

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
            style={{ left: `${timeToPosition(currentTime)}px` }}
          >
            <div className="absolute -top-1 -left-2 w-4 h-4 bg-red-500 rotate-45 transform origin-center"></div>
          </div>

          {/* Media Items Tracks */}
          <div className="absolute top-8 left-0 right-0 bottom-0">
            {/* Track labels */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gray-800 border-r border-gray-700">
              <div className="h-12 flex items-center justify-center border-b border-gray-700 text-xs">Video</div>
              <div className="h-12 flex items-center justify-center border-b border-gray-700 text-xs">Text</div>
              <div className="h-12 flex items-center justify-center border-b border-gray-700 text-xs">Audio</div>
            </div>

            {/* Tracks */}
            <div className="ml-20">
              {[0, 1, 2].map((trackIndex) => (
                <div key={trackIndex} className="h-12 border-b border-gray-700 relative">
                  {mediaItems
                    .filter(item => item.track === trackIndex)
                    .map((item) => (
                      <div
                        key={item.id}
                        className={`absolute top-1 bottom-1 rounded cursor-pointer border-2 flex items-center px-2 text-xs ${
                          selectedItemId === item.id
                            ? 'border-blue-400 bg-blue-900'
                            : 'border-gray-600 bg-gray-700 hover:bg-gray-600'
                        }`}
                        style={{
                          left: `${timeToPosition(item.startTime)}px`,
                          width: `${timeToPosition(item.duration)}px`,
                          backgroundColor: item.color || '#4B5563'
                        }}
                        onClick={() => handleItemClick(item.id)}
                      >
                        <div className="flex items-center space-x-1 overflow-hidden">
                          {item.type === 'video' && <VideoIcon size={12} />}
                          {item.type === 'audio' && <VolumeIcon size={12} />}
                          {item.type === 'text' && <TextIcon size={12} />}
                          {item.type === 'image' && <ImageIcon size={12} />}
                          <span className="truncate">{item.name}</span>
                        </div>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};