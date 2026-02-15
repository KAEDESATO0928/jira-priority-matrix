/**
 * Atlassian OAuth 2.0 (3LO) 認証サービス
 */
import crypto from 'crypto';
import { config } from '../config.js';
import {
  AtlassianTokenResponse,
  AtlassianAccessibleResource,
  AppError,
} from '../types/index.js';

const ATLASSIAN_AUTH_URL = 'https://auth.atlassian.com';
const ATLASSIAN_API_URL = 'https://api.atlassian.com';

/**
 * Authorization Code をアクセストークンに交換
 */
export async function exchangeCodeForToken(
  code: string
): Promise<AtlassianTokenResponse> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.jiraClientId,
    client_secret: config.jiraClientSecret,
    code,
    redirect_uri: config.jiraRedirectUri,
  });

  const response = await fetch(`${ATLASSIAN_AUTH_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[AuthService] Token exchange failed:', errorText);
    throw new AppError(
      'OAUTH_TOKEN_EXCHANGE_FAILED',
      'トークンの取得に失敗しました',
      response.status
    );
  }

  const data: AtlassianTokenResponse = await response.json();
  return data;
}

/**
 * リフレッシュトークンで新しいアクセストークンを取得
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<AtlassianTokenResponse> {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: config.jiraClientId,
    client_secret: config.jiraClientSecret,
    refresh_token: refreshToken,
  });

  const response = await fetch(`${ATLASSIAN_AUTH_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[AuthService] Token refresh failed:', errorText);
    throw new AppError(
      'OAUTH_TOKEN_REFRESH_FAILED',
      'トークンのリフレッシュに失敗しました',
      response.status
    );
  }

  const data: AtlassianTokenResponse = await response.json();
  return data;
}

/**
 * アクセストークンでアクセス可能なリソース（Cloud ID）を取得
 */
export async function getAccessibleResources(
  accessToken: string
): Promise<AtlassianAccessibleResource[]> {
  const response = await fetch(
    `${ATLASSIAN_API_URL}/oauth/token/accessible-resources`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[AuthService] Failed to get accessible resources:', errorText);
    throw new AppError(
      'OAUTH_RESOURCES_FAILED',
      'アクセス可能なリソースの取得に失敗しました',
      response.status
    );
  }

  const data: AtlassianAccessibleResource[] = await response.json();
  return data;
}

/**
 * 暗号学的に安全なstateパラメータを生成（CSRF対策）
 */
export function generateOAuthState(): string {
  return crypto.randomBytes(32).toString('hex');
}
