/**
 * Auth Guard Middleware
 * 認証チェックミドルウェア
 */
import type { Request, Response, NextFunction } from 'express';
import type { ApiError } from '@jira-priority-matrix/shared';
import { refreshAccessToken } from '../services/authService.js';

/**
 * セッションに認証情報があるかチェック
 * トークン期限切れ間近の場合はプロアクティブにリフレッシュ
 */
export function authGuard(
  req: Request,
  res: Response<ApiError>,
  next: NextFunction
): void {
  const { session } = req;

  // アクセストークンとCloud IDが必要
  if (!session.accessToken || !session.cloudId) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: '認証されていません。ログインしてください。',
        status: 401,
      },
    });
    return;
  }

  // トークンの有効期限チェック（有効期限の5分前にリフレッシュ）
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = session.expiresAt ?? 0;
  const bufferSeconds = 300; // 5分

  if (expiresAt > 0 && now >= expiresAt - bufferSeconds) {
    if (!session.refreshToken) {
      res.status(401).json({
        error: {
          code: 'TOKEN_EXPIRED',
          message: '認証が期限切れです。再ログインしてください。',
          status: 401,
        },
      });
      return;
    }

    console.log('[AuthGuard] Token is about to expire, refreshing proactively...');
    refreshAccessToken(session.refreshToken)
      .then((tokenResponse) => {
        session.accessToken = tokenResponse.access_token;
        session.refreshToken = tokenResponse.refresh_token;
        session.expiresAt = Math.floor(Date.now() / 1000) + tokenResponse.expires_in;
        console.log('[AuthGuard] Token refreshed successfully');
        next();
      })
      .catch((error: unknown) => {
        console.error('[AuthGuard] Token refresh failed:', error);
        res.status(401).json({
          error: {
            code: 'TOKEN_REFRESH_FAILED',
            message: '認証の更新に失敗しました。再ログインしてください。',
            status: 401,
          },
        });
      });
    return;
  }

  next();
}
