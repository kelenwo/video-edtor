'use client';

import React, { useState, useRef, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Play, Pause, RotateCcw, RotateCw, AlignLeft, AlignRight, ZoomIn, ZoomOut, Minus, Plus } from 'lucide-react';
import VideoPlayer from './VideoPlayer';
import AudioWaveform from './AudioWaveform';

export interface TimelineClip {
  id: string;
  title: string;
  type: 'video' | 'audio' | 'subtitle' | 'image';
  src: string;
  start: number;
  duration: number;
  color: string;
  thumbnail?: string;
  waveformData?: number[];
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'subtitle';
  color: string;
  clips: TimelineClip[];
  height: number;
  visible: boolean;
}

interface AdvancedTimelineProps {
  tracks: TimelineTrack[];
  onTracksChange: (tracks: TimelineTrack[]) => void;
  currentTime: number;
  duration: number;
  onTimeChange: (time: number) => void;
  onPlayPause: () => void;
  isPlaying: boolean;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onClipSelect?: (clip: TimelineClip) => void;
}

const PIXELS_PER_SECOND = 50;

const AdvancedTimeline: React.FC<AdvancedTimelineProps> = ({
  tracks,
  onTracksChange,
  currentTime,
  duration,
  onTimeChange,
  onPlayPause,
  isPlaying,
  zoom,
  onZoomChange,
  onClipSelect
}) => {
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [selectedClip, setSelectedClip] = useState<string | null>(null);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current || isDraggingPlayhead) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / (PIXELS_PER_SECOND * zoom)) * 1000;
    onTimeChange(Math.max(0, Math.min(newTime, duration * 1000)) / 1000);
  };

  const handlePlayheadMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingPlayhead(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingPlayhead || !timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const newTime = (mouseX / (PIXELS_PER_SECOND * zoom)) * 1000;
    onTimeChange(Math.max(0, Math.min(newTime, duration * 1000)) / 1000);
  };

  const handleMouseUp = () => {
    setIsDraggingPlayhead(false);
  };

  useEffect(() => {
    if (isDraggingPlayhead) {
      document.addEventListener('mousemove', handleMouseMove as any);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove as any);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingPlayhead, duration, zoom, onTimeChange]);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const { source, destination } = result;
    const newTracks = [...tracks];
    
    const sourceTrack = newTracks.find(track => track.id === source.droppableId);
    const destTrack = newTracks.find(track => track.id === destination.droppableId);
    
    if (!sourceTrack || !destTrack) return;
    
    const [movedClip] = sourceTrack.clips.splice(source.index, 1);
    destTrack.clips.splice(destination.index, 0, movedClip);
    
    onTracksChange(newTracks);
  };

  const handleClipClick = (clipId: string) => {
    setSelectedClip(clipId);
    
    // Find the clicked clip and call onClipSelect
    for (const track of tracks) {
      const clip = track.clips.find(c => c.id === clipId);
      if (clip && onClipSelect) {
        onClipSelect(clip);
        break;
      }
    }
  };

  const handleZoomIn = () => {
    onZoomChange(Math.min(3, zoom + 0.1));
  };

  const handleZoomOut = () => {
    onZoomChange(Math.max(0.5, zoom - 0.1));
  };

  useEffect(() => {
    if (duration > 0) {
      setPlayheadPosition((currentTime / duration) * 100);
    }
  }, [currentTime, duration]);

  const renderClipContent = (clip: TimelineClip) => {
    switch (clip.type) {
      case 'video':
        return (
          <div className="clip-content video-clip">
            {clip.thumbnail && (
              <img 
                src={clip.thumbnail} 
                alt={clip.title}
                className="clip-thumbnail"
              />
            )}
            <div className="clip-overlay">
              <span className="clip-title">{clip.title}</span>
            </div>
          </div>
        );
      
      case 'audio':
        return (
          <div className="clip-content audio-clip">
            <div className="audio-waveform-preview">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="waveform-bar"
                  style={{
                    height: `${20 + Math.random() * 60}%`,
                    backgroundColor: clip.color
                  }}
                />
              ))}
            </div>
            <div className="clip-overlay">
              <span className="clip-title">{clip.title}</span>
            </div>
          </div>
        );
      
      case 'subtitle':
        return (
          <div className="clip-content subtitle-clip">
            <div className="subtitle-text">
              <span className="clip-title">{clip.title}</span>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="clip-content">
            <span className="clip-title">{clip.title}</span>
          </div>
        );
    }
  };

  return (
    <div className="advanced-timeline">
      {/* Timeline Controls */}
      <div className="timeline-controls">
        <div className="playback-controls">
          <button onClick={onPlayPause} className="control-button">
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <span className="time-display">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
        
        <div className="zoom-controls">
          <button onClick={handleZoomOut} className="control-button">
            <ZoomOut size={16} />
          </button>
          <span className="zoom-level">{Math.round(zoom * 100)}%</span>
          <button onClick={handleZoomIn} className="control-button">
            <ZoomIn size={16} />
          </button>
        </div>
      </div>

      {/* Timeline Ruler */}
      <div className="timeline-ruler">
        <div className="ruler-markings">
          {[...Array(Math.ceil(duration / 10))].map((_, i) => (
            <div key={i} className="ruler-mark" style={{ left: `${(i * 10 / duration) * 100}%` }}>
              <div className="mark-line"></div>
              <span className="mark-label">{formatTime(i * 10)}</span>
            </div>
          ))}
        </div>
        <div 
          className="playhead"
          style={{ left: `${playheadPosition}%` }}
          onMouseDown={handlePlayheadMouseDown}
        >
          <div className="playhead-line"></div>
          <div className="playhead-triangle"></div>
        </div>
      </div>

      {/* Timeline Tracks */}
      <div className="timeline-tracks">
        {tracks.length === 0 ? (
          <div className="empty-timeline">
            <div className="empty-timeline-content">
              <div className="text-4xl mb-4">📹</div>
              <h3 className="text-lg font-semibold mb-2">Empty Timeline</h3>
              <p className="text-sm text-gray-400">Upload media to see it here</p>
            </div>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="timeline">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="tracks-container"
                >
                  {tracks.map((track, trackIndex) => (
                    <div key={track.id} className="track-row">
                      {/* Track Header */}
                      <div className="track-header">
                        <div className="track-info">
                          <div 
                            className="track-color-indicator"
                            style={{ backgroundColor: track.color }}
                          ></div>
                          <span className="track-name">{track.name}</span>
                          <span className="track-clip-count">({track.clips.length} clips)</span>
                        </div>
                        <div className="track-controls">
                          <button className="track-visibility-toggle">
                            👁️
                          </button>
                        </div>
                      </div>

                      {/* Track Content */}
                      <Droppable droppableId={track.id}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="track-content"
                            style={{ height: `${track.height}px` }}
                          >
                            <div
                              ref={timelineRef}
                              className="timeline-area"
                              onClick={handleTimelineClick}
                              onMouseMove={handleMouseMove}
                              style={{
                                backgroundImage: `repeating-linear-gradient(
                                  90deg,
                                  transparent,
                                  transparent ${49 * zoom}px,
                                  #374151 ${49 * zoom}px,
                                  #374151 ${50 * zoom}px
                                )`
                              }}
                            >
                              {track.clips.map((clip, clipIndex) => (
                                <Draggable key={clip.id} draggableId={clip.id} index={clipIndex}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={`timeline-clip ${selectedClip === clip.id ? 'selected' : ''} ${
                                        snapshot.isDragging ? 'dragging' : ''
                                      }`}
                                      style={{
                                        ...provided.draggableProps.style,
                                        left: `${(clip.start / duration) * 100}%`,
                                        width: `${(clip.duration / duration) * 100}%`,
                                        backgroundColor: clip.color,
                                        minWidth: '20px',
                                        zIndex: snapshot.isDragging ? 1000 : 1
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleClipClick(clip.id);
                                      }}
                                    >
                                      {renderClipContent(clip)}
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                            </div>
                          </div>
                        )}
                      </Droppable>
                    </div>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      <style jsx>{`
        .advanced-timeline {
          background: #1f2937;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .timeline-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #374151;
          border-bottom: 1px solid #4b5563;
        }
        
        .playback-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .control-button {
          background: #4b5563;
          border: none;
          border-radius: 4px;
          padding: 6px;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .control-button:hover {
          background: #6b7280;
          transform: scale(1.05);
        }
        
        .time-display {
          font-size: 14px;
          font-weight: 500;
          color: #e5e7eb;
          font-family: 'Courier New', monospace;
        }
        
        .zoom-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .zoom-level {
          font-size: 12px;
          color: #9ca3af;
          min-width: 40px;
          text-align: center;
          font-weight: 500;
        }
        
        .timeline-ruler {
          position: relative;
          height: 40px;
          background: #374151;
          border-bottom: 1px solid #4b5563;
        }
        
        .ruler-markings {
          position: relative;
          height: 100%;
        }
        
        .ruler-mark {
          position: absolute;
          top: 0;
          height: 100%;
        }
        
        .mark-line {
          width: 1px;
          height: 20px;
          background: #6b7280;
          margin-top: 8px;
        }
        
        .mark-label {
          position: absolute;
          top: 24px;
          left: -20px;
          width: 40px;
          text-align: center;
          font-size: 10px;
          color: #9ca3af;
          font-family: 'Courier New', monospace;
        }
        
        .playhead {
          position: absolute;
          top: 0;
          height: 100%;
          z-index: 10;
          cursor: ew-resize;
        }
        
        .playhead-line {
          width: 2px;
          height: 100%;
          background: #ef4444;
          box-shadow: 0 0 4px rgba(239, 68, 68, 0.5);
        }
        
        .playhead-triangle {
          position: absolute;
          top: -4px;
          left: -4px;
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-bottom: 8px solid #ef4444;
        }
        
        .timeline-tracks {
          max-height: 400px;
          overflow-y: auto;
        }
        
        .track-row {
          border-bottom: 1px solid #374151;
          margin-bottom: 8px;
        }
        
        .track-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #374151;
          min-height: 40px;
        }
        
        .track-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .track-color-indicator {
          width: 12px;
          height: 12px;
          border-radius: 2px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }
        
        .track-name {
          font-size: 12px;
          color: #e5e7eb;
          font-weight: 500;
        }
        
        .track-clip-count {
          font-size: 10px;
          color: #9ca3af;
        }
        
        .track-controls {
          display: flex;
          gap: 4px;
        }
        
        .track-visibility-toggle {
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 2px;
          border-radius: 2px;
          transition: color 0.2s;
        }
        
        .track-visibility-toggle:hover {
          color: #e5e7eb;
        }
        
        .track-content {
          position: relative;
          background: #1f2937;
          margin: 0 8px 8px 8px;
          border-radius: 4px;
        }
        
        .timeline-area {
          position: relative;
          height: 100%;
          cursor: pointer;
          border-radius: 4px;
          margin: 4px;
        }
        
        .timeline-clip {
          position: absolute;
          top: 4px;
          bottom: 4px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          overflow: hidden;
          border: 2px solid transparent;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .timeline-clip:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
          border-color: rgba(255, 255, 255, 0.3);
        }
        
        .timeline-clip.selected {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
        }
        
        .timeline-clip.dragging {
          opacity: 0.8;
          transform: rotate(2deg) scale(1.05);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
          z-index: 1000;
        }
        
        .clip-content {
          height: 100%;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .clip-thumbnail {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .clip-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
          padding: 4px 8px;
        }
        
        .clip-title {
          font-size: 10px;
          color: white;
          font-weight: 600;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .audio-waveform-preview {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1px;
          width: 100%;
          height: 100%;
          padding: 4px;
        }
        
        .waveform-bar {
          width: 2px;
          background: rgba(255, 255, 255, 0.7);
          border-radius: 1px;
        }
        
        .subtitle-clip {
          background: rgba(59, 130, 246, 0.2);
          border: 1px solid rgba(59, 130, 246, 0.5);
        }
        
        .subtitle-text {
          padding: 4px 8px;
          text-align: center;
          width: 100%;
        }

        .empty-timeline {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;
          background: #1f2937;
          border-radius: 8px;
          color: #9ca3af;
          font-size: 1.25rem;
          font-weight: 500;
          text-align: center;
          padding: 2rem;
        }

        .empty-timeline-content {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .text-4xl {
          font-size: 4rem;
          line-height: 1;
        }
      `}</style>
    </div>
  );
};

export default AdvancedTimeline; 