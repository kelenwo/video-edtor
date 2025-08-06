'use client'

import React, { useEffect, useState, useRef } from 'react';
import {
  UploadIcon, TextIcon, ImageIcon, VideoIcon, MusicIcon, LayersIcon,
  PlusIcon, ChevronLeftIcon, ChevronRightIcon, AlignLeftIcon, AlignCenterIcon,
  AlignRightIcon, BoldIcon, ItalicIcon, ClockIcon, FileTextIcon, XIcon, EyeIcon
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { selectMediaItems, selectSelectedItemId, addMediaItem, updateMediaItem, setSelectedItemId, removeMediaItem } from '../redux/videoEditorSlice';

// Helper component for standardized control sections
const ControlSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="py-3">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
        {title}
      </h4>
      <div className="space-y-3">{children}</div>
    </div>
);

// Helper component for reusable input fields with labels
const InputField = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
);

// Main Sidebar Component
export const Sidebar = () => {
  const dispatch = useAppDispatch();
  const mediaItems = useAppSelector(selectMediaItems);
  const selectedItemId = useAppSelector(selectSelectedItemId);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeItem, setActiveItem] = useState('text');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state for the selected item
  const [textContent, setTextContent] = useState('');
  const [textColor, setTextColor] = useState('#000000');
  const [fontSize, setFontSize] = useState(32);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [posX, setPosX] = useState(50);
  const [posY, setPosY] = useState(50);

  const selectedItem = selectedItemId ? mediaItems.find(item => item.id === selectedItemId) : null;

  // Update local state when a different item is selected
  useEffect(() => {
    if (selectedItem?.type === 'text') {
      setTextContent(selectedItem.content || '');
      setTextColor(selectedItem.fontColor || '#000000');
      setFontSize(selectedItem.fontSize || 32);
      setFontFamily(selectedItem.fontFamily || 'Arial');
      setTextAlign(selectedItem.textAlign || 'center');
      setIsBold(selectedItem.fontWeight === 'bold');
      setIsItalic(selectedItem.fontStyle === 'italic');
      setPosX(selectedItem.position?.x || 50);
      setPosY(selectedItem.position?.y || 50);
      setActiveItem('text');
    }
  }, [selectedItem]);

  const handleUpdate = (updates: Partial<any>) => {
    if (selectedItemId) {
      dispatch(updateMediaItem({ id: selectedItemId, updates }));
    }
  };

  // Helper function to find the next available track
  const findAvailableTrack = (newStartTime: number, newEndTime: number): number => {
    let assignedTrack = 0;
    let foundTrack = false;

    // Sort media items by track and then by startTime to make finding gaps easier
    const sortedMediaItems = [...mediaItems].sort((a, b) => {
      if (a.track !== b.track) return a.track - b.track;
      return a.startTime - b.startTime;
    });

    while (!foundTrack) {
      let overlap = false;
      for (const existingItem of sortedMediaItems) {
        if (existingItem.track === assignedTrack) {
          // Check for overlap: [start1, end1] and [start2, end2] overlap if (start1 < end2 and start2 < end1)
          if (
              (newStartTime < existingItem.endTime && newEndTime > existingItem.startTime)
          ) {
            overlap = true;
            break;
          }
        }
      }
      if (!overlap) {
        foundTrack = true;
      } else {
        assignedTrack++;
      }
    }
    return assignedTrack;
  };

  /**
   * Corrected file upload handler.
   * This function is based on the original, working implementation.
   * It correctly gets the media duration and uses 'url' instead of 'src'.
   */
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const fileType = file.type.split('/')[0];
    const url = URL.createObjectURL(file);

    if (fileType === 'video') {
      // Create a temporary video element to get the actual duration
      const video = document.createElement('video');
      video.src = url;
      video.onloadedmetadata = () => {
        console.log('Video loaded metadata. Duration:', video.duration); // Debug log
        const newTrack = findAvailableTrack(0, video.duration); // Find available track
        const newItem = {
          type: 'video' as const,
          name: file.name,
          duration: video.duration,
          startTime: 0,
          endTime: video.duration,
          track: newTrack, // Assign dynamic track
          color: '#9d84e8',
          url: url, // Use 'url' which the player component expects
          isMuted: false
        };
        dispatch(addMediaItem(newItem));
        setActiveItem('videos');
      };
    } else if (fileType === 'audio') {
      // Create a temporary audio element to get the actual duration
      const audio = document.createElement('audio');
      audio.src = url;
      audio.onloadedmetadata = () => {
        console.log('Audio loaded metadata. Duration:', audio.duration); // Debug log
        const newTrack = findAvailableTrack(0, audio.duration); // Find available track
        const newItem = {
          type: 'audio' as const,
          name: file.name,
          duration: audio.duration,
          startTime: 0,
          endTime: audio.duration,
          track: newTrack, // Assign dynamic track
          color: '#4caf50',
          url: url, // Use 'url'
          isMuted: false
        };
        dispatch(addMediaItem(newItem));
        setActiveItem('audios');
      };
    } else if (fileType === 'image') {
      const defaultImageDuration = 10; // Default duration for images
      const newTrack = findAvailableTrack(0, defaultImageDuration); // Find available track
      const newItem = {
        type: 'image' as const,
        name: file.name,
        duration: defaultImageDuration,
        startTime: 0,
        endTime: defaultImageDuration,
        track: newTrack, // Assign dynamic track
        url: url, // Use 'url'
        position: {
          x: 50,
          y: 50
        }
      };
      dispatch(addMediaItem(newItem));
      setActiveItem('photos');
    }

    // Reset file input to allow uploading the same file again
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
    const defaultTextDuration = 10;
    const newTrack = findAvailableTrack(0, defaultTextDuration); // Find available track
    const newItem = {
      type: 'text' as const,
      name: 'New Text',
      content: 'Your Text Here',
      duration: defaultTextDuration,
      startTime: 0,
      endTime: defaultTextDuration,
      track: newTrack, // Assign dynamic track
      position: { x: 50, y: 50 },
      fontSize: 32,
      fontFamily: 'Arial',
      fontColor: '#000000',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'center' as const,
    };
    const action = dispatch(addMediaItem(newItem));
    dispatch(setSelectedItemId(action.payload.id));
  };

  // Reusable list for sidebar navigation
  const sidebarNavItems = [
    { id: 'uploads', label: 'Uploads', icon: UploadIcon },
    { id: 'text', label: 'Text', icon: TextIcon },
    { id: 'videos', label: 'Videos', icon: VideoIcon },
    { id: 'audios', label: 'Audios', icon: MusicIcon },
    { id: 'photos', label: 'Photos', icon: ImageIcon },
    { id: 'records', label: 'Records', icon: ClockIcon },
    { id: 'subtitles', label: 'Subtitles', icon: FileTextIcon },
  ];

  const renderMediaList = (type: 'video' | 'audio' | 'image') => {
    const filteredItems = mediaItems.filter(item => item.type === type);

    const handleRemoveItem = (e: React.MouseEvent, id: string) => {
      e.stopPropagation(); // Prevent the parent div's onClick from firing
      dispatch(removeMediaItem(id));
    };

    if (filteredItems.length === 0) {
      return <div className="text-center text-gray-500 pt-10 text-sm">No {type}s uploaded.</div>
    }
    return (
        <div className="space-y-2">
          {filteredItems.map(item => (
              <div
                  key={item.id}
                  className={`group relative p-2 rounded-md text-sm cursor-pointer flex items-center justify-between ${selectedItemId === item.id ? 'bg-blue-100 text-blue-800 ring-1 ring-blue-500' : 'bg-gray-100 hover:bg-gray-200'}`}
                  onClick={() => dispatch(setSelectedItemId(item.id))}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {item.type === 'image' && item.url ? (
                      <img src={item.url} alt={item.name} className="w-10 h-10 object-cover rounded-md bg-gray-200 flex-shrink-0" />
                  ) : (
                      <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-gray-200 rounded-md">
                        {item.type === 'video' && <VideoIcon className="w-5 h-5 text-gray-500" />}
                        {item.type === 'audio' && <MusicIcon className="w-5 h-5 text-gray-500" />}
                      </div>
                  )}
                  <span className="truncate">{item.name}</span> <button
                    onClick={(e) => handleRemoveItem(e, item.id)}
                    className="p-1 text-red-600 hover:text-red-500"
                    title="Delete"
                >
                  <XIcon className="w-4 h-4" />
                </button>
                </div>

                <div className="d-none absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button className="p-1 text-gray-500 hover:text-blue-600" title="Preview">
                    <EyeIcon className="w-4 h-4" />
                  </button>
                  <button
                      onClick={(e) => handleRemoveItem(e, item.id)}
                      className="p-1 text-red-300 hover:text-red-500"
                      title="Delete"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
          ))}
        </div>
    )
  }

  return (
      <div className="flex h-full bg-gray-50">
        {/* Main Vertical Sidebar */}
        <div className="w-24 bg-white border-r border-gray-200 flex flex-col items-center py-4">
          <div className="mb-6">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <LayersIcon size={20} className="text-white" />
            </div>
          </div>
          <div className="flex flex-col space-y-2 items-center w-full px-2">
            {sidebarNavItems.map(item => (
                <button
                    key={item.id}
                    className={`flex flex-col items-center justify-center w-full h-16 rounded-lg transition-colors duration-200 ${
                        activeItem === item.id ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    onClick={() => setActiveItem(item.id)}
                >
                  <item.icon size={20} />
                  <span className="text-xs mt-1 font-medium">{item.label}</span>
                </button>
            ))}
          </div>
        </div>

        {/* Collapsible Content Sidebar */}
        {sidebarOpen && (
            <div className="w-80 bg-white text-gray-900 flex flex-col border-r border-gray-200 transition-all duration-300">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="font-semibold text-lg capitalize">{activeItem}</h3>
                <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100">
                  <ChevronLeftIcon size={18} />
                </button>
              </div>

              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />

              <div className="flex-1 overflow-y-auto p-4">
                {activeItem === 'uploads' && (
                    <ControlSection title="Upload Media">
                      <button onClick={() => triggerFileUpload('video')} className="w-full flex items-center justify-center space-x-2 py-2.5 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700">
                        <VideoIcon size={16} />
                        <span>Upload Video</span>
                      </button>
                      <button onClick={() => triggerFileUpload('audio')} className="w-full flex items-center justify-center space-x-2 py-2.5 bg-green-600 text-white rounded-md text-sm font-semibold hover:bg-green-700">
                        <MusicIcon size={16} />
                        <span>Upload Audio</span>
                      </button>
                      <button onClick={() => triggerFileUpload('image')} className="w-full flex items-center justify-center space-x-2 py-2.5 bg-purple-600 text-white rounded-md text-sm font-semibold hover:bg-purple-700">
                        <ImageIcon size={16} />
                        <span>Upload Image</span>
                      </button>
                    </ControlSection>
                )}

                {activeItem === 'videos' && renderMediaList('video')}
                {activeItem === 'audios' && renderMediaList('audio')}
                {activeItem === 'photos' && renderMediaList('image')}

                {activeItem === 'text' && (
                    <div className="divide-y divide-gray-200">
                      <ControlSection title="Content">
                                    <textarea
                                        value={textContent}
                                        onChange={(e) => {
                                          setTextContent(e.target.value);
                                          handleUpdate({ content: e.target.value });
                                        }}
                                        placeholder="Your text here"
                                        className="w-full h-24 p-2 bg-white border border-gray-300 rounded-md text-sm resize-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    />
                        <button onClick={handleAddText} className="w-full mt-2 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700">
                          Add New Text
                        </button>
                      </ControlSection>

                      <ControlSection title="Typography">
                        <InputField label="Font Family">
                          <select value={fontFamily} onChange={(e) => { setFontFamily(e.target.value); handleUpdate({ fontFamily: e.target.value }); }} className="w-full p-2 bg-white border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                            <option>Arial</option>
                            <option>Helvetica</option>
                            <option>Georgia</option>
                            <option>Verdana</option>
                          </select>
                        </InputField>
                        <div className="flex items-center space-x-2">
                          <button className={`p-2 rounded-md border ${isBold ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white border-gray-300 hover:bg-gray-100'}`} onClick={() => { const newV = !isBold; setIsBold(newV); handleUpdate({ fontWeight: newV ? 'bold' : 'normal' }); }}>
                            <BoldIcon size={16} />
                          </button>
                          <button className={`p-2 rounded-md border ${isItalic ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white border-gray-300 hover:bg-gray-100'}`} onClick={() => { const newV = !isItalic; setIsItalic(newV); handleUpdate({ fontStyle: newV ? 'italic' : 'normal' }); }}>
                            <ItalicIcon size={16} />
                          </button>
                        </div>
                        <InputField label={`Font Size: ${fontSize}px`}>
                          <input type="range" min="12" max="120" value={fontSize} onChange={(e) => { const size = parseInt(e.target.value); setFontSize(size); handleUpdate({ fontSize: size }); }} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                        </InputField>
                      </ControlSection>

                      <ControlSection title="Appearance">
                        <InputField label="Text Color">
                          <div className="flex items-center space-x-2">
                            <input type="color" value={textColor} onChange={(e) => { setTextColor(e.target.value); handleUpdate({ fontColor: e.target.value }); }} className="p-1 h-10 w-10 block bg-white border border-gray-300 cursor-pointer rounded-lg" />
                            <input type="text" value={textColor} onChange={(e) => { setTextColor(e.target.value); handleUpdate({ fontColor: e.target.value }); }} className="w-full p-2 bg-white border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
                          </div>
                        </InputField>
                        <InputField label="Alignment">
                          <div className="flex w-full border border-gray-300 rounded-md overflow-hidden">
                            <button className={`flex-1 p-2 text-gray-600 ${textAlign === 'left' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`} onClick={() => { setTextAlign('left'); handleUpdate({ textAlign: 'left' }); }}>
                              <AlignLeftIcon size={16} className="mx-auto" />
                            </button>
                            <button className={`flex-1 p-2 text-gray-600 border-l border-r border-gray-300 ${textAlign === 'center' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`} onClick={() => { setTextAlign('center'); handleUpdate({ textAlign: 'center' }); }}>
                              <AlignCenterIcon size={16} className="mx-auto" />
                            </button>
                            <button className={`flex-1 p-2 text-gray-600 ${textAlign === 'right' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`} onClick={() => { setTextAlign('right'); handleUpdate({ textAlign: 'right' }); }}>
                              <AlignRightIcon size={16} className="mx-auto" />
                            </button>
                          </div>
                        </InputField>
                      </ControlSection>

                      <ControlSection title="Transform">
                        <div className="grid grid-cols-2 gap-3">
                          <InputField label="Position X">
                            <input type="number" value={posX} onChange={e => { const val = parseInt(e.target.value); setPosX(val); handleUpdate({ position: { x: val, y: posY } }); }} className="w-full p-2 bg-white border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
                          </InputField>
                          <InputField label="Position Y">
                            <input type="number" value={posY} onChange={e => { const val = parseInt(e.target.value); setPosY(val); handleUpdate({ position: { x: posX, y: val } }); }} className="w-full p-2 bg-white border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
                          </InputField>
                        </div>
                      </ControlSection>
                    </div>
                )}
              </div>
            </div>
        )}

        {/* Toggle button when sidebar is closed */}
        {!sidebarOpen && (
            <div className="flex items-start pt-4">
              <button onClick={() => setSidebarOpen(true)} className="p-2 bg-white hover:bg-gray-100 text-gray-600 hover:text-gray-900 rounded-r-md border border-l-0 border-gray-200">
                <ChevronRightIcon size={20} />
              </button>
            </div>
        )}
      </div>
  );
};
