# Video Editor with Export Functionality - Setup Guide

This project provides a complete video editor with the ability to export compositions to MP4 files using FFmpeg on the backend.

## Features

- 🎬 **Video Editor**: Full-featured video editing interface with timeline, preview, and layered composition
- 📁 **File Upload**: Upload videos, audio, and images to the server for processing
- 🎨 **Media Composition**: Layer videos, images, text, and audio with precise positioning and timing
- 📤 **Video Export**: Export your compositions to MP4 files with customizable quality settings
- 🔄 **Real-time Progress**: WebSocket-based progress tracking for exports
- 🔐 **Authentication**: User authentication and file isolation

## Architecture

- **Frontend**: Next.js with React, Redux Toolkit, TypeScript
- **Backend**: Go with Gin framework, MongoDB, WebSocket support
- **Video Processing**: FFmpeg for complex video composition and export
- **File Storage**: Local filesystem with user-specific directories

## Prerequisites

### Required Software

1. **Node.js** (v18 or higher)
   ```bash
   node --version
   ```

2. **Go** (v1.21 or higher)
   ```bash
   go version
   ```

3. **FFmpeg** (Required for video processing)
   
   **Ubuntu/Debian:**
   ```bash
   sudo apt update
   sudo apt install ffmpeg
   ```
   
   **macOS (with Homebrew):**
   ```bash
   brew install ffmpeg
   ```
   
   **Windows:**
   - Download from https://ffmpeg.org/download.html
   - Add to PATH environment variable

4. **MongoDB** (Local installation or MongoDB Atlas)
   
   **Ubuntu/Debian:**
   ```bash
   sudo apt install mongodb
   sudo systemctl start mongodb
   ```
   
   **macOS (with Homebrew):**
   ```bash
   brew install mongodb-community
   brew services start mongodb-community
   ```

### Verify FFmpeg Installation

```bash
ffmpeg -version
```

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
go mod download
```

### 2. Configure Environment Variables

Create `.env` file in the `backend` directory:

```bash
cd backend
cat > .env << EOF
MONGODB_URI=mongodb://localhost:27017
DB_NAME=video_editor
JWT_SECRET=your-super-secret-jwt-key-here
PORT=8080
EOF
```

### 3. Start the Backend Server

```bash
cd backend
go run main.go
```

The backend will:
- Start on port 8080
- Create the `uploads` directory for file storage
- Connect to MongoDB
- Initialize WebSocket hub for real-time updates

### 4. Start the Frontend Development Server

```bash
cd frontend
npm run dev
```

The frontend will be available at http://localhost:3333

## Usage Guide

### 1. Authentication
- Open http://localhost:3333
- Click "Sign In" to create an account or log in
- Authentication is required for file uploads and exports

### 2. Creating a Video Project
- Click "Create New Project" after logging in
- You'll be taken to the video editor interface

### 3. Adding Media
- Use the sidebar to upload videos, audio, images, or add text
- Uploaded files are stored on the server and can be reused
- Drag and drop items onto the timeline

### 4. Editing Your Composition
- **Timeline**: Arrange media items on different tracks
- **Preview**: See your composition in real-time
- **Properties**: Adjust position, size, and timing of selected items
- **Text**: Add customizable text overlays

### 5. Exporting Videos
- Click the "Export" button in the header
- Choose quality (High/Medium/Low), format (MP4/WebM/AVI), and resolution
- Click "Start Export" to begin processing
- Monitor progress via real-time WebSocket updates
- Download the completed video when ready

## File Structure

```
/workspace/
├── backend/
│   ├── main.go              # Main server with file upload & export endpoints
│   ├── services/
│   │   ├── video_processor.go # FFmpeg video composition logic
│   │   ├── auth_service.go    # User authentication
│   │   └── project_service.go # Project management
│   ├── websocket/           # WebSocket implementation
│   ├── models/              # Data models
│   └── uploads/             # User file storage (created automatically)
└── frontend/
    ├── app/
    │   ├── services/api.ts  # Backend API client
    │   └── page.tsx         # Main landing page with auth
    ├── components/
    │   ├── ExportModal.tsx  # Video export interface
    │   ├── AuthModal.tsx    # Login/register modal
    │   ├── Sidebar.tsx      # Media upload and properties
    │   ├── VideoPreview.tsx # Video preview component
    │   └── Timeline.tsx     # Timeline editor
    └── redux/               # State management
```

## API Endpoints

### Authentication
- `POST /register` - Create new user account
- `POST /login` - User login (returns JWT token)

### File Management
- `POST /upload` - Upload media files (requires auth)
- `GET /uploads/*` - Serve uploaded files

### Video Processing
- `POST /export` - Export video composition (requires auth)
- `GET /ws` - WebSocket for real-time export progress

## Export Process

1. **Frontend**: User configures export settings and submits project data
2. **Backend**: Creates export job and adds to processing queue
3. **FFmpeg Processing**: 
   - Creates blank canvas with specified resolution
   - Layers videos, images, and text overlays with precise timing
   - Handles audio mixing from multiple sources
   - Applies scaling, positioning, and effects
4. **Real-time Updates**: Progress sent via WebSocket
5. **Download**: Completed video available for download

## Troubleshooting

### FFmpeg Not Found
```bash
# Verify FFmpeg is in PATH
which ffmpeg

# Test FFmpeg functionality
ffmpeg -f lavfi -i testsrc=duration=1:size=320x240:rate=1 test.mp4
```

### MongoDB Connection Issues
```bash
# Check MongoDB is running
sudo systemctl status mongodb

# Test connection
mongo --eval "db.adminCommand('ismaster')"
```

### File Upload Permissions
```bash
# Ensure uploads directory is writable
chmod 755 backend/uploads
```

### CORS Issues
The backend includes CORS headers for development. For production, update the CORS configuration in `main.go`.

## Production Deployment

### Backend Considerations
- Use environment variables for configuration
- Set up proper CORS policies
- Use cloud storage (AWS S3, Google Cloud Storage) instead of local filesystem
- Implement proper logging and monitoring
- Use a production MongoDB instance

### Frontend Considerations
- Update API_BASE_URL in `frontend/app/services/api.ts`
- Build for production: `npm run build`
- Deploy to Vercel, Netlify, or similar platform

### Security
- Use strong JWT secrets
- Implement rate limiting
- Add file size and type validation
- Secure file upload directory permissions

## Advanced Features

The export system supports:
- **Multi-track composition**: Videos, audio, images, and text on separate tracks
- **Precise timing**: Frame-accurate positioning and duration control
- **Audio mixing**: Combine multiple audio sources with delay compensation
- **Quality options**: Variable bitrate encoding for different use cases
- **Real-time feedback**: Progress updates and error handling via WebSocket

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test export functionality thoroughly
5. Submit a pull request

## License

This project is provided as a demonstration of video editing and export functionality using modern web technologies and FFmpeg.