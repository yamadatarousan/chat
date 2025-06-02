package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/chat/backend/internal/models"
	"github.com/yourusername/chat/backend/internal/repositories"
)

type MessageHandler struct {
	messageRepo *repositories.MessageRepository
	userRepo    *repositories.UserRepository
}

func NewMessageHandler(messageRepo *repositories.MessageRepository, userRepo *repositories.UserRepository) *MessageHandler {
	return &MessageHandler{
		messageRepo: messageRepo,
		userRepo:    userRepo,
	}
}

func (h *MessageHandler) GetAll(c *gin.Context) {
	messages, err := h.messageRepo.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get messages"})
		return
	}

	c.JSON(http.StatusOK, messages)
}

func (h *MessageHandler) Create(c *gin.Context) {
	var message models.Message
	if err := c.ShouldBindJSON(&message); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid message format"})
		return
	}

	// ユーザーIDをコンテキストから取得
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// ユーザー情報を取得
	user, err := h.userRepo.FindByID(userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find user"})
		return
	}

	message.UserID = userID.(uint)
	message.User = *user

	if err := h.messageRepo.Create(&message); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create message"})
		return
	}

	c.JSON(http.StatusCreated, message)
}
