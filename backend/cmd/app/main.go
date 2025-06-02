package main

import (
	"fmt"
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/yourusername/chat/backend/internal/handlers"
	"github.com/yourusername/chat/backend/internal/middleware"
	"github.com/yourusername/chat/backend/internal/repositories"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func main() {
	// 環境変数の読み込み
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found")
	}

	// データベース接続
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_NAME"),
	)
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// リポジトリの初期化
	userRepo := repositories.NewUserRepository(db)
	messageRepo := repositories.NewMessageRepository(db)

	// ハンドラーの初期化
	authHandler := handlers.NewAuthHandler(userRepo)
	messageHandler := handlers.NewMessageHandler(messageRepo, userRepo)
	wsHandler := handlers.NewWebSocketHandler(messageRepo, userRepo)

	// Ginの設定
	r := gin.Default()

	// CORSの設定
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:3000"}
	config.AllowCredentials = true
	config.AllowHeaders = []string{"Origin", "Content-Type", "Authorization"}
	r.Use(cors.New(config))

	// ヘルスチェック
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})

	// ルートの設定
	api := r.Group("/api")
	{
		// 認証関連のエンドポイント
		api.POST("/register", authHandler.Register)
		api.POST("/login", authHandler.Login)

		// メッセージ関連のエンドポイント
		api.GET("/messages", middleware.AuthMiddleware(), messageHandler.GetMessages)
		api.POST("/messages", middleware.AuthMiddleware(), messageHandler.CreateMessage)

		// WebSocketエンドポイント
		api.GET("/ws", middleware.AuthMiddleware(), wsHandler.HandleWebSocket)
	}

	// サーバーの起動
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
