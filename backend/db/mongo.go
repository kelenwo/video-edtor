package db

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Ctx is the global context for MongoDB operations
var Ctx = context.Background()

// ConnectDB establishes a connection to MongoDB
func ConnectDB(uri string) (*mongo.Client, error) {
	clientOptions := options.Client().ApplyURI(uri)
	client, err := mongo.Connect(Ctx, clientOptions)
	if err != nil {
		return nil, err
	}

	// Ping the primary to verify connection
	ctx, cancel := context.WithTimeout(Ctx, 10*time.Second)
	defer cancel()
	err = client.Ping(ctx, nil)
	if err != nil {
		return nil, err
	}
	return client, nil
}
