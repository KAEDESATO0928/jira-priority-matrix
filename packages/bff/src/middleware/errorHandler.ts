/**
 * Global Error Handler Middleware
 * グローバルエラーハンドラー
 */
import type { Request, Response, NextFunction } from 'express';
import type { ApiError } from '@jira-priority-matrix/shared';
import { AppError } from '../types/index.js';
import { config } from '../config.js';

/**
 * グローバルエラーハンドラー（4引数必須）
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response<ApiError>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  // 開発環境ではスタックトレースを出力
  if (!config.isProduction) {
    console.error('[ErrorHandler] Error caught:', err);
  }

  // AppErrorの場合
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        status: err.status,
      },
    });
    return;
  }

  // 予期しないエラーの場合
  console.error('[ErrorHandler] Unexpected error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: '予期しないエラーが発生しました',
      status: 500,
    },
  });
}
