import React, { useEffect, useState, useRef } from 'react';
import { useVideoEditor } from '../context/VideoEditorContext';
import { ZoomInIcon, ZoomOutIcon, ScissorsIcon, VolumeIcon, Volume2Icon, VolumeXIcon, TextIcon, ImageIcon, PlusIcon, XIcon } from 'lucide-react';
export const Timeline = () => {
  const {
    currentTime,
    setCurrentTime,
    duration,
    mediaItems,
    updateMediaItem,
    selectedItemId,
    setSelectedItemId,
    showTrimControls,
    setShowTrimControls,
    trimItemId,
    setTrimItemId
  } = useVideoEditor();
  const timelineRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'playhead' | 'trimStart' | 'trimEnd' | 'move' | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartTime, setDragStartTime] = useState(0);
  const [dragItem, setDragItem] = useState<string | null>(null);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
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
      setCurrentTime(newTime);
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
      setSelectedItemId(itemId);
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
        setCurrentTime(newTime);
      } else if (dragItem && dragType) {
        const item = mediaItems.find(i => i.id === dragItem);
        if (!item) return;
        if (dragType === 'trimStart') {
          const newStartTime = Math.max(0, Math.min(item.endTime - 0.5, dragStartTime + deltaTime));
          updateMediaItem(dragItem, {
            startTime: newStartTime
          });
        } else if (dragType === 'trimEnd') {
          const newEndTime = Math.max(item.startTime + 0.5, Math.min(duration, dragStartTime + deltaTime));
          updateMediaItem(dragItem, {
            endTime: newEndTime
          });
        } else if (dragType === 'move') {
          const maxStartTime = duration - (item.endTime - item.startTime);
          const newStartTime = Math.max(0, Math.min(maxStartTime, dragStartTime + deltaTime));
          const newEndTime = newStartTime + (item.endTime - item.startTime);
          updateMediaItem(dragItem, {
            startTime: newStartTime,
            endTime: newEndTime
          });
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
  }, [isDragging, dragStartX, dragStartTime, dragType, dragItem, duration, mediaItems, setCurrentTime, updateMediaItem, currentTime]);
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
    setZoom(prev => Math.min(prev * 1.2, 3));
  };
  const zoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.5));
  };
  // Handle trim button click
  const handleTrimClick = () => {
    if (selectedItemId) {
      const item = mediaItems.find(i => i.id === selectedItemId);
      if (item) {
        setTrimStart(item.startTime);
        setTrimEnd(item.endTime);
        setTrimItemId(selectedItemId);
        setShowTrimControls(true);
      }
    } else {
      alert('Please select a media item to trim');
    }
  };
  // Apply trim
  const applyTrim = () => {
    if (trimItemId) {
      updateMediaItem(trimItemId, {
        startTime: trimStart,
        endTime: trimEnd
      });
      setShowTrimControls(false);
      setTrimItemId(null);
    }
  };
  // Cancel trim
  const cancelTrim = () => {
    setShowTrimControls(false);
    setTrimItemId(null);
  };
  // Toggle mute for audio/video
  const toggleMute = () => {
    if (selectedItemId) {
      const item = mediaItems.find(i => i.id === selectedItemId);
      if (item && (item.type === 'audio' || item.type === 'video')) {
        updateMediaItem(selectedItemId, {
          isMuted: !item.isMuted
        });
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
  return <div className="flex flex-col h-64 border-t border-gray-200 bg-white">
      <div className="flex items-center justify-between p-2 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <button className={`p-1 rounded hover:bg-gray-100 ${selectedItemId ? 'text-gray-800' : 'text-gray-400'}`} onClick={handleTrimClick} disabled={!selectedItemId}>
            <ScissorsIcon size={16} className={selectedItemId ? 'text-gray-600' : 'text-gray-400'} />
          </button>
          <button className={`p-1 rounded hover:bg-gray-100 ${selectedItemId && (mediaItems.find(i => i.id === selectedItemId)?.type === 'audio' || mediaItems.find(i => i.id === selectedItemId)?.type === 'video') ? 'text-gray-800' : 'text-gray-400'}`} onClick={toggleMute} disabled={!selectedItemId || !(mediaItems.find(i => i.id === selectedItemId)?.type === 'audio' || mediaItems.find(i => i.id === selectedItemId)?.type === 'video')}>
            {getVolumeIcon()}
          </button>
          <button className="p-1 rounded hover:bg-gray-100">
            <TextIcon size={16} className="text-gray-600" />
          </button>
          <button className="p-1 rounded hover:bg-gray-100">
            <ImageIcon size={16} className="text-gray-600" />
          </button>
        </div>
        <div className="flex items-center space-x-2">
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
      {showTrimControls && <div className="p-3 bg-gray-100 border-b border-gray-200">
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
              <input type="number" min="0" max={trimEnd - 0.1} step="0.1" value={trimStart} onChange={e => setTrimStart(parseFloat(e.target.value))} className="w-full px-2 py-1 border border-gray-300 rounded text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                End Time
              </label>
              <input type="number" min={trimStart + 0.1} max={duration} step="0.1" value={trimEnd} onChange={e => setTrimEnd(parseFloat(e.target.value))} className="w-full px-2 py-1 border border-gray-300 rounded text-sm" />
            </div>
          </div>
          <button onClick={applyTrim} className="mt-3 w-full bg-blue-500 text-white py-1 rounded text-sm hover:bg-blue-600">
            Apply Trim
          </button>
        </div>}
      <div className="flex-1 overflow-x-auto overflow-y-hidden relative">
        {/* Time ruler */}
        <div className="sticky top-0 h-6 bg-gray-50 border-b border-gray-200 flex items-end z-10">
          {timeMarkers.map(time => <div key={time} className="absolute flex flex-col items-center" style={{
          left: `${timeToPosition(time)}px`
        }}>
              <div className="h-2 w-px bg-gray-400"></div>
              <span className="text-xs text-gray-500">
                {Math.floor(time / 60)}:
                {(time % 60).toString().padStart(2, '0')}
              </span>
            </div>)}
        </div>
        {/* Timeline content */}
        <div ref={timelineRef} className="relative" style={{
        width: `${timeToPosition(duration)}px`,
        minHeight: '200px'
      }} onClick={handleTimelineClick}>
          {/* Playhead */}
          <div className="absolute top-0 bottom-0 w-px bg-red-500 z-20" style={{
          left: `${timeToPosition(currentTime)}px`
        }}>
            <div className="w-4 h-4 bg-red-500 rounded-full -ml-2 cursor-ew-resize" onMouseDown={e => handleMouseDown(e, 'playhead')}></div>
          </div>
          {/* Tracks */}
          {trackNumbers.map(trackNumber => <div key={trackNumber} className="h-16 border-b border-gray-200 relative">
              {trackItems[trackNumber].map(item => <div key={item.id} className={`absolute h-12 my-2 rounded-md flex items-center px-2 cursor-move ${selectedItemId === item.id ? 'ring-2 ring-blue-500' : ''}`} style={{
            left: `${timeToPosition(item.startTime)}px`,
            width: `${timeToPosition(item.endTime - item.startTime)}px`,
            backgroundColor: item.type === 'video' ? '#9d84e8' : item.type === 'audio' ? '#4caf50' : item.type === 'text' ? '#ff9800' : '#2196f3',
            opacity: item.isMuted ? 0.5 : 0.8
          }} onMouseDown={e => handleMouseDown(e, 'move', item.id)} onClick={e => {
            e.stopPropagation();
            setSelectedItemId(item.id);
          }}>
                  <span className="text-white text-xs font-medium truncate">
                    {item.name} {item.isMuted ? '(Muted)' : ''}
                  </span>
                  {/* Trim handles */}
                  <div className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize" onMouseDown={e => handleMouseDown(e, 'trimStart', item.id)}></div>
                  <div className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize" onMouseDown={e => handleMouseDown(e, 'trimEnd', item.id)}></div>
                </div>)}
            </div>)}
          {/* Add track button */}
          <div className="h-12 flex items-center justify-center border-b border-gray-200">
            <button className="flex items-center text-xs text-gray-600 hover:text-gray-800">
              <PlusIcon size={14} className="mr-1" />
              Add Track
            </button>
          </div>
        </div>
      </div>
    </div>;
};