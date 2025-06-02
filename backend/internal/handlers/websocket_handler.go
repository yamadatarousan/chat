package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/yourusername/chat/backend/internal/models"
	"github.com/yourusername/chat/backend/internal/repositories"
	"github.com/yourusername/chat/backend/internal/utils"
)

type WebSocketHandler struct {
	messageRepo *repositories.MessageRepository
	userRepo    *repositories.UserRepository
	upgrader    websocket.Upgrader
	clients     map[*websocket.Conn]*models.User
	clientsMux  sync.RWMutex
	broadcast   chan []byte
}

type WebSocketMessage struct {
	Type    string      `json:"type"`
	Data    interface{} `json:"data,omitempty"`
	Content string      `json:"content,omitempty"`
	Token   string      `json:"token,omitempty"`
}

func NewWebSocketHandler(messageRepo *repositories.MessageRepository, userRepo *repositories.UserRepository) *WebSocketHandler {
	handler := &WebSocketHandler{
		messageRepo: messageRepo,
		userRepo:    userRepo,
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true // 本番環境では適切なオリジンチェックを実装
			},
		},
		clients:   make(map[*websocket.Conn]*models.User),
		broadcast: make(chan []byte),
	}

	// ブロードキャスト処理のgoroutineを開始
	go handler.handleBroadcast()
	log.Println("WebSocket: Handler initialized with gorilla/websocket")

	return handler
}

func (h *WebSocketHandler) handleBroadcast() {
	for {
		message := <-h.broadcast
		h.clientsMux.RLock()
		for client := range h.clients {
			err := client.WriteMessage(websocket.TextMessage, message)
			if err != nil {
				log.Printf("WebSocket: Error broadcasting to client: %v", err)
				client.Close()
				delete(h.clients, client)
			}
		}
		h.clientsMux.RUnlock()
	}
}

func (h *WebSocketHandler) HandleWebSocket(c *gin.Context) {
	log.Printf("WebSocket: Upgrade request from %s", c.ClientIP())

	conn, err := h.upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket: Upgrade failed: %v", err)
		return
	}
	defer conn.Close()

	log.Printf("WebSocket: Client connected")

	var user *models.User
	authenticated := false

	for {
		_, messageBytes, err := conn.ReadMessage()
		if err != nil {
			log.Printf("WebSocket: Read error: %v", err)
			break
		}

		var msg WebSocketMessage
		if err := json.Unmarshal(messageBytes, &msg); err != nil {
			log.Printf("WebSocket: JSON unmarshal error: %v", err)
			continue
		}

		log.Printf("WebSocket: Received message type: %s", msg.Type)

		switch msg.Type {
		case "auth":
			token := msg.Token
			if len(token) > 7 && token[:7] == "Bearer " {
				token = token[7:]
			}

			claims, err := utils.ValidateToken(token)
			if err != nil {
				log.Printf("WebSocket: Invalid token: %v", err)
				h.sendError(conn, "Invalid token")
				continue
			}

			foundUser, err := h.userRepo.FindByID(claims.UserID)
			if err != nil {
				log.Printf("WebSocket: User not found: %v", err)
				h.sendError(conn, "User not found")
				continue
			}

			user = foundUser
			authenticated = true
			h.clientsMux.Lock()
			h.clients[conn] = user
			h.clientsMux.Unlock()

			log.Printf("WebSocket: User %s authenticated successfully", user.Username)
			h.sendMessage(conn, "authenticated", map[string]interface{}{
				"message": "Authentication successful",
				"user": map[string]interface{}{
					"id":       user.ID,
					"username": user.Username,
				},
			})

		case "message":
			if !authenticated {
				h.sendError(conn, "Not authenticated")
				continue
			}

			// メッセージの作成
			message := &models.Message{
				Content: msg.Content,
				UserID:  user.ID,
				User:    *user,
			}

			// メッセージの保存
			if err := h.messageRepo.Create(message); err != nil {
				log.Printf("WebSocket: Failed to save message: %v", err)
				h.sendError(conn, "Failed to save message")
				continue
			}

			log.Printf("WebSocket: Message saved from %s: %s", user.Username, msg.Content)

			// メッセージをブロードキャスト
			broadcastMsg, _ := json.Marshal(WebSocketMessage{
				Type: "new_message",
				Data: message,
			})
			h.broadcast <- broadcastMsg
		}
	}

	// クライアント切断時の処理
	h.clientsMux.Lock()
	delete(h.clients, conn)
	h.clientsMux.Unlock()
	log.Printf("WebSocket: Client disconnected")
}

func (h *WebSocketHandler) sendMessage(conn *websocket.Conn, msgType string, data interface{}) {
	msg := WebSocketMessage{
		Type: msgType,
		Data: data,
	}
	messageBytes, _ := json.Marshal(msg)
	conn.WriteMessage(websocket.TextMessage, messageBytes)
}

func (h *WebSocketHandler) sendError(conn *websocket.Conn, errorMsg string) {
	h.sendMessage(conn, "error", errorMsg)
}
