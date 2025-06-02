package main

import (
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/yourusername/chat/backend/internal/handlers"
	"github.com/yourusername/chat/backend/internal/middleware"
	"github.com/yourusername/chat/backend/internal/repositories"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func main() {
	log.Println("Starting server...")

	// データベース接続
	dsn := "root:@tcp(localhost:3306)/chatapp?charset=utf8mb4&parseTime=True&loc=Local"
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	log.Println("Database connected successfully")

	// リポジトリの初期化
	userRepo := repositories.NewUserRepository(db)
	messageRepo := repositories.NewMessageRepository(db)
	log.Println("Repositories initialized")

	// ハンドラーの初期化
	authHandler := handlers.NewAuthHandler(userRepo)
	messageHandler := handlers.NewMessageHandler(messageRepo, userRepo)
	wsHandler := handlers.NewWebSocketHandler(messageRepo, userRepo)
	log.Println("Handlers initialized")

	// Ginルーターの設定
	r := gin.Default()
	log.Println("Gin router initialized")

	// CORSの設定
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:3000"}
	config.AllowCredentials = true
	config.AddAllowHeaders("Authorization")
	r.Use(cors.New(config))
	log.Println("CORS configured")

	// WebSocketルート
	r.GET("/ws", wsHandler.HandleWebSocket)
	log.Println("WebSocket routes registered")

	// APIルートグループ
	api := r.Group("/api")
	{
		// 認証関連のルート
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
		}
		log.Println("Auth routes registered")

		// 認証が必要なルート
		authorized := api.Group("")
		authorized.Use(middleware.AuthMiddleware())
		{
			authorized.GET("/messages", messageHandler.GetAll)
			authorized.POST("/messages", messageHandler.Create)
		}
		log.Println("Authorized routes registered")
	}

	// サーバーの起動
	log.Println("Starting server on :8080...")
	if err := r.Run(":8080"); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
