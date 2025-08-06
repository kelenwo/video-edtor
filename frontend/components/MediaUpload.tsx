'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, Video, Music, Image, File, X, Play, Pause } from 'lucide-react';

interface MediaFile {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image';
  file: File;
  url: string;
  thumbnail?: string;
  duration?: number;
}

interface MediaUploadProps {
  onMediaSelect: (media: MediaFile) => void;
  onClose: () => void;
}

const MediaUpload: React.FC<MediaUploadProps> = ({ onMediaSelect, onClose }) => {
  const [uploadedFiles, setUploadedFiles] = useState<MediaFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const getFileType = (file: File): 'video' | 'audio' | 'image' => {
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.startsWith('image/')) return 'image';
    return 'video'; // fallback
  };

  const generateThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.onloadedmetadata = () => {
          video.currentTime = 1;
          video.onseeked = () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(video, 0, 0);
            resolve(canvas.toDataURL());
          };
        };
        video.src = URL.createObjectURL(file);
      } else if (file.type.startsWith('image/')) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0);
          resolve(canvas.toDataURL());
        };
        img.src = URL.createObjectURL(file);
      } else {
        resolve('');
      }
    });
  };

  const handleFileUpload = useCallback(async (files: FileList) => {
    console.log('Files received:', files);
    const newFiles: MediaFile[] = [];
    
    for (const file of Array.from(files)) {
      console.log('Processing file:', file.name, file.type, file.size);
      const fileType = getFileType(file);
      console.log('File type determined:', fileType);
      
      const thumbnail = await generateThumbnail(file);
      console.log('Thumbnail generated:', thumbnail ? 'Yes' : 'No');
      
      const mediaFile: MediaFile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: fileType,
        file: file,
        url: URL.createObjectURL(file),
        thumbnail: thumbnail,
        duration: fileType === 'video' ? 0 : undefined
      };
      
      console.log('Created media file:', mediaFile);
      newFiles.push(mediaFile);
    }
    
    console.log('Setting uploaded files:', newFiles);
    setUploadedFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFileUpload(files);
    }
  };

  const handleFileSelect = (file: MediaFile) => {
    console.log('File selected in upload panel:', file);
    setSelectedFile(file);
    setIsPlaying(false);
  };

  const handlePlayPause = () => {
    console.log('Play/pause clicked in upload panel');
    if (selectedFile?.type === 'video' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleAddToTimeline = () => {
    if (selectedFile) {
      console.log('Adding to timeline:', selectedFile);
      onMediaSelect(selectedFile);
      // Show success feedback
      alert(`${selectedFile.name} has been added to the timeline!`);
    } else {
      console.log('No file selected for timeline');
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-6 h-6" />;
      case 'audio': return <Music className="w-6 h-6" />;
      case 'image': return <Image className="w-6 h-6" />;
      default: return <File className="w-6 h-6" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="media-upload-container">
      <div className="upload-header">
        <h2 className="upload-title">Upload Media</h2>
        <button onClick={onClose} className="close-button">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="upload-content">
        {/* Upload Area */}
        <div className="upload-area">
          <div
            className={`drop-zone ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 text-gray-400 mb-4" />
            <p className="upload-text">Drag and drop files here or click to browse</p>
            <p className="upload-hint">Supports video, audio, and image files</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="video/*,audio/*,image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="uploaded-files">
            <h3 className="files-title">Uploaded Files</h3>
            <div className="files-grid">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className={`file-item ${selectedFile?.id === file.id ? 'selected' : ''}`}
                  onClick={() => handleFileSelect(file)}
                >
                  <div className="file-preview">
                    {file.thumbnail ? (
                      <img src={file.thumbnail} alt={file.name} className="file-thumbnail" />
                    ) : (
                      <div className="file-icon">
                        {getFileIcon(file.type)}
                      </div>
                    )}
                  </div>
                  <div className="file-info">
                    <p className="file-name">{file.name}</p>
                    <p className="file-size">{formatFileSize(file.file.size)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preview Section */}
        {selectedFile && (
          <div className="preview-section">
            <h3 className="preview-title">Preview</h3>
            <div className="preview-container">
              {selectedFile.type === 'video' ? (
                <div className="video-preview">
                  <video
                    ref={videoRef}
                    src={selectedFile.url}
                    className="preview-video"
                    onLoadedMetadata={() => {
                      if (videoRef.current) {
                        selectedFile.duration = videoRef.current.duration;
                      }
                    }}
                  />
                  <div className="video-controls">
                    <button onClick={handlePlayPause} className="play-button">
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ) : selectedFile.type === 'audio' ? (
                <div className="audio-preview">
                  <audio src={selectedFile.url} controls className="preview-audio" />
                </div>
              ) : (
                <div className="image-preview">
                  <img src={selectedFile.url} alt={selectedFile.name} className="preview-image" />
                </div>
              )}
            </div>
            <button onClick={handleAddToTimeline} className="add-to-timeline-button">
              Add to Timeline
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .media-upload-container {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .upload-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid #374151;
        }
        
        .upload-title {
          font-size: 18px;
          font-weight: 600;
          color: #e5e7eb;
        }
        
        .close-button {
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: color 0.2s;
        }
        
        .close-button:hover {
          color: #e5e7eb;
        }
        
        .upload-content {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
        }
        
        .upload-area {
          margin-bottom: 24px;
        }
        
        .drop-zone {
          border: 2px dashed #4b5563;
          border-radius: 8px;
          padding: 40px 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: #1f2937;
        }
        
        .drop-zone:hover {
          border-color: #3b82f6;
          background: #1e293b;
        }
        
        .drop-zone.dragging {
          border-color: #3b82f6;
          background: #1e293b;
          transform: scale(1.02);
        }
        
        .upload-text {
          font-size: 16px;
          color: #e5e7eb;
          margin-bottom: 8px;
        }
        
        .upload-hint {
          font-size: 14px;
          color: #9ca3af;
        }
        
        .uploaded-files {
          margin-bottom: 24px;
        }
        
        .files-title {
          font-size: 16px;
          font-weight: 600;
          color: #e5e7eb;
          margin-bottom: 12px;
        }
        
        .files-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 12px;
        }
        
        .file-item {
          background: #374151;
          border-radius: 8px;
          padding: 12px;
          cursor: pointer;
          transition: all 0.2s;
          border: 2px solid transparent;
        }
        
        .file-item:hover {
          background: #4b5563;
        }
        
        .file-item.selected {
          border-color: #3b82f6;
          background: #1e3a8a;
        }
        
        .file-preview {
          width: 100%;
          height: 80px;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #1f2937;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .file-thumbnail {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .file-icon {
          color: #9ca3af;
        }
        
        .file-info {
          text-align: center;
        }
        
        .file-name {
          font-size: 12px;
          color: #e5e7eb;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .file-size {
          font-size: 10px;
          color: #9ca3af;
        }
        
        .preview-section {
          border-top: 1px solid #374151;
          padding-top: 16px;
        }
        
        .preview-title {
          font-size: 16px;
          font-weight: 600;
          color: #e5e7eb;
          margin-bottom: 12px;
        }
        
        .preview-container {
          margin-bottom: 16px;
        }
        
        .video-preview {
          position: relative;
          background: #000;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .preview-video {
          width: 100%;
          height: 200px;
          object-fit: cover;
        }
        
        .video-controls {
          position: absolute;
          bottom: 8px;
          left: 8px;
        }
        
        .play-button {
          background: rgba(59, 130, 246, 0.9);
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }
        
        .play-button:hover {
          background: rgba(59, 130, 246, 1);
        }
        
        .audio-preview {
          background: #1f2937;
          border-radius: 8px;
          padding: 16px;
        }
        
        .preview-audio {
          width: 100%;
        }
        
        .image-preview {
          background: #1f2937;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .preview-image {
          width: 100%;
          height: 200px;
          object-fit: cover;
        }
        
        .add-to-timeline-button {
          width: 100%;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .add-to-timeline-button:hover {
          background: #2563eb;
        }
      `}</style>
    </div>
  );
};

export default MediaUpload; 