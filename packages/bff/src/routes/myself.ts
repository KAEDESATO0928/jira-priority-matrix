/**
 * Myself Routes
 * ログインユーザー情報ルート
 */
import { Router, type IRouter } from 'express';
import type { Request, Response } from 'express';
import type { ApiResponse, ApiError } from '@jira-priority-matrix/shared';
import { authGuard } from '../middleware/authGuard.js';
import { JiraClient } from '../services/jiraClient.js';
import type { JiraUser } from '../types/index.js';

export const myselfRouter: IRouter = Router();

// すべてのルートに認証ガードを適用
myselfRouter.use(authGuard);

/**
 * ログインユーザー情報（簡略版）
 */
interface UserInfo {
  accountId: string;
  displayName: string;
  emailAddress: string;
  avatarUrl: string;
}

/**
 * GET /api/myself
 * ログインユーザー情報取得
 */
myselfRouter.get(
  '/',
  async (req: Request, res: Response<ApiResponse<UserInfo> | ApiError>): Promise<void> => {
    try {
      const client = new JiraClient(req.session);

      // Jira APIでログインユーザー情報を取得
      const jiraUser = await client.get<JiraUser>('/myself');

      const userInfo: UserInfo = {
        accountId: jiraUser.accountId,
        displayName: jiraUser.displayName,
        emailAddress: jiraUser.emailAddress,
        avatarUrl: jiraUser.avatarUrls['48x48'],
      };

      console.log(`[MyselfRoute] Fetched user info: ${userInfo.displayName}`);

      res.json({
        data: userInfo,
      });
    } catch (error) {
      console.error('[MyselfRoute] GET error:', error);
      throw error;
    }
  }
);
