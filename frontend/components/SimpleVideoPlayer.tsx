'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';

interface SimpleVideoPlayerProps {
  src: string;
  poster?: string;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  className?: string;
  isPlaying?: boolean;
  onPlayPause?: () => void;
}

const SimpleVideoPlayer: React.FC<SimpleVideoPlayerProps> = ({
  src,
  poster,
  onTimeUpdate,
  onDurationChange,
  onPlay,
  onPause,
  onEnded,
  className = '',
  isPlaying: propIsPlaying,
  onPlayPause
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      onTimeUpdate?.(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      onDurationChange?.(video.duration);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [onTimeUpdate, onDurationChange, onPlay, onPause, onEnded]);

  useEffect(() => {
    const video = videoRef.current;
    if (video && src) {
      video.src = src;
      video.load();
      if (poster) {
        video.poster = poster;
      }
    }
  }, [src, poster]);

  useEffect(() => {
    const video = videoRef.current;
    if (video && propIsPlaying !== undefined) {
      if (propIsPlaying) {
        video.play();
      } else {
        video.pause();
      }
    }
  }, [propIsPlaying]);

  const togglePlay = () => {
    if (onPlayPause) {
      onPlayPause();
    } else {
      const video = videoRef.current;
      if (!video) return;

      if (isPlaying) {
        video.pause();
      } else {
        video.play();
      }
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = (parseFloat(e.target.value) / 100) * duration;
    video.currentTime = newTime;
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen();
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`simple-video-player ${className}`}>
      <div className="video-container">
        <video
          ref={videoRef}
          className="video-element"
          poster={poster}
          preload="metadata"
        >
          <source src={src} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* Custom Controls Overlay */}
        <div className="controls-overlay">
          <div className="controls-background"></div>
          
          {/* Top Controls */}
          <div className="top-controls">
            <div className="video-title">
              {src.includes('blob:') ? 'Uploaded Video' : 'Sample Video'}
            </div>
          </div>
          
          {/* Center Play Button */}
          <div className="center-controls">
            <button 
              onClick={togglePlay}
              className="play-button"
            >
              {isPlaying ? <Pause className="w-12 h-12" /> : <Play className="w-12 h-12" />}
            </button>
          </div>
          
          {/* Bottom Controls */}
          <div className="bottom-controls">
            <div className="progress-container">
              <input
                type="range"
                min="0"
                max="100"
                value={duration > 0 ? (currentTime / duration) * 100 : 0}
                onChange={handleSeek}
                className="progress-bar"
              />
            </div>
            
            <div className="control-buttons">
              <button onClick={togglePlay} className="control-button">
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              
              <div className="time-display">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
              
              <div className="volume-control">
                <button onClick={toggleMute} className="control-button">
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="volume-slider"
                />
              </div>
              
              <button onClick={toggleFullscreen} className="control-button">
                <Maximize2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .simple-video-player {
          width: 100%;
          height: 100%;
          position: relative;
          background: #000;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .video-container {
          width: 100%;
          height: 100%;
          position: relative;
        }
        
        .video-element {
          width: 100%;
          height: 100%;
          object-fit: contain;
          background: #000;
        }
        
        .controls-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: none;
        }
        
        .video-container:hover .controls-overlay {
          opacity: 1;
          pointer-events: all;
        }
        
        .controls-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            transparent 0%,
            transparent 60%,
            rgba(0, 0, 0, 0.7) 100%
          );
        }
        
        .top-controls {
          position: absolute;
          top: 16px;
          left: 16px;
          right: 16px;
          z-index: 10;
        }
        
        .video-title {
          color: white;
          font-size: 14px;
          font-weight: 500;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
        }
        
        .center-controls {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 10;
        }
        
        .play-button {
          background: rgba(59, 130, 246, 0.9);
          border: none;
          border-radius: 50%;
          width: 80px;
          height: 80px;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          backdrop-filter: blur(4px);
        }
        
        .play-button:hover {
          background: rgba(59, 130, 246, 1);
          transform: scale(1.1);
        }
        
        .bottom-controls {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 16px;
          z-index: 10;
        }
        
        .progress-container {
          margin-bottom: 12px;
        }
        
        .progress-bar {
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
          outline: none;
          cursor: pointer;
          appearance: none;
        }
        
        .progress-bar::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
        }
        
        .control-buttons {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .control-button {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 8px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }
        
        .control-button:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .time-display {
          color: white;
          font-size: 14px;
          font-family: 'Courier New', monospace;
          font-weight: 500;
        }
        
        .volume-control {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .volume-slider {
          width: 60px;
          height: 4px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
          outline: none;
          cursor: pointer;
          appearance: none;
        }
        
        .volume-slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default SimpleVideoPlayer; 