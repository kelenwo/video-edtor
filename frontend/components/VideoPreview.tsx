'use client'

import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { PlayIcon, PauseIcon, SkipBackIcon, SkipForwardIcon, MaximizeIcon, RatioIcon } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  selectCurrentTime,
  selectDuration, // Now directly consuming the duration from Redux
  selectIsPlaying,
  selectMediaItems,
  selectSelectedItemId,
  setCurrentTime,
  setIsPlaying,
  updateMediaItem,
  setSelectedItemId,
} from '../redux/videoEditorSlice';

// Represents an active interaction like dragging or resizing
type Interaction = {
  type: 'drag' | 'resize-br' | 'resize-bl' | 'resize-tr' | 'resize-tl' | 'resize-n' | 'resize-s' | 'resize-e' | 'resize-w';
  itemId: string;
  startX: number;
  startY: number;
  startPosX: number;
  startPosY: number;
  startWidth: number;
  startHeight: number;
};

export const VideoPreview = () => {
  const dispatch = useAppDispatch();
  const currentTime = useAppSelector(selectCurrentTime);
  const duration = useAppSelector(selectDuration); // Now directly consuming the duration from Redux
  const isPlaying = useAppSelector(selectIsPlaying);
  const mediaItems = useAppSelector(selectMediaItems);
  const selectedItemId = useAppSelector(selectSelectedItemId);

  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});

  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [zoom, setZoom] = useState<number | 'fit'>(1);
  const [interaction, setInteraction] = useState<Interaction | null>(null);
  const [showSnapOutline, setShowSnapOutline] = useState(false);
  // const [calculatedDuration, setCalculatedDuration] = useState(300); // Removed local state

  // Format time as MM:SS.MS
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time % 1) * 100);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  // Removed local duration calculation, now handled by Redux slice
  // useEffect(() => {
  //   let maxEndTime = 0;
  //   mediaItems.forEach(item => {
  //     if (item.type === 'video' || item.type === 'audio') {
  //       maxEndTime = Math.max(maxEndTime, item.endTime || 0);
  //     }
  //   });
  //   setCalculatedDuration(Math.max(maxEndTime, 300));
  // }, [mediaItems]);


  // Sync all active video elements with the global playback state
  useEffect(() => {
    mediaItems.forEach(item => {
      if (item.type === 'video' && videoRefs.current[item.id]) {
        const video = videoRefs.current[item.id];
        if (isPlaying) {
          video.play().catch(err => console.error('Video play error:', err));
        } else {
          video.pause();
        }
        if (Math.abs(video.currentTime - currentTime) > 0.1) {
          video.currentTime = currentTime;
        }
      }
    });
  }, [isPlaying, currentTime, mediaItems]);

  // Update global time from the primary video's timeupdate event
  useEffect(() => {
    const primaryVideo = mediaItems.find(item => item.track === 0 && item.type === 'video');
    const videoElement = primaryVideo ? videoRefs.current[primaryVideo.id] : null;

    const handleTimeUpdate = () => {
      if (videoElement && !interaction) {
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
  }, [dispatch, mediaItems, interaction]);

  // Dynamically resize the preview workspace to fit the container
  useLayoutEffect(() => {
    const resizePreview = () => {
      if (!containerRef.current || !previewRef.current) return;
      const [arW, arH] = aspectRatio.split(':').map(Number);
      const { width: containerWidth, height: containerHeight } = containerRef.current.getBoundingClientRect();

      let newWidth, newHeight;
      if (containerWidth / containerHeight > arW / arH) {
        newHeight = containerHeight;
        newWidth = newHeight * (arW / arH);
      } else {
        newWidth = containerWidth;
        newHeight = newWidth * (arH / arW);
      }

      const zoomFactor = zoom === 'fit' ? 1 : zoom;
      previewRef.current.style.width = `${newWidth * zoomFactor}px`;
      previewRef.current.style.height = `${newHeight * zoomFactor}px`;
    };

    resizePreview();
    const resizeObserver = new ResizeObserver(resizePreview);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, [aspectRatio, zoom]);

  // --- Interaction Handlers (Drag and Resize) ---

  const handleInteractionStart = (e: React.MouseEvent, type: Interaction['type'], item: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (!previewRef.current) return;
    dispatch(setSelectedItemId(item.id));

    const isVideoOrImage = item.type === 'video' || item.type === 'image';
    const itemWidth = item.width ?? (isVideoOrImage ? 100 : 30);
    const itemHeight = item.height ?? (isVideoOrImage ? 100 : 10);
    const position = item.position ?? { x: 0, y: 0 };

    setInteraction({
      type,
      itemId: item.id,
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y,
      startWidth: itemWidth,
      startHeight: itemHeight,
    });
  };

  useEffect(() => {
    const handleInteractionMove = (e: MouseEvent) => {
      if (!interaction || !previewRef.current) return;
      e.preventDefault();

      const rect = previewRef.current.getBoundingClientRect();
      const dx = ((e.clientX - interaction.startX) / rect.width) * 100;
      const dy = ((e.clientY - interaction.startY) / rect.height) * 100;

      let newWidth = interaction.startWidth;
      let newHeight = interaction.startHeight;
      let newX = interaction.startPosX;
      let newY = interaction.startPosY;

      if (interaction.type === 'drag') {
        newX = interaction.startPosX + dx;
        newY = interaction.startPosY + dy;
      } else { // Handle all resize types for free transform
        switch (interaction.type) {
          case 'resize-br':
            newWidth = interaction.startWidth + dx;
            newHeight = interaction.startHeight + dy;
            break;
          case 'resize-bl':
            newWidth = interaction.startWidth - dx;
            newHeight = interaction.startHeight + dy;
            newX = interaction.startPosX + dx;
            break;
          case 'resize-tr':
            newWidth = interaction.startWidth + dx;
            newHeight = interaction.startHeight - dy;
            newY = interaction.startPosY + dy;
            break;
          case 'resize-tl':
            newWidth = interaction.startWidth - dx;
            newHeight = interaction.startHeight - dy;
            newX = interaction.startPosX + dx;
            newY = interaction.startPosY + dy;
            break;
          case 'resize-n': // North (top) handle
            newHeight = interaction.startHeight - dy;
            newY = interaction.startPosY + dy;
            break;
          case 'resize-s': // South (bottom) handle
            newHeight = interaction.startHeight + dy;
            break;
          case 'resize-e': // East (right) handle
            newWidth = interaction.startWidth + dx;
            break;
          case 'resize-w': // West (left) handle
            newWidth = interaction.startWidth - dx;
            newX = interaction.startPosX + dx;
            break;
        }

        newWidth = Math.max(newWidth, 2); // Min size
        newHeight = Math.max(newHeight, 2);
      }

      // Snapping logic
      const snapThreshold = 2; // Percentage of workspace to snap
      let shouldSnap = false;

      // Check for snapping to left edge
      if (Math.abs(newX) < snapThreshold) {
        newX = 0;
        shouldSnap = true;
      }
      // Check for snapping to right edge
      if (Math.abs((newX + newWidth) - 100) < snapThreshold) {
        newWidth = 100 - newX;
        shouldSnap = true;
      }
      // Check for snapping to top edge
      if (Math.abs(newY) < snapThreshold) {
        newY = 0;
        shouldSnap = true;
      }
      // Check for snapping to bottom edge
      if (Math.abs((newY + newHeight) - 100) < snapThreshold) {
        newHeight = 100 - newY;
        shouldSnap = true;
      }

      setShowSnapOutline(shouldSnap);

      const updates: Partial<any> = {
        position: { x: newX, y: newY },
        width: newWidth,
        height: newHeight,
      };

      dispatch(updateMediaItem({ id: interaction.itemId, updates }));
    };

    const handleInteractionEnd = () => {
      setInteraction(null);
      setShowSnapOutline(false); // Hide outline on interaction end
    };

    if (interaction) {
      window.addEventListener('mousemove', handleInteractionMove);
      window.addEventListener('mouseup', handleInteractionEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleInteractionMove);
      window.removeEventListener('mouseup', handleInteractionEnd);
    };
  }, [interaction, dispatch]);


  // Filter out audio items from activeItems for rendering
  const visualMediaItems = mediaItems.filter(item => currentTime >= item.startTime && currentTime <= item.endTime && item.type !== 'audio');

  const renderMediaItem = (item: any) => {
    const isVideoOrImage = item.type === 'video' || item.type === 'image';
    const itemStyle: React.CSSProperties = {
      position: 'absolute',
      top: `${item.position?.y ?? 0}%`,
      left: `${item.position?.x ?? 0}%`,
      width: `${item.width ?? (isVideoOrImage ? 100 : 30)}%`,
      height: `${item.height ?? (isVideoOrImage ? 100 : 'auto')}%`,
      transform: `rotate(${item.rotation || 0}deg)`,
      cursor: 'move',
    };

    const handleClasses: { [key: string]: string } = {
      'tl': '-top-1.5 -left-1.5 cursor-nwse-resize',
      'tr': '-top-1.5 -right-1.5 cursor-nesw-resize',
      'bl': '-bottom-1.5 -left-1.5 cursor-nesw-resize',
      'br': '-bottom-1.5 -right-1.5 cursor-nwse-resize',
      'n': '-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize', // North
      's': '-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize', // South
      'e': 'top-1/2 -right-1.5 -translate-y-1/2 cursor-ew-resize', // East
      'w': 'top-1/2 -left-1.5 -translate-y-1/2 cursor-ew-resize', // West
    };

    return (
        <div
            key={item.id}
            style={itemStyle}
            className={selectedItemId === item.id ? 'outline outline-2 outline-blue-500' : ''}
            onMouseDown={(e) => handleInteractionStart(e, 'drag', item)}
        >
          {/* Render content based on type */}
          {item.type === 'video' && (
              <video
                  ref={ref => { if (ref) videoRefs.current[item.id] = ref; }}
                  src={item.url}
                  className="w-full h-full object-cover"
                  muted={item.isMuted}
                  loop
              />
          )}
          {item.type === 'image' && (
              <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
          )}
          {item.type === 'text' && (
              <div style={{
                fontSize: `${item.fontSize || 32}px`,
                fontFamily: item.fontFamily || 'Arial',
                color: item.fontColor || '#ffffff',
                fontWeight: item.fontWeight || 'normal',
                fontStyle: item.fontStyle || 'normal',
                textAlign: item.textAlign || 'left',
              }}>
                {item.content}
              </div>
          )}
          {/* Resizing Handles */}
          {selectedItemId === item.id && (
              <>
                {Object.entries(handleClasses).map(([handle, classes]) => (
                    <div
                        key={handle}
                        className={`absolute w-3 h-3 bg-white border border-gray-500 rounded-full z-10 ${classes}`}
                        onMouseDown={(e) => handleInteractionStart(e, `resize-${handle}` as Interaction['type'], item)}
                    />
                ))}
              </>
          )}
        </div>
    );
  };

  return (
      <div className="flex-1 flex flex-col bg-gray-100 min-h-0">
        {/* Top Controls: Zoom and Aspect Ratio */}
        <div className="flex items-center justify-end gap-4 p-2 bg-white border-b border-gray-200">
          <button
              onClick={() => setZoom('fit')}
              className="p-1 rounded-full hover:bg-gray-200 flex items-center gap-1 text-sm text-gray-700"
              title="Fit to Workspace"
          >
            <RatioIcon size={16} /> Fit
          </button>
          <select value={zoom} onChange={e => setZoom(e.target.value === 'fit' ? 'fit' : Number(e.target.value))} className="p-1 border border-gray-300 rounded-md text-sm">
            <option value="fit">Fit</option>
            <option value={0.25}>25%</option>
            <option value={0.5}>50%</option>
            <option value={0.75}>75%</option>
            <option value={1}>100%</option>
            <option value={1.5}>150%</option>
          </select>
          <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} className="p-1 border border-gray-300 rounded-md text-sm">
            <option value="16:9">16:9 Landscape</option>
            <option value="9:16">9:16 Portrait</option>
            <option value="1:1">1:1 Square</option>
            <option value="4:3">4:3 Classic</option>
          </select>
        </div>

        {/* Main Workspace */}
        <div ref={containerRef} className="flex-1 p-4 flex items-center justify-center overflow-hidden">
          <div
              ref={previewRef}
              className={`bg-black relative shadow-lg overflow-hidden transition-all duration-100 ease-out ${showSnapOutline ? 'outline outline-2 outline-green-500' : ''}`}
          >
            {visualMediaItems.sort((a, b) => (a.track || 0) - (b.track || 0)).map(renderMediaItem)}
          </div>
        </div>

        {/* Bottom Controls: Playback */}
        <div className="flex items-center justify-between p-2 bg-white border-t border-gray-200">
          <div className="text-sm text-gray-600 w-38">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={() => dispatch(setCurrentTime(Math.max(0, currentTime - 5)))} className="p-2 rounded-full hover:bg-gray-200">
              <SkipBackIcon size={20} className="text-gray-700" />
            </button>
            <button onClick={() => dispatch(setIsPlaying(!isPlaying))} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300">
              {isPlaying ? <PauseIcon size={25} className="text-gray-800" /> : <PlayIcon size={20} className="text-gray-800" />}
            </button>
            <button onClick={() => dispatch(setCurrentTime(Math.min(duration, currentTime + 5)))} className="p-2 rounded-full hover:bg-gray-200">
              <SkipForwardIcon size={20} className="text-gray-700" />
            </button>
          </div>
          <div className="flex justify-content-end space-x-4 w-28">
            <button className="p-2 rounded-full hover:bg-gray-200 text-right">
              <MaximizeIcon size={20} className="text-gray-700 inline-block" />
            </button>
          </div>
        </div>
      </div>
  );
};
