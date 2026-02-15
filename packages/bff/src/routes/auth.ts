/**
 * Auth Routes
 * Atlassian OAuth 2.0 (3LO) 認証ルート
 */
import { Router, type IRouter } from 'express';
import type { Request, Response } from 'express';
import type { ApiError } from '@jira-priority-matrix/shared';
import { config } from '../config.js';
import {
  exchangeCodeForToken,
  getAccessibleResources,
  generateOAuthState,
} from '../services/authService.js';

export const authRouter: IRouter = Router();

const ATLASSIAN_AUTH_URL = 'https://auth.atlassian.com';
const OAUTH_SCOPES = [
  'read:jira-work',
  'write:jira-work',
  'read:jira-user',
  'manage:jira-configuration',
  'manage:jira-project',
  'offline_access',
].join(' ');

/**
 * GET /auth/login
 * Atlassian認可画面へリダイレクト
 */
authRouter.get('/login', (req: Request, res: Response): void => {
  const state = generateOAuthState();
  req.session.oauthState = state;

  const authUrl = new URL(`${ATLASSIAN_AUTH_URL}/authorize`);
  authUrl.searchParams.set('audience', 'api.atlassian.com');
  authUrl.searchParams.set('client_id', config.jiraClientId);
  authUrl.searchParams.set('scope', OAUTH_SCOPES);
  authUrl.searchParams.set('redirect_uri', config.jiraRedirectUri);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('prompt', 'consent');

  console.log('[Auth] Redirecting to Atlassian authorization page');
  res.redirect(authUrl.toString());
});

/**
 * GET /auth/callback
 * Atlassian OAuth コールバック
 */
authRouter.get('/callback', async (req: Request, res: Response<ApiError>): Promise<void> => {
  const { code, state } = req.query;

  // CSRF対策: stateパラメータの検証
  if (state !== req.session.oauthState) {
    console.error('[Auth] Invalid OAuth state parameter');
    res.status(400).json({
      error: {
        code: 'INVALID_OAUTH_STATE',
        message: '不正なOAuth stateパラメータです',
        status: 400,
      },
    });
    return;
  }

  if (typeof code !== 'string') {
    console.error('[Auth] Missing authorization code');
    res.status(400).json({
      error: {
        code: 'MISSING_AUTH_CODE',
        message: '認可コードが見つかりません',
        status: 400,
      },
    });
    return;
  }

  try {
    // 1. トークン取得
    console.log('[Auth] Exchanging code for token...');
    const tokenResponse = await exchangeCodeForToken(code);

    // 2. アクセス可能なリソース（Cloud ID）を取得
    console.log('[Auth] Fetching accessible resources...');
    const resources = await getAccessibleResources(tokenResponse.access_token);

    if (resources.length === 0) {
      console.error('[Auth] No accessible resources found');
      res.status(403).json({
        error: {
          code: 'NO_ACCESSIBLE_RESOURCES',
          message: 'アクセス可能なJiraサイトが見つかりません',
          status: 403,
        },
      });
      return;
    }

    // 最初のリソースを使用（複数サイトがある場合は最初のもの）
    const cloudId = resources[0].id;
    console.log('[Auth] Cloud ID:', cloudId);

    // 3. セッションに保存
    req.session.accessToken = tokenResponse.access_token;
    req.session.refreshToken = tokenResponse.refresh_token;
    req.session.cloudId = cloudId;
    req.session.expiresAt = Math.floor(Date.now() / 1000) + tokenResponse.expires_in;

    // OAuth stateは使い終わったので削除
    delete req.session.oauthState;

    // セッション保存を待ってからリダイレクト
    req.session.save((err) => {
      if (err) {
        console.error('[Auth] Session save error:', err);
        res.status(500).json({
          error: {
            code: 'SESSION_SAVE_ERROR',
            message: 'セッションの保存に失敗しました',
            status: 500,
          },
        });
        return;
      }

      console.log('[Auth] Login successful, redirecting to frontend');
      res.redirect(config.frontendUrl);
    });
  } catch (error) {
    console.error('[Auth] Callback error:', error);
    res.status(500).json({
      error: {
        code: 'OAUTH_CALLBACK_ERROR',
        message: '認証処理中にエラーが発生しました',
        status: 500,
      },
    });
  }
});

/**
 * POST /auth/logout
 * ログアウト（セッション破棄）
 */
authRouter.post('/logout', (req: Request, res: Response): void => {
  req.session.destroy((err) => {
    if (err) {
      console.error('[Auth] Logout error:', err);
      res.status(500).json({
        error: {
          code: 'LOGOUT_ERROR',
          message: 'ログアウトに失敗しました',
          status: 500,
        },
      });
      return;
    }

    console.log('[Auth] Logout successful');
    res.status(200).json({ message: 'ログアウトしました' });
  });
});

/**
 * GET /auth/status
 * 認証状態確認
 */
authRouter.get('/status', (req: Request, res: Response): void => {
  const isAuthenticated =
    !!req.session.accessToken && !!req.session.cloudId;

  res.json({
    authenticated: isAuthenticated,
    expiresAt: req.session.expiresAt ?? null,
  });
});
