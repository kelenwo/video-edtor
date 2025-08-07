'use client'

import React, { useState, useEffect } from 'react';
import { X, Download, Settings, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { apiService, ExportSettings, ProjectData } from '../app/services/api';

interface ExportModalProps {
  projectData: ProjectData;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ projectData, onClose }) => {
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    quality: 'medium',
    format: 'mp4',
    resolution: '1920x1080',
  });
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<string>('');
  const [exportComplete, setExportComplete] = useState(false);
  const [exportError, setExportError] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [jobId, setJobId] = useState<string>('');

  // WebSocket for real-time updates
  useEffect(() => {
    if (jobId && isExporting) {
      const ws = apiService.connectWebSocket((message) => {
        console.log('Export progress:', message);
        setExportProgress(message);
        
        // Check if export is complete
        if (message.includes('Completed!')) {
          setIsExporting(false);
          setExportComplete(true);
          
          // Extract download URL from message
          const urlMatch = message.match(/Output: (.+)$/);
          if (urlMatch) {
            setDownloadUrl(`http://localhost:8080${urlMatch[1]}`);
          }
        } else if (message.includes('Failed!')) {
          setIsExporting(false);
          setExportError(message);
        }
      });

      return () => {
        if (ws) {
          ws.close();
        }
      };
    }
  }, [jobId, isExporting]);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportError('');
      setExportProgress('Starting export...');
      
      const result = await apiService.exportVideo(projectData, exportSettings);
      setJobId(result.jobId);
      setExportProgress(result.message);
    } catch (error) {
      setIsExporting(false);
      setExportError(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    }
  };

  const getQualityDescription = (quality: string) => {
    switch (quality) {
      case 'high': return 'Best quality, larger file size';
      case 'medium': return 'Good quality, balanced file size';
      case 'low': return 'Smaller file size, lower quality';
      default: return '';
    }
  };

  const getFileSizeEstimate = () => {
    const duration = projectData.duration;
    const quality = exportSettings.quality;
    
    // Rough estimates in MB per minute
    const estimates = {
      high: 50,
      medium: 25,
      low: 10,
    };
    
    const sizePerMinute = estimates[quality] || 25;
    const estimatedSize = Math.round((duration / 60) * sizePerMinute);
    
    return `~${estimatedSize}MB`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Export Video</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {!isExporting && !exportComplete && !exportError && (
            <>
              {/* Quality Settings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Settings size={16} className="inline mr-1" />
                  Quality
                </label>
                <select
                  value={exportSettings.quality}
                  onChange={(e) => setExportSettings({ ...exportSettings, quality: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="high">High Quality</option>
                  <option value="medium">Medium Quality</option>
                  <option value="low">Low Quality</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {getQualityDescription(exportSettings.quality)}
                </p>
              </div>

              {/* Format Settings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Format
                </label>
                <select
                  value={exportSettings.format}
                  onChange={(e) => setExportSettings({ ...exportSettings, format: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="mp4">MP4 (Recommended)</option>
                  <option value="webm">WebM</option>
                  <option value="avi">AVI</option>
                </select>
              </div>

              {/* Resolution Settings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resolution
                </label>
                <select
                  value={exportSettings.resolution}
                  onChange={(e) => setExportSettings({ ...exportSettings, resolution: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="1920x1080">1080p (1920×1080)</option>
                  <option value="1280x720">720p (1280×720)</option>
                  <option value="854x480">480p (854×480)</option>
                </select>
              </div>

              {/* Export Info */}
              <div className="bg-gray-50 rounded-md p-3">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{Math.round(projectData.duration)}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated size:</span>
                    <span className="font-medium">{getFileSizeEstimate()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Media items:</span>
                    <span className="font-medium">{projectData.mediaItems.length}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Export Progress */}
          {isExporting && (
            <div className="text-center py-8">
              <Loader className="animate-spin mx-auto mb-4 text-blue-500" size={32} />
              <p className="text-sm font-medium text-gray-900 mb-2">Exporting video...</p>
              <p className="text-xs text-gray-600">{exportProgress}</p>
              <div className="mt-4 bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: '50%' }}></div>
              </div>
            </div>
          )}

          {/* Export Complete */}
          {exportComplete && (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto mb-4 text-green-500" size={32} />
              <p className="text-sm font-medium text-gray-900 mb-2">Export completed!</p>
              <p className="text-xs text-gray-600 mb-4">Your video is ready for download.</p>
              <button
                onClick={handleDownload}
                className="bg-green-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-600 flex items-center mx-auto"
              >
                <Download size={16} className="mr-2" />
                Download Video
              </button>
            </div>
          )}

          {/* Export Error */}
          {exportError && (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto mb-4 text-red-500" size={32} />
              <p className="text-sm font-medium text-red-900 mb-2">Export failed</p>
              <p className="text-xs text-red-600">{exportError}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {!isExporting && !exportComplete && (
          <div className="flex space-x-3 px-4 pb-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={projectData.mediaItems.length === 0}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Start Export
            </button>
          </div>
        )}

        {(exportComplete || exportError) && (
          <div className="px-4 pb-4">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};