# Quick Start - Video Editor Export Testing

## Prerequisites

Make sure you have **FFmpeg** installed:

```bash
# Check if FFmpeg is installed
ffmpeg -version

# Install FFmpeg if needed:
# Ubuntu/Debian: sudo apt install ffmpeg
# macOS: brew install ffmpeg
# Windows: Download from https://ffmpeg.org/download.html
```

## Quick Setup (No Authentication Required)

### 1. Start Backend Server

```bash
cd backend
go run main.go
```

**Expected output:**
```
Connected to MongoDB!
WebSocket hub started.
Video processing worker started.
Server starting on port 8080
```

### 2. Start Frontend Server

```bash
cd frontend
npm run dev
```

**Frontend available at:** http://localhost:3333

## Test the Export Feature

### 1. Open the Video Editor
- Visit http://localhost:3333
- Click "Create New Project" (no login required)

### 2. Add Media to Your Project
- **Upload Video**: Click the video icon in sidebar → Upload a video file
- **Upload Images**: Click the image icon → Upload images  
- **Upload Audio**: Click the music icon → Upload audio files
- **Add Text**: Click the text icon → Add text overlays

### 3. Arrange Your Composition
- Drag items on the timeline to arrange them
- Adjust timing by dragging the edges of timeline items
- Use the preview window to see your composition
- Position elements by dragging them in the preview

### 4. Export Your Video
- Click the **"Export"** button in the top-right header
- Choose your settings:
  - **Quality**: High/Medium/Low
  - **Format**: MP4 (recommended), WebM, or AVI
  - **Resolution**: 1080p, 720p, or 480p
- Click **"Start Export"**
- Watch the real-time progress updates
- Download when complete!

## File Locations

- **Uploaded files**: `backend/uploads/default_user/`
- **Exported videos**: `backend/uploads/default_user/exports/`

## Troubleshooting

### Backend Issues
```bash
# If MongoDB connection fails
# The app will still work for file uploads and exports

# If FFmpeg not found
which ffmpeg
# Install FFmpeg and try again
```

### Frontend Issues
```bash
# If upload fails, check backend logs
# If export fails, check backend terminal for FFmpeg errors
```

### Test Files
You can test with any media files you have, or create test files:

```bash
# Create a test video (requires FFmpeg)
ffmpeg -f lavfi -i testsrc=duration=10:size=640x480:rate=30 -pix_fmt yuv420p test_video.mp4

# Create a test image
# Use any PNG/JPG image file
```

## What's Different (No Auth Mode)

- ✅ No login/registration required
- ✅ All files stored under `default_user`
- ✅ Full export functionality works
- ✅ Real-time progress tracking
- ✅ File upload and download

## Re-enabling Authentication

When you want to add authentication back:

1. **Backend**: Remove the temporary endpoints and uncomment the authenticated routes in `main.go`
2. **Frontend**: Remove the `setIsAuthenticated(true)` override in `app/page.tsx`
3. **API**: Re-enable auth headers in `app/services/api.ts`

## Sample Workflow

1. **Upload a video** (e.g., 10-second clip)
2. **Add an image** overlay 
3. **Add text** overlay with custom position
4. **Upload background music**
5. **Arrange on timeline** with different start/end times
6. **Export to MP4** and download!

The system will use FFmpeg to:
- Create a canvas with your chosen resolution
- Layer your video as the base
- Overlay the image at specified position and timing
- Add text overlay with custom styling
- Mix the audio tracks
- Export as a single MP4 file

🎉 **You now have a working video editor with export functionality!**