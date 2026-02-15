/**
 * Jira Priority Matrix - Shared Type Definitions
 * フロントエンド（web）とBFF（bff）で共有する型定義
 */

/**
 * 重要度・緊急度の値
 */
export const PriorityLevel = {
  HIGH: 'High',
  LOW: 'Low',
} as const;
export type PriorityLevel = typeof PriorityLevel[keyof typeof PriorityLevel];

/**
 * マトリクス象限
 */
export const Quadrant = {
  DO_FIRST: 'Q1',    // High Importance, High Urgency
  SCHEDULE: 'Q2',    // High Importance, Low Urgency
  DELEGATE: 'Q3',    // Low Importance, High Urgency
  ELIMINATE: 'Q4',   // Low Importance, Low Urgency
  UNCATEGORIZED: 'UNCATEGORIZED',
} as const;
export type Quadrant = typeof Quadrant[keyof typeof Quadrant];

/**
 * チケットステータス
 */
export interface TicketStatus {
  /** ステータス名（例: "To Do", "In Progress", "Done"） */
  name: string;
  /** ステータスカテゴリキー（例: "new", "indeterminate", "done"） */
  categoryKey: string;
}

/**
 * 担当者
 */
export interface Assignee {
  /** 表示名 */
  displayName: string;
  /** アバター画像URL（48x48） */
  avatarUrl: string;
  /** Atlassian Account ID */
  accountId: string;
}

/**
 * プロジェクト
 */
export interface Project {
  /** プロジェクトキー（例: "PROJ"） */
  key: string;
  /** プロジェクト名 */
  name: string;
  /** プロジェクトアバター画像URL */
  avatarUrl: string;
}

/**
 * チケット
 */
export interface Ticket {
  /** チケットキー（例: "PROJ-123"） */
  key: string;
  /** チケットタイトル */
  summary: string;
  /** ステータス */
  status: TicketStatus;
  /** 担当者（未割り当ての場合はnull） */
  assignee: Assignee | null;
  /** プロジェクト */
  project: Project;
  /** 重要度（未設定の場合はnull） */
  importance: PriorityLevel | null;
  /** 緊急度（未設定の場合はnull） */
  urgency: PriorityLevel | null;
  /** マトリクス象限 */
  quadrant: Quadrant;
  /** 課題タイプ（例: "Task", "Bug", "Story"） */
  issueType: string;
  /** JiraチケットへのURL */
  url: string;
}

/**
 * スプリント
 */
export interface Sprint {
  /** スプリントID */
  id: number;
  /** スプリント名 */
  name: string;
  /** スプリントの状態 */
  state: 'active' | 'future' | 'closed';
}

/**
 * フィルタ状態
 */
export interface FilterState {
  /** 絞り込み対象のプロジェクトキー一覧 */
  projectKeys: string[];
  /** 絞り込み対象の担当者Account ID（未指定の場合はnull） */
  assigneeAccountId: string | null;
  /** 自分のチケットのみ表示するか */
  onlyMe: boolean;
  /** 絞り込み対象のスプリントID（未指定の場合はnull） */
  sprintId: number | null;
  /** 完了済みチケットを非表示にするか */
  hideDone: boolean;
  /** 検索テキスト */
  searchText: string;
}

/**
 * API レスポンス共通
 */
export interface ApiResponse<T> {
  /** レスポンスデータ */
  data: T;
  /** ページネーション情報（オプション） */
  meta?: {
    /** 全件数 */
    total: number;
    /** 開始位置 */
    startAt: number;
    /** 最大取得件数 */
    maxResults: number;
  };
}

/**
 * API エラー
 */
export interface ApiError {
  error: {
    /** エラーコード */
    code: string;
    /** エラーメッセージ */
    message: string;
    /** HTTPステータスコード */
    status: number;
  };
}

/**
 * チケット移動リクエスト
 */
export interface MoveTicketRequest {
  /** 移動後の重要度 */
  importance: PriorityLevel;
  /** 移動後の緊急度 */
  urgency: PriorityLevel;
}

/**
 * 重要度と緊急度から象限を決定する
 *
 * @param importance - 重要度（nullの場合は未設定）
 * @param urgency - 緊急度（nullの場合は未設定）
 * @returns マトリクス象限
 */
export function determineQuadrant(
  importance: PriorityLevel | null,
  urgency: PriorityLevel | null
): Quadrant {
  // いずれかが未設定の場合は未分類
  if (importance === null || urgency === null) {
    return Quadrant.UNCATEGORIZED;
  }

  // 両方設定されている場合は象限を決定
  if (importance === PriorityLevel.HIGH && urgency === PriorityLevel.HIGH) {
    return Quadrant.DO_FIRST; // Q1
  }
  if (importance === PriorityLevel.HIGH && urgency === PriorityLevel.LOW) {
    return Quadrant.SCHEDULE; // Q2
  }
  if (importance === PriorityLevel.LOW && urgency === PriorityLevel.HIGH) {
    return Quadrant.DELEGATE; // Q3
  }
  if (importance === PriorityLevel.LOW && urgency === PriorityLevel.LOW) {
    return Quadrant.ELIMINATE; // Q4
  }

  // ここには到達しないはずだが、念のため
  return Quadrant.UNCATEGORIZED;
}
