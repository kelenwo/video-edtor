'use client';

import { useEffect, useRef, useState } from 'react';

export default function Timeline({ videoSrc, onTimeUpdate, videoRef }) {
  const canvasRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // Function to draw thumbnails
  const drawThumbnails = (video, canvas, context) => {
    const numThumbnails = 10;
    canvas.width = 1200;
    canvas.height = 100;

    for (let i = 0; i < numThumbnails; i++) {
        const time = (video.duration / numThumbnails) * i;
        video.currentTime = time;
        video.addEventListener('seeked', () => {
          context.drawImage(video, i * (canvas.width / numThumbnails), 0, canvas.width / numThumbnails, canvas.height);
        }, { once: true });
      }
  };
  
  // Function to draw playhead
  const drawPlayhead = (canvas, context) => {
    const playheadX = (currentTime / duration) * canvas.width;
    context.fillStyle = 'red';
    context.fillRect(playheadX - 1, 0, 2, canvas.height);
  };

  useEffect(() => {
    const video = document.createElement('video');
    video.src = videoSrc;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    video.addEventListener('loadeddata', () => {
        setDuration(video.duration);
        drawThumbnails(video, canvas, context);
    });

    const handleTimeUpdate = () => {
        setCurrentTime(videoRef.current.currentTime);
    };

    if (videoRef && videoRef.current) {
        videoRef.current.addEventListener('timeupdate', handleTimeUpdate);
    }
    
    // Initial draw and redraw on time update
    if (duration > 0) {
        drawPlayhead(canvas, context);
    }

    return () => {
        if (videoRef && videoRef.current) {
            videoRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        }
    }
  }, [videoSrc, duration, currentTime, videoRef]);

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newTime = (x / canvas.width) * duration;
    if(videoRef && videoRef.current) {
        videoRef.current.currentTime = newTime;
    }
  };

  return (
    <div>
      <canvas ref={canvasRef} onClick={handleCanvasClick}></canvas>
    </div>
  );
} 