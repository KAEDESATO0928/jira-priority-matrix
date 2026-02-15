/**
 * Jira REST API Client
 * Jira APIへのHTTPリクエストを管理
 */
import type { SessionData } from 'express-session';
import { refreshAccessToken } from './authService.js';
import { AppError } from '../types/index.js';

const ATLASSIAN_API_BASE = 'https://api.atlassian.com/ex/jira';

/**
 * セッションからトークンをリフレッシュして更新
 */
async function refreshSessionToken(session: SessionData): Promise<void> {
  if (!session.refreshToken) {
    throw new AppError(
      'NO_REFRESH_TOKEN',
      'リフレッシュトークンが見つかりません。再ログインしてください。',
      401
    );
  }

  console.log('[JiraClient] Refreshing access token...');
  const tokenResponse = await refreshAccessToken(session.refreshToken);

  // セッション更新
  session.accessToken = tokenResponse.access_token;
  session.refreshToken = tokenResponse.refresh_token;
  session.expiresAt = Math.floor(Date.now() / 1000) + tokenResponse.expires_in;

  console.log('[JiraClient] Access token refreshed successfully');
}

/**
 * Jira REST API v3 ベースURL
 */
function getJiraRestApiUrl(cloudId: string): string {
  return `${ATLASSIAN_API_BASE}/${cloudId}/rest/api/3`;
}

/**
 * Jira Agile API ベースURL
 */
function getJiraAgileApiUrl(cloudId: string): string {
  return `${ATLASSIAN_API_BASE}/${cloudId}/rest/agile/1.0`;
}

/**
 * Jira API クライアント
 */
export class JiraClient {
  constructor(
    private session: SessionData
  ) {
    if (!session.accessToken || !session.cloudId) {
      throw new AppError(
        'UNAUTHORIZED',
        '認証されていません。ログインしてください。',
        401
      );
    }
  }

  /**
   * GETリクエスト
   */
  async get<T>(endpoint: string, isAgileApi = false): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, isAgileApi);
  }

  /**
   * POSTリクエスト
   */
  async post<T>(
    endpoint: string,
    body: unknown,
    isAgileApi = false
  ): Promise<T> {
    return this.request<T>('POST', endpoint, body, isAgileApi);
  }

  /**
   * PUTリクエスト
   */
  async put<T>(
    endpoint: string,
    body: unknown,
    isAgileApi = false
  ): Promise<T> {
    return this.request<T>('PUT', endpoint, body, isAgileApi);
  }

  /**
   * HTTPリクエストを実行（自動リトライ・トークンリフレッシュ対応）
   */
  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown,
    isAgileApi = false,
    retryCount = 0
  ): Promise<T> {
    const { accessToken, cloudId } = this.session;

    if (!accessToken || !cloudId) {
      throw new AppError(
        'UNAUTHORIZED',
        '認証されていません。ログインしてください。',
        401
      );
    }

    const baseUrl = isAgileApi
      ? getJiraAgileApiUrl(cloudId)
      : getJiraRestApiUrl(cloudId);
    const url = `${baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    };

    if (body) {
      headers['Content-Type'] = 'application/json';
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    console.log(`[JiraClient] ${method} ${url}`);

    const response = await fetch(url, options);

    // 成功
    if (response.ok) {
      // 204 No Content の場合は空オブジェクトを返す
      if (response.status === 204) {
        return {} as T;
      }
      return (await response.json()) as T;
    }

    // 401 Unauthorized → トークンリフレッシュして再試行
    if (response.status === 401 && retryCount === 0) {
      console.log('[JiraClient] Received 401, attempting token refresh...');
      await refreshSessionToken(this.session);
      return this.request<T>(method, endpoint, body, isAgileApi, retryCount + 1);
    }

    // 429 Rate Limit → Retry-After を尊重
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const waitSeconds = retryAfter ? parseInt(retryAfter, 10) : 60;
      console.error(
        `[JiraClient] Rate limit exceeded. Retry after ${waitSeconds} seconds`
      );
      throw new AppError(
        'RATE_LIMIT_EXCEEDED',
        `APIレート制限に達しました。${waitSeconds}秒後に再試行してください。`,
        429
      );
    }

    // その他のエラー
    const errorText = await response.text();
    console.error(`[JiraClient] Request failed (${response.status}):`, errorText);

    let errorMessage = 'Jira APIリクエストに失敗しました';
    try {
      const errorData = JSON.parse(errorText);
      if (errorData.errorMessages && errorData.errorMessages.length > 0) {
        errorMessage = errorData.errorMessages[0];
      } else if (errorData.errors) {
        const errorKeys = Object.keys(errorData.errors);
        if (errorKeys.length > 0) {
          errorMessage = errorData.errors[errorKeys[0]];
        }
      }
    } catch {
      // JSONパースに失敗した場合はデフォルトメッセージを使用
    }

    throw new AppError('JIRA_API_ERROR', errorMessage, response.status);
  }
}
