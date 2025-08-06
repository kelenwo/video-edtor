package services

import (
	"bytes"
	"context"
	"fmt"
	"log"
	"os/exec"
	"time"

	"go-video-editor-poc/db"
	"go-video-editor-poc/models"
	"go-video-editor-poc/websocket" // Import the websocket package

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
