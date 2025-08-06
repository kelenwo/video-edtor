package websocket

import (
	"log"
	"sync"
)

// Hub maintains the set of active clients and broadcasts messages to the clients.
type Hub struct {
	// Registered clients.
	clients map[*Client]bool

	// Inbound messages from the clients.
	broadcast chan []byte

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client

	// Map to store clients by user ID for targeted broadcasts
	userClients map[string]map[*Client]bool
	mu          sync.RWMutex // Mutex for userClients map
}

// NewHub creates a new Hub
func NewHub() *Hub {
	return &Hub{
		broadcast:   make(chan []byte),
		register:    make(chan *Client),
		unregister:  make(chan *Client),
		clients:     make(map[*Client]bool),
		userClients: make(map[string]map[*Client]bool),
	}
}

// Run starts the hub's event loop
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true
			h.mu.Lock()
			if h.userClients[client.userID] == nil {
				h.userClients[client.userID] = make(map[*Client]bool)
			}
			h.userClients[client.userID][client] = true
			h.mu.Unlock()
			log.Printf("Client registered: %s (User: %s)", client.conn.RemoteAddr(), client.userID)

		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				h.mu.Lock()
				delete(h.userClients[client.userID], client)
				if len(h.userClients[client.userID]) == 0 {
					delete(h.userClients, client.userID)
				}
				h.mu.Unlock()
				close(client.send)
				log.Printf("Client unregistered: %s (User: %s)", client.conn.RemoteAddr(), client.userID)
			}

		case message := <-h.broadcast:
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
		}
	}
}

// BroadcastToUser sends a message to all active WebSocket connections for a specific user.
func (h *Hub) BroadcastToUser(userID string, message string) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if clients, ok := h.userClients[userID]; ok {
		log.Printf("Broadcasting to user %s: %s", userID, message)
		for client := range clients {
			select {
			case client.send <- []byte(message):
			default:
				// If sending fails, unregister the client
				close(client.send)
				delete(h.clients, client)             // Remove from general clients map
				delete(h.userClients[userID], client) // Remove from user-specific map
				if len(h.userClients[userID]) == 0 {
					delete(h.userClients, userID)
				}
				log.Printf("Client %s (User: %s) disconnected due to send failure.", client.conn.RemoteAddr(), client.userID)
			}
		}
	} else {
		log.Printf("No active WebSocket connections for user %s.", userID)
	}
}
