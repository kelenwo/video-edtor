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

// Helper function to calculate the total duration based on media items
const calculateProjectDuration = (mediaItems: MediaItem[]): number => {
  let maxEndTime = 0;
  mediaItems.forEach(item => {
    // Only video and audio items contribute to the overall project duration
    if (item.type === 'video' || item.type === 'audio') {
      maxEndTime = Math.max(maxEndTime, item.endTime || 0);
    }
  });
  // Default to 5 minutes (300 seconds) if no media items or maxEndTime is less
  return Math.max(maxEndTime, 300);
};

const defaultMediaItems: MediaItem[] = [
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
];

const initialState: VideoEditorState = {
  currentTime: 0,
  duration: calculateProjectDuration(defaultMediaItems), // Calculate initial duration here
  isPlaying: false,
  selectedItemId: null,
  projectName: 'Untitled project',
  projectId: null,
  isDraggingText: false,
  activeTextItem: null,
  showTrimControls: false,
  trimItemId: null,
  mediaItems: defaultMediaItems // Use the defined default media items
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
    addMediaItem: {
      reducer: (state, action: PayloadAction<MediaItem>) => {
        state.mediaItems.push(action.payload);
        state.duration = calculateProjectDuration(state.mediaItems); // Recalculate duration
      },
      prepare: (payload: Omit<MediaItem, 'id'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        return {
          payload: {
            ...payload,
            id
          }
        };
      }
    },
    updateMediaItem: (state, action: PayloadAction<{ id: string; updates: Partial<MediaItem> }>) => {
      const { id, updates } = action.payload;
      const itemIndex = state.mediaItems.findIndex(item => item.id === id);
      if (itemIndex !== -1) {
        state.mediaItems[itemIndex] = { ...state.mediaItems[itemIndex], ...updates };
        // If endTime of a video/audio item is updated, recalculate duration
        if ((state.mediaItems[itemIndex].type === 'video' || state.mediaItems[itemIndex].type === 'audio') && updates.endTime !== undefined) {
          state.duration = calculateProjectDuration(state.mediaItems);
        }
      }
    },
    removeMediaItem: (state, action: PayloadAction<string>) => {
      state.mediaItems = state.mediaItems.filter(item => item.id !== action.payload);
      state.duration = calculateProjectDuration(state.mediaItems); // Recalculate duration
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
      const { projectId, projectName, mediaItems } = action.payload; // Removed duration from destructuring
      state.projectId = projectId;
      state.projectName = projectName;
      if (mediaItems) {
        state.mediaItems = mediaItems;
      }
      state.duration = calculateProjectDuration(state.mediaItems); // Calculate duration on project initialization
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
