package services

import (
	_ "context"
	"errors"
	"time"

	"video-editor/db"
	"video-editor/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// ProjectService handles video project CRUD operations
type ProjectService struct {
	projectsCollection *mongo.Collection
}

// NewProjectService creates a new ProjectService
func NewProjectService(client *mongo.Client, dbName string) *ProjectService {
	return &ProjectService{
		projectsCollection: client.Database(dbName).Collection("projects"),
	}
}

// CreateProject creates a new video project
func (s *ProjectService) CreateProject(project *models.Project) error {
	project.ID = primitive.NewObjectID()
	project.CreatedAt = time.Now()
	project.UpdatedAt = time.Now()
	project.Status = "draft" // Initial status

	_, err := s.projectsCollection.InsertOne(db.Ctx, project)
	return err
}

// GetProject retrieves a project by ID and UserID (for ownership check)
func (s *ProjectService) GetProject(projectID string, userID string) (*models.Project, error) {
	objID, err := primitive.ObjectIDFromHex(projectID)
	if err != nil {
		return nil, errors.New("invalid project ID format")
	}

	project := &models.Project{}
	filter := bson.M{"_id": objID, "user_id": userID}
	err = s.projectsCollection.FindOne(db.Ctx, filter).Decode(project)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("project not found or unauthorized")
		}
		return nil, err
	}
	return project, nil
}

// UpdateProjectStatus updates the status of a project
func (s *ProjectService) UpdateProjectStatus(projectID string, status string, outputURL string) error {
	objID, err := primitive.ObjectIDFromHex(projectID)
	if err != nil {
		return errors.New("invalid project ID format")
	}

	update := bson.M{
		"$set": bson.M{
			"status":     status,
			"output_url": outputURL,
			"updated_at": time.Now(),
		},
	}
	_, err = s.projectsCollection.UpdateByID(db.Ctx, objID, update)
	return err
}

// AddEditToProject adds an editing operation to a project
func (s *ProjectService) AddEditToProject(projectID string, edit models.EditOperation) error {
	objID, err := primitive.ObjectIDFromHex(projectID)
	if err != nil {
		return errors.New("invalid project ID format")
	}

	update := bson.M{
		"$push": bson.M{"edits": edit},
		"$set":  bson.M{"updated_at": time.Now()},
	}
	_, err = s.projectsCollection.UpdateByID(db.Ctx, objID, update)
	return err
}
