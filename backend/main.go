package main

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"video-editor/config"
	"video-editor/db"
	"video-editor/models"
	"video-editor/services"
	"video-editor/websocket"

	"github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
)

var jwtSecret []byte

func main() {
	// Load configuration
	cfg := config.LoadConfig()
	jwtSecret = []byte(cfg.JWTSecret)

	// Connect to MongoDB
	mongoClient, err := db.ConnectDB(cfg.MongoDBURI)
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}
	defer func() {
		if err = mongoClient.Disconnect(db.Ctx); err != nil {
			log.Printf("Error disconnecting from MongoDB: %v", err)
		}
	}()
	log.Println("Connected to MongoDB!")

	// Initialize services
	authService := services.NewAuthService(mongoClient, cfg.DBName)
	projectService := services.NewProjectService(mongoClient, cfg.DBName)
	videoProcessor := services.NewVideoProcessor(mongoClient, cfg.DBName)

	// Start WebSocket hub in a goroutine
	hub := websocket.NewHub()
	go hub.Run()
	log.Println("WebSocket hub started.")

	// Start a worker to process video jobs (simple in-memory queue for POC)
	go videoProcessor.StartWorker(hub)
	log.Println("Video processing worker started.")

	// Set up Gin router
	router := gin.Default()

	// --- Public Routes (Auth) ---
	router.POST("/register", func(c *gin.Context) {
		var user models.User
		if err := c.ShouldBindJSON(&user); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if err := authService.RegisterUser(&user); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusCreated, gin.H{"message": "User registered successfully"})
	})

	router.POST("/login", func(c *gin.Context) {
		var credentials struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}
		if err := c.ShouldBindJSON(&credentials); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		user, err := authService.LoginUser(credentials.Email, credentials.Password)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
			return
		}

		// Generate JWT token
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"user_id": user.ID.Hex(),
			"email":   user.Email,
			"exp":     time.Now().Add(time.Hour * 24).Unix(), // Token expires in 24 hours
		})
		tokenString, err := token.SignedString(jwtSecret)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"token": tokenString})
	})

	// --- Authenticated Routes ---
	authorized := router.Group("/")
	authorized.Use(authMiddleware())
	{
		// Projects
		authorized.POST("/projects", func(c *gin.Context) {
			userID := c.GetString("user_id") // Get user ID from JWT
			var project models.Project
			if err := c.ShouldBindJSON(&project); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			project.UserID = userID // Assign project to authenticated user
			if err := projectService.CreateProject(&project); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusCreated, project)
		})

		authorized.GET("/projects/:id", func(c *gin.Context) {
			userID := c.GetString("user_id")
			projectID := c.Param("id")
			project, err := projectService.GetProject(projectID, userID)
			if err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "Project not found or unauthorized"})
				return
			}
			c.JSON(http.StatusOK, project)
		})

		// Video Processing Request
		authorized.POST("/process-video", func(c *gin.Context) {
			userID := c.GetString("user_id")
			var req struct {
				ProjectID string                 `json:"project_id"`
				Action    string                 `json:"action"` // e.g., "trim", "add_text"
				Params    map[string]interface{} `json:"params"` // Action-specific parameters
			}
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			// For POC, let's just create a simple job and add to the queue
			job := models.VideoProcessingJob{
				UserID:    userID,
				ProjectID: req.ProjectID,
				Action:    req.Action,
				Params:    req.Params,
				Status:    "pending",
				CreatedAt: time.Now(),
			}

			services.AddJobToQueue(job) // Add job to the in-memory queue
			c.JSON(http.StatusAccepted, gin.H{"message": "Video processing job submitted", "job_id": job.ID.Hex()})
		})

		// WebSocket endpoint
		authorized.GET("/ws", func(c *gin.Context) {
			userID := c.GetString("user_id") // Get user ID from JWT
			websocket.ServeWs(hub, c.Writer, c.Request, userID)
		})
	}

	log.Printf("Server starting on port %s", cfg.Port)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}

// authMiddleware validates JWT token
func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := c.GetHeader("Authorization")
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		// Remove "Bearer " prefix
		if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
			tokenString = tokenString[7:]
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token format"})
			c.Abort()
			return
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return jwtSecret, nil
		})

		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			userID, ok := claims["user_id"].(string)
			if !ok {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
				c.Abort()
				return
			}
			c.Set("user_id", userID) // Store user ID in context
			c.Next()
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			c.Abort()
		}
	}
}
