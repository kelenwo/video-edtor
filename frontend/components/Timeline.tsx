'use client'

import React, { useEffect, useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import {
  selectCurrentTime,
  selectDuration,
  selectMediaItems,
  selectSelectedItemId,
  selectShowTrimControls,
  selectTrimItemId,
  selectIsPlaying,
  setCurrentTime,
  setSelectedItemId,
  updateMediaItem,
  setShowTrimControls,
  setTrimItemId,
  addMediaItem, // Import addMediaItem for duplication
  removeMediaItem, // Import removeMediaItem for deletion
} from '../redux/videoEditorSlice';
import { ZoomInIcon, ZoomOutIcon, ScissorsIcon, VolumeIcon, Volume2Icon, VolumeXIcon, TextIcon, ImageIcon, PlusIcon, XIcon } from 'lucide-react';
import WaveSurfer from 'wavesurfer.js'; // Import Wavesurfer.js

// New WaveformDisplay component using Wavesurfer.js
const WaveformDisplay = ({ url, color, isMuted }: { url: string; color: string; isMuted: boolean }) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false); // New state to track if audio is loaded

  useEffect(() => {
    if (waveformRef.current && url) { // Ensure URL is present before initializing
      // Destroy existing instance if it exists and was loaded
      if (wavesurfer.current && isAudioLoaded) {
        wavesurfer.current.destroy();
        wavesurfer.current = null;
        setIsAudioLoaded(false); // Reset load state
      }

      // Initialize WaveSurfer.js
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: color,
        progressColor: '#555', // A darker shade for progress
        cursorColor: 'transparent', // Hide cursor as we have a global playhead
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        height: 48, // Match the height of the timeline item
        hideScrollbar: true,
        interact: false, // Prevent direct interaction with waveform
        dragToSeek: false, // Prevent seeking by dragging on the waveform
      });

      // Event listener for when audio is loaded
      wavesurfer.current.on('ready', () => {
        setIsAudioLoaded(true);
      });

      // Event listener for errors during loading
      wavesurfer.current.on('error', (error) => {
        console.error('Wavesurfer.js error:', error);
        setIsAudioLoaded(false); // Mark as not loaded on error
      });

      // Load the audio file
      wavesurfer.current.load(url);

      // Set mute state
      wavesurfer.current.setVolume(isMuted ? 0 : 1);

      // Cleanup on component unmount or dependency change
      return () => {
        if (wavesurfer.current && isAudioLoaded) { // Only destroy if it was successfully loaded
          wavesurfer.current.destroy();
          wavesurfer.current = null; // Clear the ref
        }
      };
    }
  }, [url, color]); // Re-initialize if URL or color changes

  // Update mute state if it changes
  useEffect(() => {
    if (wavesurfer.current) {
      wavesurfer.current.setVolume(isMuted ? 0 : 1);
    }
  }, [isMuted]);

  return <div ref={waveformRef} className="w-full h-full"></div>;
};


export const Timeline = () => {
  const dispatch = useAppDispatch();
  const currentTime = useAppSelector(selectCurrentTime);
  const duration = useAppSelector(selectDuration);
  const mediaItems = useAppSelector(selectMediaItems);
  const selectedItemId = useAppSelector(selectSelectedItemId);
  const showTrimControls = useAppSelector(selectShowTrimControls);
  const trimItemId = useAppSelector(selectTrimItemId);
  const isPlaying = useAppSelector(selectIsPlaying);

  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'playhead' | 'trimStart' | 'trimEnd' | 'move' | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartTime, setDragStartTime] = useState(0);
  const [dragItem, setDragItem] = useState<string | null>(null);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);

  // State for horizontal zoom slider
  const [horizontalZoom, setHorizontalZoom] = useState(1); // 1 means 100 pixels per second
  const minPixelsPerSecond = 10; // Minimum compression (e.g., 10 pixels per second)
  const maxPixelsPerSecond = 500; // Maximum zoom (e.g., 500 pixels per second)

  // Calculate pixels per second based on horizontalZoom and duration
  const pixelsPerSecond = React.useMemo(() => {
    if (timelineScrollRef.current) {
      const containerWidth = timelineScrollRef.current.clientWidth;
      // If horizontalZoom is 0, it means "fit to view"
      if (horizontalZoom === 0) {
        return containerWidth / duration; // Fit entire duration into view
      }
    }
    // Otherwise, use the slider value directly as pixels per second
    return horizontalZoom;
  }, [horizontalZoom, duration]);

  // Time markers
  const timeMarkers = [];
  // Adjust marker step based on current pixelsPerSecond for better readability
  let markerStep = 1;
  if (pixelsPerSecond < 20) markerStep = 10;
  else if (pixelsPerSecond < 50) markerStep = 5;
  else if (pixelsPerSecond < 100) markerStep = 2;
  else markerStep = 1;

  for (let i = 0; i <= duration + markerStep; i += markerStep) { // Add markerStep to duration to ensure last marker is shown
    timeMarkers.push(i);
  }

  // Convert time to position
  const timeToPosition = React.useCallback((time: number) => {
    return time * pixelsPerSecond;
  }, [pixelsPerSecond]);

  // Convert position to time
  const positionToTime = React.useCallback((position: number) => {
    return position / pixelsPerSecond;
  }, [pixelsPerSecond]);

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

  // Handle start dragging
  const handleMouseDown = (e: React.MouseEvent, type: 'playhead' | 'trimStart' | 'trimEnd' | 'move', itemId?: string) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragType(type);
    setDragStartX(e.clientX);

    if (type === 'playhead') {
      setDragStartTime(currentTime);
    } else if (itemId) {
      setDragItem(itemId);
      dispatch(setSelectedItemId(itemId));
      const item = mediaItems.find(i => i.id === itemId);
      if (item) {
        if (type === 'trimStart') {
          setDragStartTime(item.startTime);
        } else if (type === 'trimEnd') {
          setDragStartTime(item.endTime);
        } else if (type === 'move') {
          setDragStartTime(item.startTime);
        }
      }
    }
  };

  // Handle mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !timelineRef.current) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const deltaX = e.clientX - dragStartX;
      const deltaTime = positionToTime(deltaX);

      if (dragType === 'playhead') {
        const newTime = Math.max(0, Math.min(duration, dragStartTime + deltaTime));
        dispatch(setCurrentTime(newTime));
      } else if (dragItem && dragType) {
        const item = mediaItems.find(i => i.id === dragItem);
        if (!item) return;

        if (dragType === 'trimStart') {
          const newStartTime = Math.max(0, Math.min(item.endTime - 0.5, dragStartTime + deltaTime));
          dispatch(updateMediaItem({
            id: dragItem,
            updates: { startTime: newStartTime }
          }));
        } else if (dragType === 'trimEnd') {
          const newEndTime = Math.max(item.startTime + 0.5, Math.min(duration, dragStartTime + deltaTime));
          dispatch(updateMediaItem({
            id: dragItem,
            updates: { endTime: newEndTime }
          }));
        } else if (dragType === 'move') {
          const maxStartTime = duration - (item.endTime - item.startTime);
          const newStartTime = Math.max(0, Math.min(maxStartTime, dragStartTime + deltaTime));
          const newEndTime = newStartTime + (item.endTime - item.startTime);
          dispatch(updateMediaItem({
            id: dragItem,
            updates: {
              startTime: newStartTime,
              endTime: newEndTime
            }
          }));
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragType(null);
      setDragItem(null);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStartX, dragStartTime, dragType, dragItem, duration, mediaItems, currentTime, dispatch, positionToTime]);

  // Auto-scroll timeline to follow playhead during playback
  useEffect(() => {
    if (isPlaying && timelineScrollRef.current && !isDragging) {
      const playheadPosition = timeToPosition(currentTime);
      const scrollContainer = timelineScrollRef.current;
      const containerWidth = scrollContainer.clientWidth;
      const scrollLeft = scrollContainer.scrollLeft;

      // Calculate if playhead is outside visible area
      const playheadOffset = playheadPosition - scrollLeft;

      // Auto-scroll if playhead is near the edges or outside view
      if (playheadOffset > containerWidth - 100) {
        // Scroll right to keep playhead in view
        scrollContainer.scrollTo({
          left: playheadPosition - containerWidth / 2,
          behavior: 'smooth'
        });
      } else if (playheadOffset < 100 && scrollLeft > 0) {
        // Scroll left to keep playhead in view
        scrollContainer.scrollTo({
          left: Math.max(0, playheadPosition - containerWidth / 2),
          behavior: 'smooth'
        });
      }
    }
  }, [currentTime, isPlaying, isDragging, timeToPosition]);

  // Keybindings for Delete and Duplicate
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (selectedItemId) {
        const selectedItem = mediaItems.find(item => item.id === selectedItemId);

        // Delete (Backspace or Delete key)
        if (event.key === 'Delete' || event.key === 'Backspace') {
          event.preventDefault(); // Prevent browser back navigation
          dispatch(removeMediaItem(selectedItemId));
          dispatch(setSelectedItemId(null)); // Deselect after deletion
        }

        // Duplicate (Ctrl+D or Cmd+D)
        if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
          event.preventDefault(); // Prevent browser default (e.g., bookmarking)
          if (selectedItem) {
            const duplicatedItem = {
              ...selectedItem,
              id: Math.random().toString(36).substr(2, 9), // Generate a new unique ID
              startTime: selectedItem.startTime + 1, // Offset slightly to make it visible
              endTime: selectedItem.endTime + 1,
              name: `${selectedItem.name} (Copy)`, // Indicate it's a copy
              track: selectedItem.track + 1, // Place on a new track to avoid immediate overlap
            };
            dispatch(addMediaItem(duplicatedItem));
            dispatch(setSelectedItemId(duplicatedItem.id)); // Select the new duplicated item
          }
        }
      }
      // TODO: Implement Ctrl+Z for Undo/Redo. This requires a separate state management
      // for history (e.g., using a Redux middleware like redux-undo or implementing a custom history stack).
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedItemId, mediaItems, dispatch]);


  // Group media items by track
  const trackItems: Record<number, typeof mediaItems> = {};
  mediaItems.forEach(item => {
    if (!trackItems[item.track]) {
      trackItems[item.track] = [];
    }
    trackItems[item.track].push(item);
  });

  // Get all track numbers and sort them
  const trackNumbers = Object.keys(trackItems).map(Number).sort((a, b) => a - b);

  const zoomIn = () => {
    // This zoom is for vertical track height, not horizontal timeline scale
    setZoom(prev => Math.min(prev * 1.2, 3));
  };

  const zoomOut = () => {
    // This zoom is for vertical track height, not horizontal timeline scale
    setZoom(prev => Math.max(prev / 1.2, 0.5));
  };

  // Handle trim button click
  const handleTrimClick = () => {
    if (selectedItemId) {
      const item = mediaItems.find(i => i.id === selectedItemId);
      if (item) {
        setTrimStart(item.startTime);
        setTrimEnd(item.endTime);
        dispatch(setTrimItemId(selectedItemId));
        dispatch(setShowTrimControls(true));
      }
    } else {
      // Replaced alert with a more user-friendly message
      console.warn('Please select a media item to trim.');
      // You might want to add a visual notification here, e.g., a toast message
    }
  };

  // Apply trim
  const applyTrim = () => {
    if (trimItemId) {
      dispatch(updateMediaItem({
        id: trimItemId,
        updates: {
          startTime: trimStart,
          endTime: trimEnd
        }
      }));
      dispatch(setShowTrimControls(false));
      dispatch(setTrimItemId(null));
    }
  };

  // Cancel trim
  const cancelTrim = () => {
    dispatch(setShowTrimControls(false));
    dispatch(setTrimItemId(null));
  };

  // Toggle mute for audio/video
  const toggleMute = () => {
    if (selectedItemId) {
      const item = mediaItems.find(i => i.id === selectedItemId);
      if (item && (item.type === 'audio' || item.type === 'video')) {
        dispatch(updateMediaItem({
          id: selectedItemId,
          updates: { isMuted: !item.isMuted }
        }));
      }
    }
  };

  // Get volume icon based on selected item
  const getVolumeIcon = () => {
    if (selectedItemId) {
      const item = mediaItems.find(i => i.id === selectedItemId);
      if (item && (item.type === 'audio' || item.type === 'video')) {
        if (item.isMuted) {
          return <VolumeXIcon size={16} className="text-gray-600" />;
        } else {
          return <Volume2Icon size={16} className="text-gray-600" />;
        }
      }
    }
    return <VolumeIcon size={16} className="text-gray-600" />;
  };

  // Effect to set initial horizontal zoom to "fit to view"
  useEffect(() => {
    if (timelineScrollRef.current && duration > 0) {
      // Set horizontalZoom to 0 to indicate "fit to view" mode initially
      setHorizontalZoom(0);
    }
  }, [duration]); // Recalculate if duration changes

  return (
      <div className="flex flex-col h-64 border-t border-gray-200 bg-white">
        <div className="flex items-center justify-between p-2 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <button
                className={`p-1 rounded hover:bg-gray-100 ${selectedItemId ? 'text-gray-800' : 'text-gray-400'}`}
                onClick={handleTrimClick}
                disabled={!selectedItemId}
            >
              <ScissorsIcon size={16} className={selectedItemId ? 'text-gray-600' : 'text-gray-400'} />
            </button>
            <button
                className={`p-1 rounded hover:bg-gray-100 ${selectedItemId && (mediaItems.find(i => i.id === selectedItemId)?.type === 'audio' || mediaItems.find(i => i.id === selectedItemId)?.type === 'video') ? 'text-gray-800' : 'text-gray-400'}`}
                onClick={toggleMute}
                disabled={!selectedItemId || !(mediaItems.find(i => i.id === selectedItemId)?.type === 'audio' || mediaItems.find(i => i.id === selectedItemId)?.type === 'video')}
            >
              {getVolumeIcon()}
            </button>
            <button className="p-1 rounded hover:bg-gray-100">
              <TextIcon size={16} className="text-gray-600" />
            </button>
            <button className="p-1 rounded hover:bg-gray-100">
              <ImageIcon size={16} className="text-gray-600" />
            </button>
          </div>

          {/* Horizontal Zoom Slider (New) */}
          <div className="flex items-center justify-center">
            <span className="text-xs text-gray-600 mr-2">Timeline Scale:</span>
            <input
                type="range"
                min={minPixelsPerSecond}
                max={maxPixelsPerSecond}
                value={horizontalZoom === 0 ? (timelineScrollRef.current && duration > 0 ? timelineScrollRef.current.clientWidth / duration : minPixelsPerSecond) : horizontalZoom} // Display current pps if in fit mode
                onChange={(e) => setHorizontalZoom(parseFloat(e.target.value))}
                className="w-48 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
            />
            <button
                onClick={() => setHorizontalZoom(0)} // Set to 0 to trigger "fit to view"
                className="ml-2 p-1 rounded-md bg-blue-500 text-white text-xs hover:bg-blue-600"
                title="Fit timeline to view"
            >
              Fit
            </button>
          </div>
          <div className="flex items-center space-x-2">
            {/* Vertical Zoom Controls (existing) */}
            <button onClick={zoomOut} className="p-1 rounded hover:bg-gray-100">
              <ZoomOutIcon size={16} className="text-gray-600" />
            </button>
            <span className="text-xs text-gray-600">
            {Math.round(zoom * 100)}%
          </span>
            <button onClick={zoomIn} className="p-1 rounded hover:bg-gray-100">
              <ZoomInIcon size={16} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Trim controls */}
        {showTrimControls && (
            <div className="p-3 bg-gray-100 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">Trim Selection</h4>
                <button onClick={cancelTrim} className="text-gray-500 hover:text-gray-700">
                  <XIcon size={16} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Start Time
                  </label>
                  <input
                      type="number"
                      min="0"
                      max={trimEnd - 0.1}
                      step="0.1"
                      value={trimStart}
                      onChange={e => setTrimStart(parseFloat(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    End Time
                  </label>
                  <input
                      type="number"
                      min={trimStart + 0.1}
                      max={duration}
                      step="0.1"
                      value={trimEnd}
                      onChange={e => setTrimEnd(parseFloat(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
              <button onClick={applyTrim} className="mt-3 w-full bg-blue-500 text-white py-1 rounded text-sm hover:bg-blue-600">
                Apply Trim
              </button>
            </div>
        )}

        <div ref={timelineScrollRef} className="flex-1 overflow-x-auto overflow-y-auto relative">
          {/* Time ruler */}
          <div className="sticky top-0 h-6 bg-gray-50 border-b border-gray-200 flex items-end z-10">
            {timeMarkers.map(time => (
                <div key={time} className="absolute flex flex-col items-center" style={{
                  left: `${timeToPosition(time)}px`
                }}>
                  <div className="h-2 w-px bg-gray-400"></div>
                  <span className="text-xs text-gray-500">
                {Math.floor(time / 60)}:
                    {(time % 60).toString().padStart(2, '0')}
              </span>
                </div>
            ))}
          </div>

          {/* Timeline content */}
          <div
              ref={timelineRef}
              className="relative"
              style={{
                width: `${timeToPosition(duration)}px`,
              }}
              onClick={handleTimelineClick}
          >
            {/* Playhead */}
            <div
                className="absolute top-0 bottom-0 w-px bg-red-500 z-20"
                style={{
                  left: `${timeToPosition(currentTime)}px`
                }}
            >
              <div
                  className="w-4 h-4 bg-red-500 rounded-full -ml-2 cursor-ew-resize"
                  onMouseDown={e => handleMouseDown(e, 'playhead')}
              ></div>
            </div>

            {/* Tracks */}
            {trackNumbers.map(trackNumber => (
                <div key={trackNumber} className="h-16 border-b border-gray-200 relative">
                  {trackItems[trackNumber].map(item => (
                      <div
                          key={item.id}
                          className={`absolute h-12 my-2 rounded-md flex items-center px-2 cursor-move ${
                              selectedItemId === item.id ? 'ring-2 ring-blue-500' : ''
                          }`}
                          style={{
                            left: `${timeToPosition(item.startTime)}px`,
                            width: `${timeToPosition(item.endTime - item.startTime)}px`,
                            backgroundColor: item.type === 'audio' ? 'transparent' : (item.type === 'video' ? '#9d84e8' : item.type === 'text' ? '#ff9800' : '#2196f3'),
                            opacity: item.isMuted ? 0.5 : 0.8
                          }}
                          onMouseDown={e => handleMouseDown(e, 'move', item.id)}
                          onClick={e => {
                            e.stopPropagation();
                            dispatch(setSelectedItemId(item.id));
                          }}
                      >
                        {item.type === 'audio' ? (
                            <WaveformDisplay
                                url={item.url || ''} // Pass the audio URL
                                color={item.color || '#4caf50'}
                                isMuted={item.isMuted || false}
                            />
                        ) : (
                            <span className="text-white text-xs font-medium truncate">
                      {item.name} {item.isMuted ? '(Muted)' : ''}
                    </span>
                        )}
                        {/* Trim handles */}
                        <div
                            className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize"
                            onMouseDown={e => handleMouseDown(e, 'trimStart', item.id)}
                        ></div>
                        <div
                            className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize"
                            onMouseDown={e => handleMouseDown(e, 'trimEnd', item.id)}
                        ></div>
                      </div>
                  ))}
                </div>
            ))}

            {/* Add track button */}
            <div className="h-12 flex items-center justify-center border-b border-gray-200">
              <button className="flex items-center text-xs text-gray-600 hover:text-gray-800">
                <PlusIcon size={14} className="mr-1" />
                Add Track
              </button>
            </div>
          </div>
        </div>
      </div>
  );
};
