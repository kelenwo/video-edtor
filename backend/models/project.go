package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Project represents a video editing project
type Project struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	UserID    string             `bson:"user_id" json:"user_id"` // Owner of the project
	Name      string             `bson:"name" json:"name"`
	VideoURL  string             `bson:"video_url" json:"video_url"`                       // URL to the original video in cloud storage
	Edits     []EditOperation    `bson:"edits" json:"edits"`                               // Array of editing operations
	Status    string             `bson:"status" json:"status"`                             // e.g., "draft", "processing", "completed"
	OutputURL string             `bson:"output_url,omitempty" json:"output_url,omitempty"` // URL to the processed video
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time          `bson:"updated_at" json:"updated_at"`
}

// EditOperation defines a single editing step
type EditOperation struct {
	Type   string                 `bson:"type" json:"type"`     // e.g., "trim", "add_text", "add_audio"
	Params map[string]interface{} `bson:"params" json:"params"` // Parameters for the operation
}

// VideoProcessingJob represents a job sent to the video processor
type VideoProcessingJob struct {
	ID        primitive.ObjectID     `bson:"_id,omitempty" json:"id,omitempty"`
	UserID    string                 `bson:"user_id" json:"user_id"`
	ProjectID string                 `bson:"project_id" json:"project_id"`
	Action    string                 `bson:"action" json:"action"` // e.g., "trim", "finalize_project"
	Params    map[string]interface{} `bson:"params" json:"params"`
	Status    string                 `bson:"status" json:"status"` // "pending", "processing", "completed", "failed"
	Message   string                 `bson:"message,omitempty" json:"message,omitempty"`
	CreatedAt time.Time              `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time              `bson:"updated_at" json:"updated_at"`
}
