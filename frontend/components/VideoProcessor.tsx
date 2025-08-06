'use client';

import { useRef, useEffect, useState } from 'react';

interface VideoProcessorProps {
  videoSrc: string;
  onProcessedFrame?: (canvas: HTMLCanvasElement) => void;
  effects?: VideoEffect[];
}

interface VideoEffect {
  type: 'text' | 'filter' | 'transform';
  data: any;
}

export default function VideoProcessor({ videoSrc, onProcessedFrame, effects = [] }: VideoProcessorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const processFrame = () => {
      if (video.paused || video.ended) return;

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Apply effects
      effects.forEach(effect => {
        switch (effect.type) {
          case 'text':
            applyTextEffect(ctx, effect.data);
            break;
          case 'filter':
            applyFilterEffect(ctx, effect.data);
            break;
          case 'transform':
            applyTransformEffect(ctx, effect.data);
            break;
        }
      });

      // Call the callback with the processed frame
      if (onProcessedFrame) {
        onProcessedFrame(canvas);
      }

      // Continue processing
      requestAnimationFrame(processFrame);
    };

    video.addEventListener('play', () => {
      setIsProcessing(true);
      processFrame();
    });

    video.addEventListener('pause', () => {
      setIsProcessing(false);
    });

    video.addEventListener('ended', () => {
      setIsProcessing(false);
    });

    return () => {
      video.removeEventListener('play', processFrame);
      video.removeEventListener('pause', () => setIsProcessing(false));
      video.removeEventListener('ended', () => setIsProcessing(false));
    };
  }, [videoSrc, effects, onProcessedFrame]);

  const applyTextEffect = (ctx: CanvasRenderingContext2D, data: any) => {
    const { text, x, y, fontSize, fontColor, fontFamily, fontWeight, alignment } = data;
    
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = fontColor;
    ctx.textAlign = alignment || 'left';
    ctx.fillText(text, x, y);
  };

  const applyFilterEffect = (ctx: CanvasRenderingContext2D, data: any) => {
    const { type, value } = data;
    
    switch (type) {
      case 'brightness':
        ctx.filter = `brightness(${value}%)`;
        break;
      case 'contrast':
        ctx.filter = `contrast(${value}%)`;
        break;
      case 'saturation':
        ctx.filter = `saturate(${value}%)`;
        break;
      case 'blur':
        ctx.filter = `blur(${value}px)`;
        break;
    }
  };

  const applyTransformEffect = (ctx: CanvasRenderingContext2D, data: any) => {
    const { rotation, scaleX, scaleY, translateX, translateY } = data;
    
    ctx.save();
    ctx.translate(translateX || 0, translateY || 0);
    ctx.rotate((rotation || 0) * Math.PI / 180);
    ctx.scale(scaleX || 1, scaleY || 1);
  };

  return (
    <div className="relative">
      <video
        ref={videoRef}
        src={videoSrc}
        className="hidden"
        crossOrigin="anonymous"
      />
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
      {isProcessing && (
        <div className="absolute top-2 right-2 bg-editor-blue text-white px-2 py-1 rounded text-xs">
          Processing...
        </div>
      )}
    </div>
  );
} 