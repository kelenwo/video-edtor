package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Config holds our application configuration
type Config struct {
	MongoDBURI string
	DBName     string
	JWTSecret  string
	Port       string
}

// LoadConfig reads configuration from environment variables or .env file
func LoadConfig() *Config {
	// Load .env file if it exists (for local development)
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, assuming environment variables are set.")
	}

	cfg := &Config{
		MongoDBURI: getEnv("MONGO_URI", "mongodb://localhost:27017"),
		DBName:     getEnv("MONGO_DB_NAME", "video_editor"),
		JWTSecret:  getEnv("JWT_SECRET", "supersecretjwtkey"), // IMPORTANT: Change this in production!
		Port:       getEnv("PORT", "8080"),
	}

	// Basic validation
	if cfg.JWTSecret == "supersecretjwtkey" {
		log.Println("WARNING: Using default JWT_SECRET. Please change this in production!")
	}

	return cfg
}

func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}
