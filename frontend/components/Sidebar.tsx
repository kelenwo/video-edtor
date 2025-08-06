'use client'

import React, { useEffect, useState, useRef } from 'react';
import { UploadIcon, TextIcon, ImageIcon, VideoIcon, MusicIcon, LayersIcon, SlidersIcon, PlusIcon, ChevronLeftIcon, ChevronRightIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon, BoldIcon, ItalicIcon, ClockIcon, TypeIcon, FileTextIcon } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { selectMediaItems, selectSelectedItemId, addMediaItem, updateMediaItem, setSelectedItemId } from '../redux/videoEditorSlice';

export const Sidebar = () => {
  const dispatch = useAppDispatch();
  const mediaItems = useAppSelector(selectMediaItems);
  const selectedItemId = useAppSelector(selectSelectedItemId);
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeItem, setActiveItem] = useState('text');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [textContent, setTextContent] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [fontSize, setFontSize] = useState(32);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [isBold, setIsBold] = useState(true);
  const [isItalic, setIsItalic] = useState(false);

  // Get selected text item if any
  const selectedTextItem = selectedItemId ? mediaItems.find(item => item.id === selectedItemId && item.type === 'text') : null;

  // Update text controls when a text item is selected
  useEffect(() => {
    if (selectedTextItem) {
      setTextContent(selectedTextItem.content || '');
      setTextColor(selectedTextItem.fontColor || '#ffffff');
      setFontSize(selectedTextItem.fontSize || 32);
      setFontFamily(selectedTextItem.fontFamily || 'Arial');
      setTextAlign(selectedTextItem.textAlign || 'center');
      setIsBold(selectedTextItem.fontWeight === 'bold');
      setIsItalic(selectedTextItem.fontStyle === 'italic');
      setActiveItem('text');
    }
  }, [selectedTextItem]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const fileType = file.type.split('/')[0];
    const url = URL.createObjectURL(file);

    if (fileType === 'video') {
      const video = document.createElement('video');
      video.src = url;
      video.onloadedmetadata = () => {
        const newItem = {
          type: 'video' as const,
          name: file.name,
          duration: video.duration,
          startTime: 0,
          endTime: video.duration,
          track: 0,
          url: url,
          isMuted: false
        };
        dispatch(addMediaItem(newItem));
      };
    } else if (fileType === 'audio') {
      const audio = document.createElement('audio');
      audio.src = url;
      audio.onloadedmetadata = () => {
        const newItem = {
          type: 'audio' as const,
          name: file.name,
          duration: audio.duration,
          startTime: 0,
          endTime: audio.duration,
          track: 2,
          url: url,
          isMuted: false
        };
        dispatch(addMediaItem(newItem));
      };
    } else if (fileType === 'image') {
      const newItem = {
        type: 'image' as const,
        name: file.name,
        duration: 10,
        startTime: 0,
        endTime: 10,
        track: 1,
        url: url,
        position: {
          x: 50,
          y: 50
        }
      };
      dispatch(addMediaItem(newItem));
    }
  };

  const handleAddText = () => {
    const newItem = {
      type: 'text' as const,
      name: 'Text Layer',
      duration: 10,
      startTime: 0,
      endTime: 10,
      track: 1,
      content: textContent || 'Sample Text',
      position: {
        x: 50,
        y: 50
      },
      fontSize: fontSize,
      fontFamily: fontFamily,
      fontColor: textColor,
      fontWeight: isBold ? 'bold' : 'normal',
      fontStyle: isItalic ? 'italic' : 'normal',
      textAlign: textAlign
    };
    dispatch(addMediaItem(newItem));
  };

  const updateTextItem = () => {
    if (selectedItemId && selectedTextItem) {
      dispatch(updateMediaItem({
        id: selectedItemId,
        updates: {
          content: textContent,
          fontColor: textColor,
          fontSize: fontSize,
          fontFamily: fontFamily,
          fontWeight: isBold ? 'bold' : 'normal',
          fontStyle: isItalic ? 'italic' : 'normal',
          textAlign: textAlign
        }
      }));
    }
  };

  return (
    <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${sidebarOpen ? 'w-80' : 'w-12'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {sidebarOpen && <h2 className="text-lg font-semibold text-gray-800">Tools</h2>}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1 rounded hover:bg-gray-100"
        >
          {sidebarOpen ? <ChevronLeftIcon size={20} /> : <ChevronRightIcon size={20} />}
        </button>
      </div>

      {sidebarOpen && (
        <>
          {/* Tool Tabs */}
          <div className="flex border-b border-gray-200">
            {[
              { id: 'upload', icon: UploadIcon, label: 'Upload' },
              { id: 'text', icon: TextIcon, label: 'Text' },
              { id: 'effects', icon: SlidersIcon, label: 'Effects' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveItem(tab.id)}
                className={`flex-1 flex flex-col items-center py-3 px-2 text-xs ${
                  activeItem === tab.id
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon size={20} className="mb-1" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeItem === 'upload' && (
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  accept="video/*,audio/*,image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <div className="text-center">
                    <UploadIcon size={24} className="mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">Click to upload media</p>
                    <p className="text-xs text-gray-400">Video, Audio, or Images</p>
                  </div>
                </button>
              </div>
            )}

            {activeItem === 'text' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Text Content</label>
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    onBlur={updateTextItem}
                    placeholder="Enter your text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
                  <input
                    type="range"
                    min="12"
                    max="72"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    onMouseUp={updateTextItem}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">{fontSize}px</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    onBlur={updateTextItem}
                    className="w-full h-10 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => { setIsBold(!isBold); updateTextItem(); }}
                    className={`flex-1 p-2 rounded ${isBold ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
                  >
                    <BoldIcon size={16} className="mx-auto" />
                  </button>
                  <button
                    onClick={() => { setIsItalic(!isItalic); updateTextItem(); }}
                    className={`flex-1 p-2 rounded ${isItalic ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
                  >
                    <ItalicIcon size={16} className="mx-auto" />
                  </button>
                </div>

                <button
                  onClick={handleAddText}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-600"
                >
                  Add Text
                </button>
              </div>
            )}

            {activeItem === 'effects' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">Effects panel coming soon...</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};