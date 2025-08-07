# Debug Export Issues

## Issues Fixed:
1. **File Path Resolution**: The export function was looking for files with full URLs instead of local paths
2. **Empty Text Properties**: FFmpeg was receiving empty color and text values
3. **Better Error Handling**: Added fallback for when no valid media files are found

## Quick Test Steps:

### 1. Test Without Any Media (Should Work Now)
- Go to http://localhost:3333
- Click "Create New Project" 
- Immediately click "Export" without adding any media
- Should create a blue test video with "No media files found" text

### 2. Test With Text Only
- Add text using the sidebar
- Make sure to set some text content
- Export should work

### 3. Test With Uploaded Files
- Upload a video/image/audio file
- Check the backend logs to see the file path
- Export and see if files are found correctly

## Debug Information:

The backend now logs:
- File paths being checked
- Whether files exist or not
- Project duration and media item count
- Full FFmpeg command being executed

## Test File Creation:

If you want to test with a simple video file:

```bash
# Create a test video (requires FFmpeg)
cd backend/uploads/default_user/
ffmpeg -f lavfi -i testsrc=duration=5:size=640x480:rate=30 -pix_fmt yuv420p test_video.mp4
```

## Expected File Structure:
```
backend/uploads/default_user/
├── 1754567646_will_richard.mp4  (your uploaded files)
├── 1754567769_file_example_MP3_700KB.mp3
├── 1754567848_profile.jpg
└── exports/
    └── export_xxxxx.mp4  (exported videos)
```

## If Still Having Issues:

1. Check the backend logs for the exact file paths being checked
2. Verify files exist in `backend/uploads/default_user/`
3. Try the "no media" test first to ensure FFmpeg basic functionality works
4. Check file permissions on the uploads directory