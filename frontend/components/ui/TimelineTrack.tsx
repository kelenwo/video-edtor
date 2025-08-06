'use client';

import React from 'react';
import { Video, Music, MessageSquare, Plus } from 'lucide-react';

interface TimelineTrackProps {
  type: 'video' | 'audio' | 'subtitles';
  title: string;
  color: string;
}

const TimelineTrack: React.FC<TimelineTrackProps> = ({ type, title, color }) => {
  const trackIcons = {
    video: Video,
    audio: Music,
    subtitles: MessageSquare,
  };

  const colors = {
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    cyan: 'bg-cyan-500',
    blue: 'bg-blue-500',
  };

  const Icon = trackIcons[type];

  return (
    <div className="flex items-center space-x-2">
      <div className="w-8 h-8 flex-shrink-0 bg-[#3c3c3c] rounded-md flex items-center justify-center">
        <Icon className="w-5 h-5 text-gray-400" />
      </div>
      <div className="w-8 h-8 flex-shrink-0 bg-[#3c3c3c] rounded-md flex items-center justify-center">
        <Plus className="w-5 h-5 text-gray-400" />
      </div>
      <div className={`flex-1 h-10 ${colors[color as keyof typeof colors]} rounded-lg flex items-center px-2 text-white text-sm font-medium relative overflow-hidden`}>
        <span>{title}</span>
        {type === 'video' && (
          <div className="absolute left-32 top-0 bottom-0 w-24 bg-pink-400 rounded-lg opacity-80">
            <span className="absolute left-1 top-1/2 -translate-y-1/2 text-xs">Pasta Picasso</span>
          </div>
        )}
        {/* Waveform/Image strip mock */}
        {type !== 'subtitles' && (
          <div className="absolute inset-y-0 right-0 flex items-center h-full w-3/4">
            {type === 'video' && (
              <img 
                src="https://images.pexels.com/photos/4058411/pexels-photo-4058411.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                className="h-full w-full object-cover opacity-50" 
                alt="Video thumbnail"
              />
            )}
            {type === 'audio' && (
              <div className="w-full h-full flex items-center">
                {[...Array(25)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-px h-1/2 bg-white opacity-70 mx-0.5" 
                    style={{height: `${20 + Math.random() * 60}%`}}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineTrack; 