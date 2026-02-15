# Jira Priority Matrix — Project CLAUDE.md

## プロジェクト概要

Jira Cloudのチケットと連動し、重要度（Importance）× 緊急度（Urgency）の2×2マトリクス（アイゼンハワー・マトリクス）でタスクを可視化・管理するWebアプリケーション。

## アーキテクチャ

```
jira-priority-matrix/
├── CLAUDE.md                  # このファイル
├── .claude/
│   └── agents/                # Subagent定義
│       ├── backend-architect.md
│       ├── frontend-developer.md
│       ├── api-integration.md
│       └── test-reviewer.md
├── packages/
│   ├── web/                   # フロントエンド（React + TypeScript）
│   │   ├── src/
│   │   │   ├── components/    # UIコンポーネント
│   │   │   ├── hooks/         # カスタムフック
│   │   │   ├── types/         # 型定義
│   │   │   ├── services/      # API呼び出しレイヤー
│   │   │   ├── stores/        # 状態管理
│   │   │   └── utils/         # ユーティリティ
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── bff/                   # BFF（Express + TypeScript）
│       ├── src/
│       │   ├── routes/        # APIルート定義
│       │   ├── services/      # Jira API呼び出しロジック
│       │   ├── middleware/    # 認証・エラーハンドリング
│       │   └── types/         # 共有型定義
│       ├── package.json
│       └── tsconfig.json
├── packages/shared/           # フロント・BFF共有の型定義
│   └── types/
│       └── index.ts
└── docs/
    └── requirements.md        # 要件定義
```

## 技術スタック

| レイヤー | 技術 | バージョン |
|----------|------|-----------|
| フロントエンド | React + TypeScript | React 19, TS 5.7+ |
| UI | Tailwind CSS v4 | |
| D&D | @dnd-kit/core, @dnd-kit/sortable | 最新安定版 |
| 状態管理 | Zustand | |
| BFF | Express + TypeScript | |
| 認証 | Atlassian OAuth 2.0 (3LO) | |
| ビルド | Vite | |
| テスト | Vitest + React Testing Library | |
| リンター | ESLint + Prettier | |
| パッケージ管理 | pnpm workspaces | |

## コーディング規約

### TypeScript
- `strict: true` を常に有効にする
- `any` は使用禁止。不明な型には `unknown` を使う
- 関数の戻り値型は明示する（ `function foo(): ReturnType` ）
- インターフェースは `I` プレフィックス不要（例: `Ticket` で良い、`ITicket` は不可）
- enum は使わない。`as const` + `typeof` パターンを使う

### React
- 関数コンポーネントのみ（classコンポーネント禁止）
- コンポーネントファイル名はPascalCase（例: `MatrixBoard.tsx`）
- フック名は `use` プレフィックス（例: `useJiraTickets.ts`）
- Props型はコンポーネント名 + `Props`（例: `MatrixBoardProps`）
- コンポーネントはdefault exportしない。named exportを使う

### ファイル命名
- コンポーネント: PascalCase.tsx（例: `TicketCard.tsx`）
- フック: camelCase.ts（例: `useJiraTickets.ts`）
- ユーティリティ: camelCase.ts（例: `jqlBuilder.ts`）
- 型定義: camelCase.ts（例: `ticket.ts`）
- テスト: `*.test.ts` or `*.test.tsx`

### スタイル
- Tailwind CSSユーティリティクラスを使う
- インラインstyleは原則禁止
- カスタムCSSは最小限に（Tailwindで表現できない場合のみ）

### エラーハンドリング
- API呼び出しは必ずtry-catchで囲む
- ユーザー向けエラーメッセージは日本語で表示
- 開発者向けログは英語（console.error）

### コミットメッセージ
- Conventional Commits形式: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`
- 日本語可（例: `feat: マトリクスボードのD&D実装`）

## Jiraカスタムフィールド

| フィールド名 | フィールドID | 型 | 選択肢 |
|-------------|-------------|-----|--------|
| Importance | `customfield_XXXXX` | Select List | `High`, `Low` |
| Urgency | `customfield_YYYYY` | Select List | `High`, `Low` |

> **注意**: 実際のフィールドIDはJira管理画面で確認して `.env` に設定する。

## マトリクス象限定義

| 象限 | 重要度 | 緊急度 | ラベル | 色 | アクション |
|------|--------|--------|--------|-----|-----------|
| Q1 | High | High | Do First | 赤系 (#EF4444) | 即座に取り組む |
| Q2 | High | Low | Schedule | 緑系 (#22C55E) | スケジュールに入れる |
| Q3 | Low | High | Delegate | 黄系 (#F59E0B) | 委任する |
| Q4 | Low | Low | Eliminate | 灰系 (#6B7280) | 削除/後回し |
| 未分類 | 未設定 | 未設定 | Uncategorized | 青系 (#3B82F6) | 分類が必要 |

## 環境変数（.env）

```
# Jira
JIRA_CLOUD_URL=https://your-domain.atlassian.net
JIRA_CLIENT_ID=<Atlassian OAuth App Client ID>
JIRA_CLIENT_SECRET=<Atlassian OAuth App Client Secret>
JIRA_REDIRECT_URI=http://localhost:3001/auth/callback
JIRA_IMPORTANCE_FIELD_ID=customfield_XXXXX
JIRA_URGENCY_FIELD_ID=customfield_YYYYY

# BFF Server
BFF_PORT=3001
SESSION_SECRET=<random string>

# Frontend
VITE_BFF_URL=http://localhost:3001
```

## Sub-Agent ルーティングルール

### 並列ディスパッチ（以下の全条件を満たす場合）
- 3つ以上の独立したタスクがある
- タスク間で共有状態がない
- ファイル境界が明確で重複しない

### 順次ディスパッチ（以下のいずれかに該当する場合）
- タスクに依存関係がある（BがAの出力を必要とする）
- 共有ファイルや状態がある（マージコンフリクトのリスク）
- スコープが不明確（先に調査が必要）

### バックグラウンドディスパッチ
- 調査・分析タスク（ファイル変更なし）
- 結果が現在の作業をブロックしない

## 開発フェーズ

### Phase 1 — 基盤構築（1週間）
- pnpm workspace初期化
- BFF: Express + Atlassian OAuth 2.0認証フロー
- フロント: マトリクスUI静的表示（モックデータ）
- 共有型定義

### Phase 2 — コア機能（1週間）
- Jira APIからチケット取得→マトリクス表示
- D&Dによる象限移動 + Jira書き込み（Optimistic Update）
- フィルタ機能（プロジェクト・担当者・スプリント・ステータス）

### Phase 3 — 仕上げ（1週間）
- 複数プロジェクト横断表示
- 未分類チケットエリア
- エラーハンドリング強化
- テスト・デプロイ

## よくある注意点

- Jira REST API v3のレート制限に注意（ページネーション必須）
- Atlassian OAuth 2.0 (3LO) のトークンリフレッシュを忘れずに実装する
- D&Dのdrop時はOptimistic Updateし、API失敗時はロールバックする
- `packages/shared/types/` の型を変更したら、web/bff両方のビルドを確認する
