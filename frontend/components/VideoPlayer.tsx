'use client';

import React, { useRef, useEffect, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  className?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  onTimeUpdate,
  onDurationChange,
  onPlay,
  onPause,
  onEnded,
  className = ''
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;

    // Initialize Video.js player
    const player = videojs(videoRef.current, {
      controls: true,
      fluid: true,
      responsive: true,
      playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
      controlBar: {
        children: [
          'playToggle',
          'volumePanel',
          'currentTimeDisplay',
          'timeDivider',
          'durationDisplay',
          'progressControl',
          'playbackRateMenuButton',
          'fullscreenToggle'
        ]
      }
    });

    playerRef.current = player;

    // Set up event listeners
    player.on('ready', () => {
      setIsReady(true);
    });

    player.on('timeupdate', () => {
      onTimeUpdate?.(player.currentTime());
    });

    player.on('loadedmetadata', () => {
      onDurationChange?.(player.duration());
    });

    player.on('play', () => {
      onPlay?.();
    });

    player.on('pause', () => {
      onPause?.();
    });

    player.on('ended', () => {
      onEnded?.();
    });

    // Cleanup
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
      }
    };
  }, [onTimeUpdate, onDurationChange, onPlay, onPause, onEnded]);

  useEffect(() => {
    if (playerRef.current && src) {
      playerRef.current.src(src);
      if (poster) {
        playerRef.current.poster(poster);
      }
    }
  }, [src, poster]);

  return (
    <div className={`video-player-container ${className}`}>
      <div data-vjs-player>
        <video
          ref={videoRef}
          className="video-js vjs-big-play-centered vjs-theme-custom"
          data-setup="{}"
        >
          <source src={src} type="video/mp4" />
          <p className="vjs-no-js">
            To view this video please enable JavaScript, and consider upgrading to a
            web browser that supports HTML5 video.
          </p>
        </video>
      </div>
      
      <style jsx>{`
        .video-player-container {
          width: 100%;
          height: 100%;
        }
        
        .video-js {
          width: 100%;
          height: 100%;
        }
        
        .vjs-theme-custom {
          --vjs-theme-primary: #3b82f6;
          --vjs-theme-secondary: #1f2937;
        }
        
        .video-js .vjs-control-bar {
          background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
        }
        
        .video-js .vjs-progress-control .vjs-progress-holder {
          height: 4px;
        }
        
        .video-js .vjs-progress-control .vjs-play-progress {
          background-color: #3b82f6;
        }
        
        .video-js .vjs-progress-control .vjs-load-progress {
          background-color: rgba(255, 255, 255, 0.3);
        }
        
        .video-js .vjs-big-play-button {
          background-color: rgba(59, 130, 246, 0.8);
          border: none;
          border-radius: 50%;
          width: 80px;
          height: 80px;
          line-height: 80px;
          font-size: 40px;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
        }
        
        .video-js .vjs-big-play-button:hover {
          background-color: rgba(59, 130, 246, 1);
        }
      `}</style>
    </div>
  );
};

export default VideoPlayer; 