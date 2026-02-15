/**
 * BFF固有の型定義
 */
import 'express-session';

/**
 * express-sessionのSessionData拡張
 */
declare module 'express-session' {
  interface SessionData {
    /** Atlassian OAuth Access Token */
    accessToken?: string;
    /** Atlassian OAuth Refresh Token */
    refreshToken?: string;
    /** Atlassian Cloud ID */
    cloudId?: string;
    /** トークンの有効期限（Unixタイムスタンプ秒） */
    expiresAt?: number;
    /** CSRF対策のstateパラメータ */
    oauthState?: string;
  }
}

/**
 * Jira REST API v3 検索レスポンス（/rest/api/3/search/jql）
 *
 * @see https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/#api-rest-api-3-search-jql-get
 */
export interface JiraSearchResponse {
  issues: JiraIssue[];
  /** 次ページのトークン（最終ページの場合は存在しない） */
  nextPageToken?: string;
  /** 最終ページかどうか */
  isLast?: boolean;
  /** ヒット総数（サーバーが返す場合のみ） */
  total?: number;
}

/**
 * Jira Issue
 */
export interface JiraIssue {
  expand: string;
  id: string;
  self: string;
  key: string;
  fields: JiraIssueFields;
}

/**
 * Jira Issue Fields
 */
export interface JiraIssueFields {
  summary: string;
  status: {
    self: string;
    description: string;
    iconUrl: string;
    name: string;
    id: string;
    statusCategory: {
      self: string;
      id: number;
      key: string;
      colorName: string;
      name: string;
    };
  };
  assignee: {
    self: string;
    accountId: string;
    displayName: string;
    avatarUrls: {
      '48x48': string;
      '24x24': string;
      '16x16': string;
      '32x32': string;
    };
  } | null;
  project: {
    self: string;
    id: string;
    key: string;
    name: string;
    avatarUrls: {
      '48x48': string;
      '24x24': string;
      '16x16': string;
      '32x32': string;
    };
  };
  issuetype: {
    self: string;
    id: string;
    description: string;
    iconUrl: string;
    name: string;
    subtask: boolean;
  };
  // カスタムフィールド（動的にアクセス）
  [key: string]: unknown;
}

/**
 * Jira カスタムフィールドの選択肢
 */
export interface JiraCustomFieldOption {
  self: string;
  value: string;
  id: string;
}

/**
 * Jira Project
 */
export interface JiraProject {
  expand: string;
  self: string;
  id: string;
  key: string;
  name: string;
  avatarUrls: {
    '48x48': string;
    '24x24': string;
    '16x16': string;
    '32x32': string;
  };
  projectTypeKey: string;
  simplified: boolean;
  style: string;
}

/**
 * Jira Agile Sprint
 */
export interface JiraSprint {
  id: number;
  self: string;
  state: 'active' | 'future' | 'closed';
  name: string;
  startDate?: string;
  endDate?: string;
  completeDate?: string;
  originBoardId: number;
  goal?: string;
}

/**
 * Jira User（Myself）
 */
export interface JiraUser {
  self: string;
  accountId: string;
  displayName: string;
  emailAddress: string;
  avatarUrls: {
    '48x48': string;
    '24x24': string;
    '16x16': string;
    '32x32': string;
  };
  active: boolean;
}

/**
 * Atlassian OAuth Token Response
 */
export interface AtlassianTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  refresh_token: string;
  scope: string;
}

/**
 * Atlassian Accessible Resource
 */
export interface AtlassianAccessibleResource {
  id: string;
  url: string;
  name: string;
  scopes: string[];
  avatarUrl: string;
}

/**
 * カスタムエラークラス
 */
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 500
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}
