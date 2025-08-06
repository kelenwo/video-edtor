'use client';

import { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import Clip from './Clip';
import Ruler from './Ruler';

const pixelsPerSecond = 50;

const Track = ({ track, clips }) => {
  return (
    <div className="d-flex align-items-center border-bottom border-secondary" style={{ height: '64px' }}>
      <div className="bg-secondary h-100 d-flex align-items-center justify-content-center" style={{ width: '160px' }}>{track.type}</div>
      <Droppable droppableId={track.id.toString()} direction="horizontal">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex-grow-1 h-100 bg-dark d-flex align-items-center"
          >
            {clips.map((clip, index) => (
              <Draggable key={clip.id} draggableId={clip.id.toString()} index={index}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <Clip title={clip.title} color={clip.color} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default function MultiTrackTimeline({ tracks, setTracks, videoRef }) {
  const [currentTime, setCurrentTime] = useState(0);
  
  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    // Reordering in the same track
    if (source.droppableId === destination.droppableId) {
      const trackId = parseInt(source.droppableId);
      const track = tracks.find(t => t.id === trackId);
      const newClips = Array.from(track.clips);
      const [removed] = newClips.splice(source.index, 1);
      newClips.splice(destination.index, 0, removed);

      const newTracks = tracks.map(t => 
        t.id === trackId ? { ...t, clips: newClips } : t
      );
      setTracks(newTracks);
    } 
    // Moving between tracks (a more complex case to be handled later)
  };

  const handleResize = (trackId, clipId, newWidth) => {
    const newTracks = tracks.map(track => {
      if (track.id === trackId) {
        const newClips = track.clips.map(clip => {
          if (clip.id === clipId) {
            const newDuration = newWidth / pixelsPerSecond;
            return { ...clip, width: newWidth, duration: newDuration };
          }
          return clip;
        });
        return { ...track, clips: newClips };
      }
      return track;
    });
    setTracks(newTracks);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [videoRef]);

  const duration = videoRef.current ? videoRef.current.duration : 0;

  return (
    <div className="relative">
      <Ruler duration={duration} pixelsPerSecond={pixelsPerSecond} />
      <div 
        className="absolute top-0 left-0 h-full w-px bg-red-500 z-10"
        style={{ left: `${currentTime * pixelsPerSecond}px` }}
      ></div>
      <DragDropContext onDragEnd={onDragEnd}>
        <div>
          {tracks.map(track => (
            <Track key={track.id} track={track} clips={track.clips}>
              {track.clips.map((clip, index) => (
                <Draggable key={clip.id} draggableId={clip.id.toString()} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <Clip
                        title={clip.title}
                        color={clip.color}
                        width={clip.width || 200}
                        onResize={(newWidth) => handleResize(track.id, clip.id, newWidth)}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
            </Track>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
} 