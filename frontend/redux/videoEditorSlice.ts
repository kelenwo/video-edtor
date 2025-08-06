import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type MediaItem = {
  id: string;
  type: 'video' | 'audio' | 'image' | 'text';
  name: string;
  duration: number; // in seconds
  startTime: number; // position in timeline
  endTime: number; // position in timeline
  track: number; // track number
  color?: string; // for visual distinction
  content?: string; // for text
  url?: string; // for video/audio/image
  position?: {
    x: number;
    y: number;
  }; // position for text/image overlays
  fontSize?: number; // for text
  fontFamily?: string; // for text
  fontColor?: string; // for text
  fontWeight?: string; // for text
  fontStyle?: string; // for text
  textAlign?: 'left' | 'center' | 'right'; // for text
  isMuted?: boolean; // for audio/video
};

interface VideoEditorState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  mediaItems: MediaItem[];
  selectedItemId: string | null;
  projectName: string;
  projectId: string | null;
  isDraggingText: boolean;
  activeTextItem: string | null;
  showTrimControls: boolean;
  trimItemId: string | null;
}

const initialState: VideoEditorState = {
  currentTime: 0,
  duration: 60,
  isPlaying: false,
  selectedItemId: null,
  projectName: 'Untitled project',
  projectId: null,
  isDraggingText: false,
  activeTextItem: null,
  showTrimControls: false,
  trimItemId: null,
  mediaItems: [
    {
      id: '1',
      type: 'video',
      name: 'Cooking Footage',
      duration: 30,
      startTime: 0,
      endTime: 30,
      track: 0,
      color: '#9d84e8',
      url: 'https://cdn.coverr.co/videos/coverr-cooking-vegetables-in-a-pan-5858/1080p.mp4',
      isMuted: false
    },
    {
      id: '2',
      type: 'text',
      name: 'Title Text',
      duration: 15,
      startTime: 5,
      endTime: 20,
      track: 1,
      content: 'Pasta Picasso',
      position: {
        x: 50,
        y: 20
      },
      fontSize: 32,
      fontFamily: 'Arial',
      fontColor: '#ffffff',
      fontWeight: 'bold',
      textAlign: 'center'
    },
    {
      id: '3',
      type: 'audio',
      name: 'Background Music',
      duration: 45,
      startTime: 0,
      endTime: 45,
      track: 2,
      color: '#4caf50',
      url: 'https://example.com/audio1.mp3',
      isMuted: false
    }
  ]
};

const videoEditorSlice = createSlice({
  name: 'videoEditor',
  initialState,
  reducers: {
    setCurrentTime: (state, action: PayloadAction<number>) => {
      state.currentTime = action.payload;
    },
    setDuration: (state, action: PayloadAction<number>) => {
      state.duration = action.payload;
    },
    setIsPlaying: (state, action: PayloadAction<boolean>) => {
      state.isPlaying = action.payload;
    },
    addMediaItem: (state, action: PayloadAction<Omit<MediaItem, 'id'>>) => {
      const newItem = {
        ...action.payload,
        id: Math.random().toString(36).substr(2, 9)
      };
      state.mediaItems.push(newItem);
    },
    updateMediaItem: (state, action: PayloadAction<{ id: string; updates: Partial<MediaItem> }>) => {
      const { id, updates } = action.payload;
      const itemIndex = state.mediaItems.findIndex(item => item.id === id);
      if (itemIndex !== -1) {
        state.mediaItems[itemIndex] = { ...state.mediaItems[itemIndex], ...updates };
      }
    },
    removeMediaItem: (state, action: PayloadAction<string>) => {
      state.mediaItems = state.mediaItems.filter(item => item.id !== action.payload);
    },
    setSelectedItemId: (state, action: PayloadAction<string | null>) => {
      state.selectedItemId = action.payload;
    },
    setProjectName: (state, action: PayloadAction<string>) => {
      state.projectName = action.payload;
    },
    setProjectId: (state, action: PayloadAction<string | null>) => {
      state.projectId = action.payload;
    },
    setIsDraggingText: (state, action: PayloadAction<boolean>) => {
      state.isDraggingText = action.payload;
    },
    setActiveTextItem: (state, action: PayloadAction<string | null>) => {
      state.activeTextItem = action.payload;
    },
    setShowTrimControls: (state, action: PayloadAction<boolean>) => {
      state.showTrimControls = action.payload;
    },
    setTrimItemId: (state, action: PayloadAction<string | null>) => {
      state.trimItemId = action.payload;
    },
    initializeProject: (state, action: PayloadAction<{ projectId: string; projectName: string; duration: number; mediaItems?: MediaItem[] }>) => {
      const { projectId, projectName, duration, mediaItems } = action.payload;
      state.projectId = projectId;
      state.projectName = projectName;
      state.duration = duration;
      if (mediaItems) {
        state.mediaItems = mediaItems;
      }
      // Reset other state
      state.currentTime = 0;
      state.isPlaying = false;
      state.selectedItemId = null;
      state.isDraggingText = false;
      state.activeTextItem = null;
      state.showTrimControls = false;
      state.trimItemId = null;
    }
  }
});

export const {
  setCurrentTime,
  setDuration,
  setIsPlaying,
  addMediaItem,
  updateMediaItem,
  removeMediaItem,
  setSelectedItemId,
  setProjectName,
  setProjectId,
  setIsDraggingText,
  setActiveTextItem,
  setShowTrimControls,
  setTrimItemId,
  initializeProject
} = videoEditorSlice.actions;

export default videoEditorSlice.reducer;

// Selectors
export const selectCurrentTime = (state: { videoEditor: VideoEditorState }) => state.videoEditor.currentTime;
export const selectDuration = (state: { videoEditor: VideoEditorState }) => state.videoEditor.duration;
export const selectIsPlaying = (state: { videoEditor: VideoEditorState }) => state.videoEditor.isPlaying;
export const selectMediaItems = (state: { videoEditor: VideoEditorState }) => state.videoEditor.mediaItems;
export const selectSelectedItemId = (state: { videoEditor: VideoEditorState }) => state.videoEditor.selectedItemId;
export const selectProjectName = (state: { videoEditor: VideoEditorState }) => state.videoEditor.projectName;
export const selectProjectId = (state: { videoEditor: VideoEditorState }) => state.videoEditor.projectId;
export const selectIsDraggingText = (state: { videoEditor: VideoEditorState }) => state.videoEditor.isDraggingText;
export const selectActiveTextItem = (state: { videoEditor: VideoEditorState }) => state.videoEditor.activeTextItem;
export const selectShowTrimControls = (state: { videoEditor: VideoEditorState }) => state.videoEditor.showTrimControls;
export const selectTrimItemId = (state: { videoEditor: VideoEditorState }) => state.videoEditor.trimItemId;