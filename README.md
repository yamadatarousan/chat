# チャットアプリケーション技術スタック

## フロントエンド (React)

- **React** - UIライブラリ
- **TypeScript** - 型安全なコード開発
- **Tailwind CSS** - スタイリング
- **Zustand** - 軽量な状態管理ライブラリ
- **Socket.io-client** - リアルタイム通信

## バックエンド (Go)

- **Gin** - 高性能なWebフレームワーク
- **GORM** - ORMライブラリ
- **JWT** - 認証
- **Gorilla WebSocket** - WebSocket実装
- **Air** - ホットリロード開発

## データベース

- **MySQL** - 主要データベース
- **Redis** - キャッシュとリアルタイムメッセージングのサポート

## 開発環境

- **Mac** - ローカル開発環境
- **GitHub Actions** - CI/CD
- **AWS/GCP/Azure** - クラウドデプロイメント

## 通信方式

- **RESTful API** - 基本的なデータ操作
- **WebSockets** - リアルタイムメッセージング

## プロジェクト構造

```
/
├── frontend/                # Reactフロントエンド
│   ├── public/
│   ├── src/
│   │   ├── components/      # UIコンポーネント
│   │   ├── hooks/           # カスタムフック
│   │   ├── pages/           # ページコンポーネント
│   │   ├── services/        # APIとの通信
│   │   ├── store/           # 状態管理
│   │   └── utils/           # ユーティリティ関数
│   └── package.json
│
├── backend/                 # Goバックエンド
│   ├── cmd/                 # エントリーポイント
│   ├── internal/            # 内部パッケージ
│   │   ├── api/             # API定義
│   │   ├── auth/            # 認証ロジック
│   │   ├── database/        # データベース接続
│   │   ├── models/          # データモデル
│   │   └── websocket/       # WebSocket処理
│   ├── go.mod
│   └── go.sum
│
└── README.md                # プロジェクト説明
```

## 開発開始手順

1. フロントエンド初期設定
   ```bash
   # Reactアプリケーションの作成
   npx create-react-app frontend --template typescript
   cd frontend
   
   # 必要なパッケージのインストール
   npm install tailwindcss postcss autoprefixer zustand socket.io-client
   
   # Tailwind CSSの設定
   # tailwind.config.jsとpostcss.config.jsは自動生成されるため、
   # 手動で設定ファイルを作成する必要はありません
   
   # src/index.cssに以下を追加
   # @import 'tailwindcss/base';
   # @import 'tailwindcss/components';
   # @import 'tailwindcss/utilities';
   ```

2. バックエンド初期設定
   ```bash
   mkdir -p backend/cmd/app
   cd backend
   go mod init chatapp
   go mod tidy  # 依存関係の整理
   go get -u github.com/gin-gonic/gin
   go get -u gorm.io/gorm
   go get -u gorm.io/driver/mysql
   go get -u github.com/golang-jwt/jwt/v5
   go get -u github.com/gorilla/websocket
   go mod tidy  # 新しく追加した依存関係の整理
   ```

3. MySQL設定
   ```bash
   # Mac上でHomebrewを使用してMySQLをインストール
   brew install mysql
   brew services start mysql
   
   # データベース作成
   mysql -u root -p
   CREATE DATABASE chatapp;
   ```

## 開発のポイント

- WebSocketを使用してリアルタイムのメッセージング機能を実装
- JWTを使用して安全な認証システムを構築
- データフェッチングにはシンプルなFetch APIまたはAxiosを使用
- フロントエンドでのオフライン対応と再接続ロジックの実装
- エンドツーエンドの暗号化の検討
