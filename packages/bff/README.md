# Jira Priority Matrix - BFF Server

Jira Priority MatrixのBFF（Backend For Frontend）サーバーです。

## 技術スタック

- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.7+ (strict mode)
- **Framework**: Express 5
- **Authentication**: Atlassian OAuth 2.0 (3LO)
- **Session**: express-session (server-side)
- **Security**: helmet, cors

## ディレクトリ構成

```
packages/bff/src/
├── index.ts              # サーバー起動エントリポイント
├── app.ts                # Express appのセットアップ
├── config.ts             # 環境変数ロード・バリデーション
├── routes/               # APIルート定義
│   ├── auth.ts           # OAuth認証ルート
│   ├── tickets.ts        # チケットCRUDルート
│   ├── projects.ts       # プロジェクト一覧ルート
│   ├── sprints.ts        # スプリント一覧ルート
│   └── myself.ts         # ログインユーザー情報ルート
├── services/             # ビジネスロジック
│   ├── jiraClient.ts     # Jira REST API クライアント
│   ├── authService.ts    # OAuth トークン管理
│   └── ticketService.ts  # チケット取得・更新ロジック
├── middleware/           # Expressミドルウェア
│   ├── authGuard.ts      # 認証チェックミドルウェア
│   └── errorHandler.ts   # グローバルエラーハンドラー
├── types/                # BFF固有の型定義
│   └── index.ts          # express-sessionの拡張、Jira API型
└── utils/                # ユーティリティ
    └── jqlBuilder.ts     # JQLクエリビルダー
```

## セットアップ

### 1. 環境変数の設定

`.env.example` をコピーして `.env` を作成し、以下の環境変数を設定してください。

```bash
cp .env.example .env
```

#### 必須環境変数

```env
# Jira Cloud Settings
JIRA_CLOUD_URL=https://your-domain.atlassian.net
JIRA_CLIENT_ID=your_oauth_client_id
JIRA_CLIENT_SECRET=your_oauth_client_secret
JIRA_REDIRECT_URI=http://localhost:3001/auth/callback
JIRA_IMPORTANCE_FIELD_ID=customfield_10001
JIRA_URGENCY_FIELD_ID=customfield_10002

# BFF Server Settings
BFF_PORT=3001
SESSION_SECRET=your_random_session_secret_here_minimum_32_characters
FRONTEND_URL=http://localhost:5173

# Environment
NODE_ENV=development
```

#### Atlassian OAuth 2.0 App の作成

1. [Atlassian Developer Console](https://developer.atlassian.com/console/myapps/) にアクセス
2. "Create" → "OAuth 2.0 integration" を選択
3. App名を入力（例: "Jira Priority Matrix"）
4. "Permissions" → "Add" → "Jira API" を選択
5. 以下のスコープを追加:
   - `read:jira-work` (チケット読み取り)
   - `write:jira-work` (チケット更新)
   - `read:jira-user` (ユーザー情報読み取り)
   - `offline_access` (リフレッシュトークン)
6. "Authorization" → "Add" で以下を設定:
   - **Callback URL**: `http://localhost:3001/auth/callback`
7. "Settings" から **Client ID** と **Secret** をコピーして `.env` に貼り付け

#### カスタムフィールドIDの確認

Jiraでカスタムフィールド「Importance」「Urgency」を作成し、フィールドIDを確認してください。

1. Jira管理画面 → 「課題」→「カスタムフィールド」
2. 「Importance」フィールドを選択し、URLから `customfield_XXXXX` をコピー
3. 「Urgency」フィールドも同様にコピー
4. `.env` の `JIRA_IMPORTANCE_FIELD_ID` と `JIRA_URGENCY_FIELD_ID` に設定

### 2. 依存関係のインストール

プロジェクトルートで pnpm install を実行してください（workspace全体をインストール）。

```bash
cd /path/to/jira-priority-matrix
pnpm install
```

### 3. 開発サーバーの起動

```bash
pnpm --filter @jira-priority-matrix/bff run dev
```

サーバーは `http://localhost:3001` で起動します。

## API エンドポイント

### 認証

#### `GET /auth/login`
Atlassian認可画面へリダイレクトします（OAuth 2.0フロー開始）。

```bash
# ブラウザで直接アクセス
open http://localhost:3001/auth/login
```

#### `GET /auth/callback`
OAuth 2.0コールバック（Atlassianからリダイレクトされます）。

#### `POST /auth/logout`
ログアウト（セッション破棄）。

```bash
curl -X POST http://localhost:3001/auth/logout \
  -H "Content-Type: application/json" \
  --cookie-jar cookies.txt \
  --cookie cookies.txt
```

#### `GET /auth/status`
認証状態を確認します。

```bash
curl http://localhost:3001/auth/status \
  --cookie-jar cookies.txt \
  --cookie cookies.txt
```

**レスポンス例:**
```json
{
  "authenticated": true,
  "expiresAt": 1739612345
}
```

---

### チケット

#### `GET /api/tickets`
チケット一覧を取得します（JQL検索）。

**クエリパラメータ:**
- `projectKeys` (string, カンマ区切り): プロジェクトキー（例: "PROJ1,PROJ2"）
- `assigneeAccountId` (string): 担当者のAccount ID
- `onlyMe` (boolean): 自分のチケットのみ（"true" or "false"）
- `sprintId` (number): スプリントID
- `hideDone` (boolean): 完了済みを非表示（デフォルト: true）
- `searchText` (string): 検索テキスト（summary or key）

```bash
# すべてのチケットを取得
curl http://localhost:3001/api/tickets \
  --cookie-jar cookies.txt \
  --cookie cookies.txt

# プロジェクト絞り込み
curl "http://localhost:3001/api/tickets?projectKeys=PROJ1,PROJ2" \
  --cookie-jar cookies.txt \
  --cookie cookies.txt

# 完了済みを除外
curl "http://localhost:3001/api/tickets?hideDone=true" \
  --cookie-jar cookies.txt \
  --cookie cookies.txt

# テキスト検索
curl "http://localhost:3001/api/tickets?searchText=bug" \
  --cookie-jar cookies.txt \
  --cookie cookies.txt
```

**レスポンス例:**
```json
{
  "data": [
    {
      "key": "PROJ-123",
      "summary": "Fix login bug",
      "status": {
        "name": "In Progress",
        "categoryKey": "indeterminate"
      },
      "assignee": {
        "displayName": "John Doe",
        "avatarUrl": "https://...",
        "accountId": "5b10ac8d82e05b22cc7d4ef5"
      },
      "project": {
        "key": "PROJ",
        "name": "My Project",
        "avatarUrl": "https://..."
      },
      "importance": "High",
      "urgency": "High",
      "quadrant": "Q1",
      "issueType": "Bug",
      "url": "https://your-domain.atlassian.net/browse/PROJ-123"
    }
  ],
  "meta": {
    "total": 1,
    "startAt": 0,
    "maxResults": 1
  }
}
```

#### `PUT /api/tickets/:key`
チケットの重要度・緊急度を更新します。

```bash
curl -X PUT http://localhost:3001/api/tickets/PROJ-123 \
  -H "Content-Type: application/json" \
  -d '{
    "importance": "High",
    "urgency": "Low"
  }' \
  --cookie-jar cookies.txt \
  --cookie cookies.txt
```

**レスポンス例:**
```json
{
  "data": null
}
```

---

### プロジェクト

#### `GET /api/projects`
プロジェクト一覧を取得します。

```bash
curl http://localhost:3001/api/projects \
  --cookie-jar cookies.txt \
  --cookie cookies.txt
```

**レスポンス例:**
```json
{
  "data": [
    {
      "key": "PROJ",
      "name": "My Project",
      "avatarUrl": "https://..."
    }
  ]
}
```

---

### スプリント

#### `GET /api/sprints/:boardId`
スプリント一覧を取得します（Jira Agile API）。

```bash
curl http://localhost:3001/api/sprints/1 \
  --cookie-jar cookies.txt \
  --cookie cookies.txt
```

**レスポンス例:**
```json
{
  "data": [
    {
      "id": 10,
      "name": "Sprint 1",
      "state": "active"
    }
  ]
}
```

---

### ユーザー情報

#### `GET /api/myself`
ログインユーザー情報を取得します。

```bash
curl http://localhost:3001/api/myself \
  --cookie-jar cookies.txt \
  --cookie cookies.txt
```

**レスポンス例:**
```json
{
  "data": {
    "accountId": "5b10ac8d82e05b22cc7d4ef5",
    "displayName": "John Doe",
    "emailAddress": "john@example.com",
    "avatarUrl": "https://..."
  }
}
```

---

### ヘルスチェック

#### `GET /health`
サーバーの稼働状態を確認します（認証不要）。

```bash
curl http://localhost:3001/health
```

**レスポンス例:**
```json
{
  "status": "ok"
}
```

## エラーハンドリング

すべてのエラーは以下の統一形式で返されます。

```json
{
  "error": {
    "code": "JIRA_API_ERROR",
    "message": "エラーメッセージ",
    "status": 500
  }
}
```

**主なエラーコード:**
- `UNAUTHORIZED` (401): 認証されていません
- `OAUTH_TOKEN_EXCHANGE_FAILED` (4xx): トークン取得失敗
- `JIRA_API_ERROR` (4xx/5xx): Jira APIエラー
- `RATE_LIMIT_EXCEEDED` (429): APIレート制限
- `INTERNAL_SERVER_ERROR` (500): 予期しないエラー

## 開発

### 型チェック

```bash
pnpm --filter @jira-priority-matrix/bff run typecheck
```

### ビルド

```bash
pnpm --filter @jira-priority-matrix/bff run build
```

## セキュリティ

- **セッション管理**: express-sessionでサーバーサイドセッション
- **CSRF対策**: OAuth stateパラメータで検証
- **トークン管理**: アクセストークンはセッションに保存（フロントに露出させない）
- **自動リフレッシュ**: トークン失効時にrefresh_tokenで自動更新
- **CORS**: フロントエンドURLのみ許可
- **セキュリティヘッダー**: helmetで設定

## トラブルシューティング

### 環境変数が見つからない

```
Error: Missing required environment variable: JIRA_CLIENT_ID
```

→ `.env` ファイルが正しく配置されているか確認してください。

### OAuth認証エラー

```
error: OAUTH_TOKEN_EXCHANGE_FAILED
```

→ Atlassian OAuth Appの設定を確認してください（Client ID, Secret, Callback URL）。

### カスタムフィールドが見つからない

```
error: JIRA_API_ERROR, message: "Field 'customfield_XXXXX' cannot be set..."
```

→ カスタムフィールドIDが正しいか確認してください。

## ライセンス

Private（社内利用）
