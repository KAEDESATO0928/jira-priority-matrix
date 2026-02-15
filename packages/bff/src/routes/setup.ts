/**
 * Setup Routes
 * カスタムフィールドの自動セットアップ
 */
import { Router, type IRouter } from 'express';
import type { Request, Response } from 'express';
import { authGuard } from '../middleware/authGuard.js';
import { setupFields } from '../services/fieldSetup.js';

export const setupRouter: IRouter = Router();

// 認証ガード
setupRouter.use(authGuard);

/**
 * POST /api/setup/fields
 * Importance + Urgency カスタムフィールドをJiraに作成する
 */
setupRouter.post(
  '/fields',
  async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('[SetupRoute] Creating custom fields...');
      const result = await setupFields(req.session);

      res.json({
        data: result,
        message: result.errors.length === 0
          ? 'カスタムフィールドのセットアップが完了しました'
          : 'セットアップが部分的に完了しました（一部エラーあり）',
      });
    } catch (error) {
      console.error('[SetupRoute] POST /fields error:', error);
      throw error;
    }
  }
);
