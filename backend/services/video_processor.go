package services

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"log"
	"os/exec"
	"time"
	"encoding/json"
	"strconv"
	"strings"
	"path/filepath"
	"os"

	"video-editor/db"
	"video-editor/models"
	"video-editor/websocket" // Import the websocket package

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// VideoProcessingJobQueue is a simple in-memory channel for jobs
var VideoProcessingJobQueue = make(chan models.VideoProcessingJob, 100) // Buffer for 100 jobs

// AddJobToQueue adds a job to the processing queue
func AddJobToQueue(job models.VideoProcessingJob) {
	VideoProcessingJobQueue <- job
	log.Printf("Job %s added to queue. Action: %s, Project: %s", job.ID.Hex(), job.Action, job.ProjectID)
}

// VideoProcessor handles FFmpeg operations
type VideoProcessor struct {
	jobsCollection     *mongo.Collection
	projectsCollection *mongo.Collection
}

// NewVideoProcessor creates a new VideoProcessor
func NewVideoProcessor(client *mongo.Client, dbName string) *VideoProcessor {
	return &VideoProcessor{
		jobsCollection:     client.Database(dbName).Collection("video_jobs"),
		projectsCollection: client.Database(dbName).Collection("projects"),
	}
}

// StartWorker starts a goroutine to process jobs from the queue
func (vp *VideoProcessor) StartWorker(hub *websocket.Hub) {
	for job := range VideoProcessingJobQueue {
		log.Printf("Processing job: %s (Action: %s) for user %s", job.ID.Hex(), job.Action, job.UserID)

		// Update job status to processing in DB
		if err := vp.updateJobStatus(job.ID, "processing", ""); err != nil {
			log.Printf("Failed to update job %s status to processing: %v", job.ID.Hex(), err)
			hub.BroadcastToUser(job.UserID, fmt.Sprintf("Job %s: Failed to start processing.", job.ID.Hex()))
			continue
		}
		hub.BroadcastToUser(job.UserID, fmt.Sprintf("Job %s: Processing...", job.ID.Hex()))

		// Execute FFmpeg operation
		outputURL, err := vp.executeFFmpeg(job)
		if err != nil {
			log.Printf("FFmpeg failed for job %s: %v", job.ID.Hex(), err)
			if err := vp.updateJobStatus(job.ID, "failed", err.Error()); err != nil {
				log.Printf("Failed to update job %s status to failed: %v", job.ID.Hex(), err)
			}
			hub.BroadcastToUser(job.UserID, fmt.Sprintf("Job %s: Failed! %v", job.ID.Hex(), err))
			continue
		}

		// Update job status to completed in DB
		if err := vp.updateJobStatus(job.ID, "completed", outputURL); err != nil {
			log.Printf("Failed to update job %s status to completed: %v", job.ID.Hex(), err)
			hub.BroadcastToUser(job.UserID, fmt.Sprintf("Job %s: Completed, but failed to update DB.", job.ID.Hex()))
			continue
		}

		// Also update the project's status and output URL
		if err := vp.updateProjectStatus(job.ProjectID, "completed", outputURL); err != nil {
			log.Printf("Failed to update project %s status to completed: %v", job.ProjectID, err)
		}

		log.Printf("Job %s completed. Output: %s", job.ID.Hex(), outputURL)
		hub.BroadcastToUser(job.UserID, fmt.Sprintf("Job %s: Completed! Output: %s", job.ID.Hex(), outputURL))
	}
}

// executeFFmpeg constructs and runs FFmpeg commands
func (vp *VideoProcessor) executeFFmpeg(job models.VideoProcessingJob) (string, error) {
	// In a real app, you'd fetch the project to get the original video URL.
	// For POC, let's assume `input_video.mp4` exists locally for demonstration.
	// You'd download from cloud storage (e.g., GCS) here.
	inputPath := "input_video.mp4" // Placeholder: replace with actual downloaded path from cloud storage

	outputFileName := fmt.Sprintf("output_%s.mp4", job.ID.Hex())
	outputPath := outputFileName // For POC, output to local file. In production, upload to cloud storage.

	var cmdArgs []string

	switch job.Action {
	case "export":
		// Handle full project export
		return vp.executeProjectExport(job)

	case "trim":
		// Expecting params: {"start_time": float64, "end_time": float64}
		startTime, ok1 := job.Params["start_time"].(float64)
		endTime, ok2 := job.Params["end_time"].(float64)
		if !ok1 || !ok2 {
			return "", errors.New("missing or invalid trim parameters")
		}
		cmdArgs = []string{
			"-ss", fmt.Sprintf("%f", startTime), // Start time
			"-i", inputPath, // Input file
			"-to", fmt.Sprintf("%f", endTime-startTime), // Duration
			"-c", "copy", // Copy streams without re-encoding (fast)
			outputPath,
		}
		log.Printf("FFmpeg trim command: ffmpeg %v", cmdArgs)

	case "add_text":
		// Expecting params: {"text": string, "x": string, "y": string, "fontfile": string, "fontsize": float64, "fontcolor": string, "start_time": float64, "duration": float64}
		text, ok1 := job.Params["text"].(string)
		x, ok2 := job.Params["x"].(string)
		y, ok3 := job.Params["y"].(string)
		fontfile, ok4 := job.Params["fontfile"].(string) // e.g., "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
		fontsize, ok5 := job.Params["fontsize"].(float64)
		fontcolor, ok6 := job.Params["fontcolor"].(string)
		startTime, ok7 := job.Params["start_time"].(float64)
		duration, ok8 := job.Params["duration"].(float64)

		if !ok1 || !ok2 || !ok3 || !ok4 || !ok5 || !ok6 || !ok7 || !ok8 {
			return "", errors.New("missing or invalid add_text parameters")
		}

		// Example drawtext filter: "drawtext=fontfile=/path/to/font.ttf:text='Hello World':x=100:y=100:fontsize=24:fontcolor=white:enable='between(t,0,5)'"
		filterComplex := fmt.Sprintf("drawtext=fontfile='%s':text='%s':x=%s:y=%s:fontsize=%f:fontcolor=%s:enable='between(t,%f,%f)'",
			fontfile, text, x, y, fontsize, fontcolor, startTime, startTime+duration)

		cmdArgs = []string{
			"-i", inputPath,
			"-vf", filterComplex, // Video filter for text overlay
			"-c:a", "copy", // Copy audio stream
			outputPath,
		}
		log.Printf("FFmpeg add_text command: ffmpeg %v", cmdArgs)

	default:
		return "", fmt.Errorf("unsupported action: %s", job.Action)
	}

	cmd := exec.Command("ffmpeg", cmdArgs...)

	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		return "", fmt.Errorf("ffmpeg command failed: %v\nStdout: %s\nStderr: %s", err, out.String(), stderr.String())
	}

	// In production, you would upload `outputPath` to cloud storage here
	// and return the cloud storage URL.
	log.Printf("FFmpeg output: %s", out.String())
	return "http://your-cloud-storage.com/" + outputPath, nil // Simulated URL
}

// updateJobStatus updates the status of a video processing job in MongoDB
func (vp *VideoProcessor) updateJobStatus(jobID primitive.ObjectID, status, message string) error {
	filter := bson.M{"_id": jobID}
	update := bson.M{
		"$set": bson.M{
			"status":     status,
			"message":    message,
			"updated_at": time.Now(),
		},
	}
	_, err := vp.jobsCollection.UpdateOne(db.Ctx, filter, update, options.Update().SetUpsert(true))
	return err
}

// updateProjectStatus updates the status of a project in MongoDB
func (vp *VideoProcessor) updateProjectStatus(projectID string, status, outputURL string) error {
	objID, err := primitive.ObjectIDFromHex(projectID)
	if err != nil {
		return errors.New("invalid project ID format for status update")
	}

	update := bson.M{
		"$set": bson.M{
			"status":     status,
			"output_url": outputURL,
			"updated_at": time.Now(),
		},
	}
	_, err = vp.projectsCollection.UpdateByID(db.Ctx, objID, update)
	return err
}

// executeProjectExport handles the export of a complete video project
func (vp *VideoProcessor) executeProjectExport(job models.VideoProcessingJob) (string, error) {
	// Extract project data and settings
	projectDataInterface, ok := job.Params["projectData"]
	if !ok {
		return "", errors.New("missing project data")
	}

	settingsInterface, ok := job.Params["settings"]
	if !ok {
		return "", errors.New("missing export settings")
	}

	// Parse project data
	projectDataBytes, err := json.Marshal(projectDataInterface)
	if err != nil {
		return "", fmt.Errorf("failed to marshal project data: %v", err)
	}

	var projectData struct {
		MediaItems []struct {
			ID       string  `json:"id"`
			Type     string  `json:"type"`
			URL      string  `json:"url"`
			Track    int     `json:"track"`
			StartTime float64 `json:"startTime"`
			EndTime   float64 `json:"endTime"`
			Duration  float64 `json:"duration"`
			X         float64 `json:"x"`
			Y         float64 `json:"y"`
			Width     float64 `json:"width"`
			Height    float64 `json:"height"`
			Text      string  `json:"text"`
			Color     string  `json:"color"`
			FontSize  float64 `json:"fontSize"`
			IsMuted   bool    `json:"isMuted"`
		} `json:"mediaItems"`
		Duration    float64 `json:"duration"`
		AspectRatio string  `json:"aspectRatio"`
	}

	if err := json.Unmarshal(projectDataBytes, &projectData); err != nil {
		return "", fmt.Errorf("failed to parse project data: %v", err)
	}

	// Parse export settings
	settingsBytes, err := json.Marshal(settingsInterface)
	if err != nil {
		return "", fmt.Errorf("failed to marshal settings: %v", err)
	}

	var settings struct {
		Quality    string `json:"quality"`    // "high", "medium", "low"
		Format     string `json:"format"`     // "mp4", "webm", "avi"
		Resolution string `json:"resolution"` // "1920x1080", "1280x720", "854x480"
	}

	if err := json.Unmarshal(settingsBytes, &settings); err != nil {
		return "", fmt.Errorf("failed to parse settings: %v", err)
	}

	// Set default values
	if settings.Quality == "" {
		settings.Quality = "medium"
	}
	if settings.Format == "" {
		settings.Format = "mp4"
	}
	if settings.Resolution == "" {
		settings.Resolution = "1920x1080"
	}

	// Create output directory for user exports
	userExportDir := filepath.Join("uploads", job.UserID, "exports")
	if err := os.MkdirAll(userExportDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create export directory: %v", err)
	}

	// Generate output filename
	outputFileName := fmt.Sprintf("export_%s.%s", job.ID.Hex(), settings.Format)
	outputPath := filepath.Join(userExportDir, outputFileName)

	// Build FFmpeg command for complex composition
	return vp.buildComplexFFmpegCommand(projectData, settings, outputPath)
}

// buildComplexFFmpegCommand constructs FFmpeg command for complex video composition
func (vp *VideoProcessor) buildComplexFFmpegCommand(projectData struct {
	MediaItems []struct {
		ID       string  `json:"id"`
		Type     string  `json:"type"`
		URL      string  `json:"url"`
		Track    int     `json:"track"`
		StartTime float64 `json:"startTime"`
		EndTime   float64 `json:"endTime"`
		Duration  float64 `json:"duration"`
		X         float64 `json:"x"`
		Y         float64 `json:"y"`
		Width     float64 `json:"width"`
		Height    float64 `json:"height"`
		Text      string  `json:"text"`
		Color     string  `json:"color"`
		FontSize  float64 `json:"fontSize"`
		IsMuted   bool    `json:"isMuted"`
	} `json:"mediaItems"`
	Duration    float64 `json:"duration"`
	AspectRatio string  `json:"aspectRatio"`
}, settings struct {
	Quality    string `json:"quality"`
	Format     string `json:"format"`
	Resolution string `json:"resolution"`
}, outputPath string) (string, error) {

	// Start building FFmpeg command
	var cmdArgs []string
	var inputFiles []string
	var filterComplex []string
	var audioInputs []string

	// Parse resolution
	resParts := strings.Split(settings.Resolution, "x")
	if len(resParts) != 2 {
		return "", errors.New("invalid resolution format")
	}
	width, _ := strconv.Atoi(resParts[0])
	height, _ := strconv.Atoi(resParts[1])

	// Create blank canvas
	baseFilter := fmt.Sprintf("color=black:%dx%d:d=%f[base]", width, height, projectData.Duration)
	filterComplex = append(filterComplex, baseFilter)
	log.Printf("Base filter: %s", baseFilter)

	inputIndex := 0
	videoOverlays := []string{"base"}
	
	// Track if we have any valid inputs
	hasValidInputs := false

	// Sort media items by track and start time for proper layering
	for _, item := range projectData.MediaItems {
		if item.Type == "video" || item.Type == "image" {
			// Convert URL to local file path
			var inputPath string
			if strings.HasPrefix(item.URL, "http://localhost:8080/") {
				// Remove the server URL prefix to get the local path
				inputPath = strings.TrimPrefix(item.URL, "http://localhost:8080/")
			} else {
				// Handle relative URLs
				inputPath = strings.TrimPrefix(item.URL, "/")
			}
			
			if _, err := os.Stat(inputPath); os.IsNotExist(err) {
				log.Printf("Warning: Input file does not exist: %s (original URL: %s)", inputPath, item.URL)
				continue
			}

			// Add input file
			cmdArgs = append(cmdArgs, "-i", inputPath)
			inputFiles = append(inputFiles, inputPath)
			hasValidInputs = true

			// Calculate position and size
			x := int(item.X)
			y := int(item.Y)
			w := int(item.Width)
			h := int(item.Height)

			if item.Type == "video" {
				// Scale and position video
				filterPart := fmt.Sprintf("[%d:v]scale=%d:%d[scaled%d]", inputIndex, w, h, inputIndex)
				filterComplex = append(filterComplex, filterPart)
				log.Printf("Added video scale filter: %s", filterPart)
				
				// Overlay video on canvas
				overlayLabel := fmt.Sprintf("overlay%d", inputIndex)
				overlayPart := fmt.Sprintf("[%s][scaled%d]overlay=%d:%d:enable='between(t,%f,%f)'[%s]", 
					videoOverlays[len(videoOverlays)-1], inputIndex, x, y, item.StartTime, item.EndTime, overlayLabel)
				filterComplex = append(filterComplex, overlayPart)
				log.Printf("Added video overlay filter: %s", overlayPart)
				videoOverlays = append(videoOverlays, overlayLabel)

				// Handle audio if not muted
				if !item.IsMuted {
					audioFilter := fmt.Sprintf("[%d:a]adelay=%dms:all=1[audio%d]", 
						inputIndex, int(item.StartTime*1000), inputIndex)
					filterComplex = append(filterComplex, audioFilter)
					audioInputs = append(audioInputs, fmt.Sprintf("[audio%d]", inputIndex))
				}
			} else if item.Type == "image" {
				// Scale and position image
				filterPart := fmt.Sprintf("[%d:v]scale=%d:%d[scaled%d]", inputIndex, w, h, inputIndex)
				filterComplex = append(filterComplex, filterPart)
				
				// Overlay image on canvas
				overlayLabel := fmt.Sprintf("overlay%d", inputIndex)
				overlayPart := fmt.Sprintf("[%s][scaled%d]overlay=%d:%d:enable='between(t,%f,%f)'[%s]", 
					videoOverlays[len(videoOverlays)-1], inputIndex, x, y, item.StartTime, item.EndTime, overlayLabel)
				filterComplex = append(filterComplex, overlayPart)
				videoOverlays = append(videoOverlays, overlayLabel)
			}

			inputIndex++
		} else if item.Type == "text" {
			// Add text overlay with validation
			if item.Text != "" {
				escapedText := strings.ReplaceAll(item.Text, "'", "\\'")
				
				// Set default values for missing properties
				color := item.Color
				if color == "" {
					color = "white"
				}
				
				fontSize := item.FontSize
				if fontSize == 0 {
					fontSize = 24
				}
				
				x := int(item.X)
				y := int(item.Y)
				
				textFilter := fmt.Sprintf("drawtext=text='%s':x=%d:y=%d:fontsize=%d:fontcolor=%s:enable='between(t,%f,%f)'",
					escapedText, x, y, int(fontSize), color, item.StartTime, item.EndTime)
				
				// Apply text to the current overlay
				if len(videoOverlays) > 0 {
					overlayLabel := fmt.Sprintf("text_overlay%d", inputIndex)
					textOverlay := fmt.Sprintf("[%s]%s[%s]", videoOverlays[len(videoOverlays)-1], textFilter, overlayLabel)
					filterComplex = append(filterComplex, textOverlay)
					videoOverlays[len(videoOverlays)-1] = overlayLabel
					hasValidInputs = true
				}
			}
		} else if item.Type == "audio" && !item.IsMuted {
			// Handle standalone audio files
			var inputPath string
			if strings.HasPrefix(item.URL, "http://localhost:8080/") {
				// Remove the server URL prefix to get the local path
				inputPath = strings.TrimPrefix(item.URL, "http://localhost:8080/")
			} else {
				// Handle relative URLs
				inputPath = strings.TrimPrefix(item.URL, "/")
			}
			
			if _, err := os.Stat(inputPath); os.IsNotExist(err) {
				log.Printf("Warning: Audio file does not exist: %s (original URL: %s)", inputPath, item.URL)
				continue
			}

			cmdArgs = append(cmdArgs, "-i", inputPath)
			audioFilter := fmt.Sprintf("[%d:a]adelay=%dms:all=1[audio%d]", 
				inputIndex, int(item.StartTime*1000), inputIndex)
			filterComplex = append(filterComplex, audioFilter)
			audioInputs = append(audioInputs, fmt.Sprintf("[audio%d]", inputIndex))
			inputIndex++
			hasValidInputs = true
		}
	}

	// Mix audio inputs if any
	if len(audioInputs) > 0 {
		if len(audioInputs) == 1 {
			filterComplex = append(filterComplex, fmt.Sprintf("%s[final_audio]", audioInputs[0]))
		} else {
			audioMix := fmt.Sprintf("%samix=inputs=%d[final_audio]", strings.Join(audioInputs, ""), len(audioInputs))
			filterComplex = append(filterComplex, audioMix)
		}
	}

	// Check if we have any content to export
	if !hasValidInputs {
		// Create a simple test video if no inputs are valid
		log.Printf("No valid inputs found, creating a simple test video")
		cmdArgs = []string{
			"-f", "lavfi",
			"-i", fmt.Sprintf("color=blue:%dx%d:d=%f", width, height, projectData.Duration),
			"-f", "lavfi", 
			"-i", fmt.Sprintf("sine=frequency=440:duration=%f", projectData.Duration),
		}
		// Add text overlay saying "No media found"
		filterComplexStr := fmt.Sprintf("[0:v]drawtext=text='No media files found':x=(w-text_w)/2:y=(h-text_h)/2:fontsize=48:fontcolor=white[v]")
		cmdArgs = append(cmdArgs, "-filter_complex", filterComplexStr)
		cmdArgs = append(cmdArgs, "-map", "[v]", "-map", "1:a")
	} else {
		// Final output mapping
		finalVideoLabel := videoOverlays[len(videoOverlays)-1]
		
		// Join filter complex
		filterComplexStr := strings.Join(filterComplex, ";")
		log.Printf("Generated filter complex: %s", filterComplexStr)
		cmdArgs = append(cmdArgs, "-filter_complex", filterComplexStr)
		
		// Map outputs
		cmdArgs = append(cmdArgs, "-map", fmt.Sprintf("[%s]", finalVideoLabel))
		if len(audioInputs) > 0 {
			cmdArgs = append(cmdArgs, "-map", "[final_audio]")
		}
	}

	// Set codec and quality based on settings
	switch settings.Quality {
	case "high":
		cmdArgs = append(cmdArgs, "-c:v", "libx264", "-crf", "18")
	case "medium":
		cmdArgs = append(cmdArgs, "-c:v", "libx264", "-crf", "23")
	case "low":
		cmdArgs = append(cmdArgs, "-c:v", "libx264", "-crf", "28")
	}

	if len(audioInputs) > 0 {
		cmdArgs = append(cmdArgs, "-c:a", "aac", "-b:a", "128k")
	}

	// Set duration and other parameters
	cmdArgs = append(cmdArgs, "-t", fmt.Sprintf("%f", projectData.Duration))
	cmdArgs = append(cmdArgs, "-r", "30") // Frame rate
	cmdArgs = append(cmdArgs, "-y") // Overwrite output file
	cmdArgs = append(cmdArgs, outputPath)

	log.Printf("FFmpeg export command: ffmpeg %v", cmdArgs)
	log.Printf("Project duration: %f, Media items count: %d", projectData.Duration, len(projectData.MediaItems))

	// Execute FFmpeg command
	cmd := exec.Command("ffmpeg", cmdArgs...)

	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		return "", fmt.Errorf("ffmpeg export failed: %v\nStdout: %s\nStderr: %s", err, out.String(), stderr.String())
	}

	log.Printf("FFmpeg export output: %s", out.String())
	
	// Return the URL for the exported file
	exportURL := fmt.Sprintf("/uploads/%s/exports/%s", strings.Split(outputPath, "/")[1], filepath.Base(outputPath))
	return exportURL, nil
}
