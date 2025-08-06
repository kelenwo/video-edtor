'use client';

import React, { useRef, useEffect, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface AudioWaveformProps {
  src: string;
  height?: number;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  className?: string;
}

const AudioWaveform: React.FC<AudioWaveformProps> = ({
  src,
  height = 60,
  onTimeUpdate,
  onDurationChange,
  onPlay,
  onPause,
  onEnded,
  className = ''
}) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!waveformRef.current) return;

    // Initialize WaveSurfer
    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#4f46e5',
      progressColor: '#3b82f6',
      cursorColor: '#ffffff',
      barWidth: 2,
      barRadius: 3,
      cursorWidth: 1,
      height: height,
      barGap: 1,
      responsive: true,
      normalize: true,
      backend: 'WebAudio'
    });

    wavesurferRef.current = wavesurfer;

    // Set up event listeners
    wavesurfer.on('ready', () => {
      setIsReady(true);
      setDuration(wavesurfer.getDuration());
      onDurationChange?.(wavesurfer.getDuration());
    });

    wavesurfer.on('audioprocess', (currentTime: number) => {
      setCurrentTime(currentTime);
      onTimeUpdate?.(currentTime);
    });

    wavesurfer.on('play', () => {
      setIsPlaying(true);
      onPlay?.();
    });

    wavesurfer.on('pause', () => {
      setIsPlaying(false);
      onPause?.();
    });

    wavesurfer.on('finish', () => {
      setIsPlaying(false);
      onEnded?.();
    });

    // Load audio file
    wavesurfer.load(src);

    // Cleanup
    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }
    };
  }, [src, height, onTimeUpdate, onDurationChange, onPlay, onPause, onEnded]);

  const togglePlay = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const seekTo = (time: number) => {
    if (wavesurferRef.current) {
      wavesurferRef.current.seekTo(time / duration);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`audio-waveform-container ${className}`}>
      <div className="waveform-controls">
        <button
          onClick={togglePlay}
          className="play-button"
          disabled={!isReady}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        <span className="time-display">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
      
      <div 
        ref={waveformRef} 
        className="waveform-container"
        style={{ height: `${height}px` }}
      />
      
      <style jsx>{`
        .audio-waveform-container {
          width: 100%;
          background: #1f2937;
          border-radius: 8px;
          padding: 12px;
        }
        
        .waveform-controls {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }
        
        .play-button {
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 4px 8px;
          cursor: pointer;
          font-size: 12px;
        }
        
        .play-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .time-display {
          font-size: 12px;
          color: #9ca3af;
        }
        
        .waveform-container {
          width: 100%;
          background: #374151;
          border-radius: 4px;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default AudioWaveform; 