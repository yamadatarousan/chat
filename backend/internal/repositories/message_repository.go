package repositories

import (
	"github.com/yourusername/chat/backend/internal/models"
	"gorm.io/gorm"
)

type MessageRepository struct {
	db *gorm.DB
}

func NewMessageRepository(db *gorm.DB) *MessageRepository {
	return &MessageRepository{db: db}
}

func (r *MessageRepository) Create(message *models.Message) error {
	return r.db.Create(message).Error
}

func (r *MessageRepository) GetAll() ([]models.Message, error) {
	var messages []models.Message
	err := r.db.Preload("User").Order("created_at desc").Find(&messages).Error
	return messages, err
}
