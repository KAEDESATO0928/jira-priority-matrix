/**
 * Debug Routes
 * デバッグ・診断用エンドポイント（開発環境のみ）
 */
import { Router, type IRouter } from 'express';
import type { Request, Response } from 'express';
import { authGuard } from '../middleware/authGuard.js';
import { discoverFieldIds, getCachedFieldIds } from '../services/fieldDiscovery.js';
import { config } from '../config.js';

export const debugRouter: IRouter = Router();

// すべてのルートに認証ガードを適用
debugRouter.use(authGuard);

/**
 * GET /api/debug/fields
 * Jiraのフィールド自動検出結果を返す
 */
debugRouter.get(
  '/fields',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const discovered = await discoverFieldIds(req.session);

      res.json({
        data: {
          discovered: {
            importanceFieldId: discovered.importanceFieldId ?? '(not found)',
            urgencyFieldId: discovered.urgencyFieldId ?? '(not found)',
            fieldsExist: discovered.fieldsExist,
          },
          envConfig: {
            importanceFieldId: config.jiraImportanceFieldId || '(not set)',
            urgencyFieldId: config.jiraUrgencyFieldId || '(not set)',
          },
          match: {
            importance: config.jiraImportanceFieldId === discovered.importanceFieldId,
            urgency: config.jiraUrgencyFieldId === discovered.urgencyFieldId,
          },
          cached: getCachedFieldIds() !== null,
        },
      });
    } catch (error) {
      console.error('[DebugRoute] GET /fields error:', error);
      throw error;
    }
  }
);
