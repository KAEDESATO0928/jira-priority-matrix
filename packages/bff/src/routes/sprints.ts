/**
 * Sprints Routes
 * スプリント一覧ルート
 */
import { Router, type IRouter } from 'express';
import type { Request, Response } from 'express';
import type { ApiResponse, Sprint, ApiError } from '@jira-priority-matrix/shared';
import { authGuard } from '../middleware/authGuard.js';
import { JiraClient } from '../services/jiraClient.js';
import type { JiraSprint } from '../types/index.js';

export const sprintsRouter: IRouter = Router();

// すべてのルートに認証ガードを適用
sprintsRouter.use(authGuard);

/**
 * GET /api/sprints/:boardId
 * スプリント一覧取得
 */
sprintsRouter.get(
  '/:boardId',
  async (req: Request, res: Response<ApiResponse<Sprint[]> | ApiError>): Promise<void> => {
    try {
      const boardId = req.params.boardId as string;

      if (!boardId || isNaN(parseInt(boardId, 10))) {
        res.status(400).json({
          error: {
            code: 'INVALID_BOARD_ID',
            message: '有効なボードIDを指定してください',
            status: 400,
          },
        });
        return;
      }

      const client = new JiraClient(req.session);

      // Agile APIでスプリント一覧を取得
      interface SprintResponse {
        maxResults: number;
        startAt: number;
        isLast: boolean;
        values: JiraSprint[];
      }

      const response = await client.get<SprintResponse>(
        `/board/${boardId}/sprint`,
        true // Agile API
      );

      // Sprint型にマッピング
      const sprints: Sprint[] = response.values.map((s) => ({
        id: s.id,
        name: s.name,
        state: s.state,
      }));

      console.log(`[SprintsRoute] Fetched ${sprints.length} sprints for board ${boardId}`);

      res.json({
        data: sprints,
      });
    } catch (error) {
      console.error('[SprintsRoute] GET error:', error);
      throw error;
    }
  }
);
