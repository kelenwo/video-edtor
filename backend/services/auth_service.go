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
	"golang.org/x/crypto/bcrypt"
)

// AuthService handles user authentication
type AuthService struct {
	usersCollection *mongo.Collection
}

// NewAuthService creates a new AuthService
func NewAuthService(client *mongo.Client, dbName string) *AuthService {
	return &AuthService{
		usersCollection: client.Database(dbName).Collection("users"),
	}
}

// RegisterUser creates a new user
func (s *AuthService) RegisterUser(user *models.User) error {
	// Check if user already exists
	existingUser := models.User{}
	err := s.usersCollection.FindOne(db.Ctx, bson.M{"email": user.Email}).Decode(&existingUser)
	if err == nil {
		return errors.New("user with this email already exists")
	}
	if err != mongo.ErrNoDocuments {
		return err // Other database error
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	user.Password = string(hashedPassword)
	user.ID = primitive.NewObjectID()
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()

	_, err = s.usersCollection.InsertOne(db.Ctx, user)
	return err
}

// LoginUser authenticates a user
func (s *AuthService) LoginUser(email, password string) (*models.User, error) {
	user := &models.User{}
	err := s.usersCollection.FindOne(db.Ctx, bson.M{"email": email}).Decode(user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return nil, errors.New("invalid password")
	}
	return user, nil
}
