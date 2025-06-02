# Chat Application - 開発ルール

## プロジェクト概要
- **Backend**: Go (Gin framework, GORM, MySQL, JWT)
- **Frontend**: React + TypeScript (Redux Toolkit, Material-UI)
- **アーキテクチャ**: クリーンアーキテクチャ

## ディレクトリ構造ルール

### Backend (`/backend`)
```
backend/
├── cmd/app/main.go          ← エントリーポイント（ここにのみ main 関数）
├── internal/
│   ├── handlers/           ← HTTP ハンドラー
│   ├── services/           ← ビジネスロジック
│   ├── repositories/       ← データベース操作
│   ├── models/            ← データモデル
│   ├── middleware/        ← ミドルウェア
│   ├── config/            ← 設定関連
│   └── utils/             ← ユーティリティ
└── pkg/                   ← 外部パッケージ
    └── database/          ← DB接続設定
```

### Frontend (`/frontend/src`)
```
src/
├── components/            ← UIコンポーネント
├── store/                ← Redux関連（状態管理は Redux のみ）
├── services/             ← API通信
├── types/                ← TypeScript型定義
└── contexts/             ← 使用禁止（Redux使用のため）
```

## 🚨 AI Agent チェックリスト

### ファイル作成前（必須）
- [ ] `list_dir` でディレクトリ構造確認
- [ ] `codebase_search` で類似機能の存在確認
- [ ] 同じ責務のファイルが既に存在しないかチェック

### 具体的な重複防止ルール

#### ❌ 禁止パターン
1. **mainファイルの重複**
   - `backend/main.go` と `backend/cmd/app/main.go` の併存禁止
   - エントリーポイントは `cmd/app/main.go` のみ

2. **認証状態管理の重複**
   - React Context と Redux の併用禁止
   - 認証は Redux (`authSlice.ts`) のみ使用

3. **同機能コンポーネントの重複**
   - チャット機能を複数のコンポーネントで実装禁止
   - メッセージ表示は `ChatWindow.tsx` に統一

#### ✅ 必須チェック項目

**新しいハンドラー追加時:**
```bash
# 既存確認コマンド
codebase_search "handler" target_directories:["backend/internal/handlers"]
```

**新しいコンポーネント追加時:**
```bash
# 既存確認コマンド
codebase_search "component" target_directories:["frontend/src/components"]
```

**認証関連変更時:**
```bash
# 重複チェック
grep_search "auth" include_pattern:"*.tsx,*.ts"
```

## 技術スタック統一ルール

### Backend
- **HTTPフレームワーク**: Gin のみ
- **ORM**: GORM のみ
- **認証**: JWT のみ
- **データベース**: MySQL のみ

### Frontend
- **状態管理**: Redux Toolkit のみ（Context API 禁止）
- **UIライブラリ**: Material-UI のみ
- **HTTP通信**: Axios のみ
- **WebSocket**: Socket.io-client のみ

## 実装パターン

### 新機能追加の手順
1. **設計確認**: 既存パターンとの整合性チェック
2. **重複確認**: 同様の機能が存在しないか確認
3. **実装**: 確立されたアーキテクチャに従って実装
4. **検証**: 他の機能との矛盾がないか確認

### コード品質ルール
- 未使用のimportを残さない
- エラーハンドリングを必ず実装
- 型安全性を保つ（TypeScript strict mode）
- 適切なHTTPステータスコードを使用

## 緊急時の対応

### 重複を発見した場合
1. 即座に重複ファイルの特定
2. どちらを残すか方針決定
3. 不要なファイルの削除
4. 依存関係の修正

### 設計変更が必要な場合
1. 既存コードへの影響範囲調査
2. 段階的な移行計画作成
3. 古いパターンの完全削除

---

**このルールに従って、一貫性のある高品質なコードベースを維持します。** 