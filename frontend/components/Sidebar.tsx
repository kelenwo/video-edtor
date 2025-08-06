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
  
  // Position and size controls
  const [posX, setPosX] = useState(35);
  const [posY, setPosY] = useState(30);
  const [rotation, setRotation] = useState(0);
  const [width, setWidth] = useState(135);
  const [height, setHeight] = useState(28);
  const [radius, setRadius] = useState(0);

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
      // Set position if available
      if (selectedTextItem.position) {
        setPosX(Math.round(selectedTextItem.position.x));
        setPosY(Math.round(selectedTextItem.position.y));
      }
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
      // Create a temporary video element to get duration
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
      // Create a temporary audio element to get duration
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
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileUpload = (type: 'video' | 'audio' | 'image') => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'video' ? 'video/*' : type === 'audio' ? 'audio/*' : 'image/*';
      fileInputRef.current.click();
    }
  };

  const handleAddText = () => {
    const newItem = {
      type: 'text' as const,
      name: 'New Text',
      content: textContent || 'Add your text here',
      duration: 10,
      startTime: 0,
      endTime: 10,
      track: 1,
      position: {
        x: posX,
        y: posY
      },
      fontSize,
      fontFamily,
      fontColor: textColor,
      fontWeight: isBold ? 'bold' : 'normal',
      fontStyle: isItalic ? 'italic' : 'normal',
      textAlign
    };
    const action = dispatch(addMediaItem(newItem));
    dispatch(setSelectedItemId(action.payload.id));
  };

  const updateSelectedText = () => {
    if (selectedTextItem) {
      dispatch(updateMediaItem({
        id: selectedTextItem.id,
        updates: {
          content: textContent,
          fontSize,
          fontFamily,
          fontColor: textColor,
          fontWeight: isBold ? 'bold' : 'normal',
          fontStyle: isItalic ? 'italic' : 'normal',
          textAlign,
          position: {
            x: posX,
            y: posY
          }
        }
      }));
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Handle text style changes
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextContent(e.target.value);
    if (selectedTextItem) {
      dispatch(updateMediaItem({
        id: selectedTextItem.id,
        updates: {
          content: e.target.value
        }
      }));
    }
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const size = parseInt(e.target.value);
    setFontSize(size);
    if (selectedTextItem) {
      dispatch(updateMediaItem({
        id: selectedTextItem.id,
        updates: {
          fontSize: size
        }
      }));
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTextColor(e.target.value);
    if (selectedTextItem) {
      dispatch(updateMediaItem({
        id: selectedTextItem.id,
        updates: {
          fontColor: e.target.value
        }
      }));
    }
  };

  const handleFontFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFontFamily(e.target.value);
    if (selectedTextItem) {
      dispatch(updateMediaItem({
        id: selectedTextItem.id,
        updates: {
          fontFamily: e.target.value
        }
      }));
    }
  };

  const handleTextAlign = (align: 'left' | 'center' | 'right') => {
    setTextAlign(align);
    if (selectedTextItem) {
      dispatch(updateMediaItem({
        id: selectedTextItem.id,
        updates: {
          textAlign: align
        }
      }));
    }
  };

  const toggleBold = () => {
    const newValue = !isBold;
    setIsBold(newValue);
    if (selectedTextItem) {
      dispatch(updateMediaItem({
        id: selectedTextItem.id,
        updates: {
          fontWeight: newValue ? 'bold' : 'normal'
        }
      }));
    }
  };

  const toggleItalic = () => {
    const newValue = !isItalic;
    setIsItalic(newValue);
    if (selectedTextItem) {
      dispatch(updateMediaItem({
        id: selectedTextItem.id,
        updates: {
          fontStyle: newValue ? 'italic' : 'normal'
        }
      }));
    }
  };

  const handlePositionChange = (axis: 'x' | 'y', value: number) => {
    if (axis === 'x') {
      setPosX(value);
    } else {
      setPosY(value);
    }
    if (selectedTextItem) {
      dispatch(updateMediaItem({
        id: selectedTextItem.id,
        updates: {
          position: {
            x: axis === 'x' ? value : posX,
            y: axis === 'y' ? value : posY
          }
        }
      }));
    }
  };

  const handleRotationChange = (value: number) => {
    setRotation(value);
    // Would need to add rotation support to the MediaItem type and VideoPreview component
  };

  // Input file reference
  const handleFileInputRef = (type: 'video' | 'audio' | 'image') => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'video' ? 'video/*' : type === 'audio' ? 'audio/*' : 'image/*';
      fileInputRef.current.click();
    }
  };

  return (
    <div className="flex h-full">
      {/* Main vertical sidebar with icons */}
      <div className="w-16 bg-gray-900 flex flex-col items-center py-4">
        <div className="mb-6">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <LayersIcon size={20} className="text-white" />
          </div>
        </div>
        <div className="flex flex-col space-y-6 items-center">
          <button 
            className={`p-2 rounded-lg ${activeItem === 'add' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`} 
            onClick={() => setActiveItem('add')}
          >
            <PlusIcon size={20} />
            <span className="text-xs mt-1 block">Add</span>
          </button>
          <button 
            className={`p-2 rounded-lg ${activeItem === 'uploads' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`} 
            onClick={() => setActiveItem('uploads')}
          >
            <UploadIcon size={20} />
            <span className="text-xs mt-1 block">Uploads</span>
          </button>
          <button 
            className={`p-2 rounded-lg ${activeItem === 'text' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`} 
            onClick={() => setActiveItem('text')}
          >
            <TextIcon size={20} />
            <span className="text-xs mt-1 block">Text</span>
          </button>
          <button 
            className={`p-2 rounded-lg ${activeItem === 'videos' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`} 
            onClick={() => setActiveItem('videos')}
          >
            <VideoIcon size={20} />
            <span className="text-xs mt-1 block">Videos</span>
          </button>
          <button 
            className={`p-2 rounded-lg ${activeItem === 'audios' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`} 
            onClick={() => setActiveItem('audios')}
          >
            <MusicIcon size={20} />
            <span className="text-xs mt-1 block">Audios</span>
          </button>
          <button 
            className={`p-2 rounded-lg ${activeItem === 'photos' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`} 
            onClick={() => setActiveItem('photos')}
          >
            <ImageIcon size={20} />
            <span className="text-xs mt-1 block">Photos</span>
          </button>
          <button 
            className={`p-2 rounded-lg ${activeItem === 'records' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`} 
            onClick={() => setActiveItem('records')}
          >
            <ClockIcon size={20} />
            <span className="text-xs mt-1 block">Records</span>
          </button>
          <button 
            className={`p-2 rounded-lg ${activeItem === 'subtitles' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`} 
            onClick={() => setActiveItem('subtitles')}
          >
            <FileTextIcon size={20} />
            <span className="text-xs mt-1 block">Subtitles</span>
          </button>
        </div>
      </div>

      {/* Content sidebar that changes based on selected item */}
      {sidebarOpen && (
        <div className="w-64 bg-gray-800 text-white flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-gray-700">
            <h3 className="font-medium">
              {activeItem === 'add' && 'Add'}
              {activeItem === 'uploads' && 'Uploads'}
              {activeItem === 'text' && 'Text'}
              {activeItem === 'videos' && 'Videos'}
              {activeItem === 'audios' && 'Audios'}
              {activeItem === 'photos' && 'Photos'}
              {activeItem === 'records' && 'Records'}
              {activeItem === 'subtitles' && 'Subtitles'}
            </h3>
            <button onClick={toggleSidebar} className="p-1 rounded-lg text-gray-400 hover:text-white">
              <ChevronLeftIcon size={18} />
            </button>
          </div>

          {/* Hidden file input */}
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />

          <div className="flex-1 overflow-y-auto p-3">
            {activeItem === 'add' && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-blue-500 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <UploadIcon size={24} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-300">
                    Drag & drop or click to upload
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Video, Audio, or Images
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button className="flex flex-col items-center p-3 bg-gray-700 rounded-lg hover:bg-gray-600" onClick={() => triggerFileUpload('video')}>
                    <VideoIcon size={20} className="text-blue-400 mb-1" />
                    <span className="text-xs">Video</span>
                  </button>
                  <button className="flex flex-col items-center p-3 bg-gray-700 rounded-lg hover:bg-gray-600" onClick={() => triggerFileUpload('image')}>
                    <ImageIcon size={20} className="text-green-400 mb-1" />
                    <span className="text-xs">Image</span>
                  </button>
                  <button className="flex flex-col items-center p-3 bg-gray-700 rounded-lg hover:bg-gray-600" onClick={() => triggerFileUpload('audio')}>
                    <MusicIcon size={20} className="text-purple-400 mb-1" />
                    <span className="text-xs">Audio</span>
                  </button>
                  <button className="flex flex-col items-center p-3 bg-gray-700 rounded-lg hover:bg-gray-600" onClick={() => setActiveItem('text')}>
                    <TextIcon size={20} className="text-orange-400 mb-1" />
                    <span className="text-xs">Text</span>
                  </button>
                </div>
              </div>
            )}

            {activeItem === 'text' && (
              <div className="space-y-4">
                <h4 className="text-xs font-medium text-gray-400 uppercase">
                  Align
                </h4>
                <div className="flex justify-center p-3 bg-gray-700 rounded-lg mb-4">
                  <div className="flex border border-gray-600 rounded overflow-hidden">
                    <button className={`p-1.5 ${textAlign === 'left' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`} onClick={() => handleTextAlign('left')}>
                      <AlignLeftIcon size={16} className="text-white" />
                    </button>
                    <button className={`p-1.5 ${textAlign === 'center' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`} onClick={() => handleTextAlign('center')}>
                      <AlignCenterIcon size={16} className="text-white" />
                    </button>
                    <button className={`p-1.5 ${textAlign === 'right' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`} onClick={() => handleTextAlign('right')}>
                      <AlignRightIcon size={16} className="text-white" />
                    </button>
                  </div>
                </div>

                <h4 className="text-xs font-medium text-gray-400 uppercase">
                  Position
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      X
                    </label>
                    <input type="number" value={posX} onChange={e => handlePositionChange('x', parseInt(e.target.value))} className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Y
                    </label>
                    <input type="number" value={posY} onChange={e => handlePositionChange('y', parseInt(e.target.value))} className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      θ
                    </label>
                    <input type="number" value={rotation} onChange={e => handleRotationChange(parseInt(e.target.value))} className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white" />
                  </div>
                </div>

                <h4 className="text-xs font-medium text-gray-400 uppercase">
                  Size
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      W
                    </label>
                    <input type="number" value={width} onChange={e => setWidth(parseInt(e.target.value))} className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      H
                    </label>
                    <input type="number" value={height} onChange={e => setHeight(parseInt(e.target.value))} className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white" />
                  </div>
                  <div className="flex items-end">
                    <button className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white">
                      <PlusIcon size={16} />
                    </button>
                  </div>
                </div>

                <h4 className="text-xs font-medium text-gray-400 uppercase">
                  Radius
                </h4>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">L</label>
                  <input type="number" value={radius} onChange={e => setRadius(parseInt(e.target.value))} className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white" />
                </div>

                <h4 className="text-xs font-medium text-gray-400 uppercase">
                  Text
                </h4>
                <textarea value={textContent} onChange={handleTextChange} placeholder="Enter your text here" className="w-full h-20 p-2 bg-gray-700 border border-gray-600 rounded-md text-sm resize-none text-white" />
                <div className="flex flex-wrap gap-2">
                  <button className={`p-1.5 rounded ${isBold ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`} onClick={toggleBold}>
                    <BoldIcon size={16} className="text-white" />
                  </button>
                  <button className={`p-1.5 rounded ${isItalic ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`} onClick={toggleItalic}>
                    <ItalicIcon size={16} className="text-white" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Font Family
                    </label>
                    <select value={fontFamily} onChange={handleFontFamilyChange} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-sm text-white">
                      <option value="Arial">Arial</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Verdana">Verdana</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Font Size: {fontSize}px
                    </label>
                    <input type="range" min="12" max="72" value={fontSize} onChange={handleFontSizeChange} className="w-full" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Text Color
                    </label>
                    <div className="flex items-center">
                      <input type="color" value={textColor} onChange={handleColorChange} className="mr-2 w-8 h-8 rounded overflow-hidden" />
                      <input type="text" value={textColor} onChange={handleColorChange} className="flex-1 p-1 bg-gray-700 border border-gray-600 rounded text-sm text-white" />
                    </div>
                  </div>
                </div>

                {selectedTextItem ? (
                  <button onClick={updateSelectedText} className="w-full py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
                    Update Text
                  </button>
                ) : (
                  <button onClick={handleAddText} className="w-full py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
                    Add Text
                  </button>
                )}
              </div>
            )}

            {activeItem === 'videos' && (
              <div className="space-y-4">
                <button className="w-full py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 flex items-center justify-center" onClick={() => handleFileInputRef('video')}>
                  <UploadIcon size={16} className="mr-2" />
                  Upload Video
                </button>
                <div className="mt-4">
                  <h4 className="text-xs font-medium text-gray-400 uppercase mb-2">
                    Your Videos
                  </h4>
                  <div className="space-y-2">
                    {mediaItems.filter(item => item.type === 'video').map(video => (
                      <div key={video.id} className={`p-2 rounded-md cursor-pointer ${selectedItemId === video.id ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`} onClick={() => dispatch(setSelectedItemId(video.id))}>
                        <div className="flex items-center">
                          <VideoIcon size={16} className="mr-2 text-gray-400" />
                          <span className="text-sm truncate">
                            {video.name}
                          </span>
                        </div>
                      </div>
                    ))}
                    {mediaItems.filter(item => item.type === 'video').length === 0 && (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No videos added yet
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeItem === 'audios' && (
              <div className="space-y-4">
                <button className="w-full py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 flex items-center justify-center" onClick={() => handleFileInputRef('audio')}>
                  <UploadIcon size={16} className="mr-2" />
                  Upload Audio
                </button>
                <div className="mt-4">
                  <h4 className="text-xs font-medium text-gray-400 uppercase mb-2">
                    Your Audio Files
                  </h4>
                  <div className="space-y-2">
                    {mediaItems.filter(item => item.type === 'audio').map(audio => (
                      <div key={audio.id} className={`p-2 rounded-md cursor-pointer ${selectedItemId === audio.id ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`} onClick={() => dispatch(setSelectedItemId(audio.id))}>
                        <div className="flex items-center">
                          <MusicIcon size={16} className="mr-2 text-gray-400" />
                          <span className="text-sm truncate">
                            {audio.name}
                          </span>
                        </div>
                      </div>
                    ))}
                    {mediaItems.filter(item => item.type === 'audio').length === 0 && (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No audio files added yet
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeItem === 'photos' && (
              <div className="space-y-4">
                <button className="w-full py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 flex items-center justify-center" onClick={() => handleFileInputRef('image')}>
                  <UploadIcon size={16} className="mr-2" />
                  Upload Photo
                </button>
                <div className="mt-4">
                  <h4 className="text-xs font-medium text-gray-400 uppercase mb-2">
                    Your Photos
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {mediaItems.filter(item => item.type === 'image').map(image => (
                      <div key={image.id} className={`aspect-square rounded-md overflow-hidden cursor-pointer ${selectedItemId === image.id ? 'ring-2 ring-blue-500' : ''}`} onClick={() => dispatch(setSelectedItemId(image.id))}>
                        <img src={image.url} alt={image.name} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  {mediaItems.filter(item => item.type === 'image').length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No photos added yet
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeItem === 'records' && (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <ClockIcon size={32} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-300">
                    Record your screen or camera
                  </p>
                  <button className="mt-4 py-2 px-4 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
                    Start Recording
                  </button>
                </div>
              </div>
            )}

            {activeItem === 'subtitles' && (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <FileTextIcon size={32} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-300">
                    Add subtitles to your video
                  </p>
                  <div className="mt-4 space-y-2">
                    <button className="w-full py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
                      Auto-generate Subtitles
                    </button>
                    <button className="w-full py-2 bg-gray-700 text-white rounded-md text-sm hover:bg-gray-600">
                      Upload Subtitle File
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeItem === 'uploads' && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-blue-500 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <UploadIcon size={24} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-300">
                    Drag & drop or click to upload
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Video, Audio, or Images
                  </p>
                </div>
                <div className="mt-4">
                  <h4 className="text-xs font-medium text-gray-400 uppercase mb-2">
                    Recent Uploads
                  </h4>
                  <div className="space-y-2">
                    {mediaItems.slice(0, 5).map(item => (
                      <div key={item.id} className={`p-2 rounded-md cursor-pointer ${selectedItemId === item.id ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`} onClick={() => dispatch(setSelectedItemId(item.id))}>
                        <div className="flex items-center">
                          {item.type === 'video' && <VideoIcon size={16} className="mr-2 text-gray-400" />}
                          {item.type === 'audio' && <MusicIcon size={16} className="mr-2 text-gray-400" />}
                          {item.type === 'image' && <ImageIcon size={16} className="mr-2 text-gray-400" />}
                          {item.type === 'text' && <TextIcon size={16} className="mr-2 text-gray-400" />}
                          <span className="text-sm truncate">{item.name}</span>
                        </div>
                      </div>
                    ))}
                    {mediaItems.length === 0 && (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No uploads yet
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toggle button when sidebar is closed */}
      {!sidebarOpen && (
        <button onClick={toggleSidebar} className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-r-md">
          <ChevronRightIcon size={20} />
        </button>
      )}
    </div>
  );
};