/**
 * Projects Routes
 * プロジェクト一覧ルート
 */
import { Router, type IRouter } from 'express';
import type { Request, Response } from 'express';
import type { ApiResponse, Project, ApiError } from '@jira-priority-matrix/shared';
import { authGuard } from '../middleware/authGuard.js';
import { JiraClient } from '../services/jiraClient.js';
import type { JiraProject } from '../types/index.js';

export const projectsRouter: IRouter = Router();

// すべてのルートに認証ガードを適用
projectsRouter.use(authGuard);

/**
 * GET /api/projects
 * プロジェクト一覧取得
 */
projectsRouter.get(
  '/',
  async (req: Request, res: Response<ApiResponse<Project[]> | ApiError>): Promise<void> => {
    try {
      const client = new JiraClient(req.session);

      // Jiraプロジェクト一覧を取得
      const jiraProjects = await client.get<JiraProject[]>('/project');

      // Project型にマッピング
      const projects: Project[] = jiraProjects.map((p) => ({
        key: p.key,
        name: p.name,
        avatarUrl: p.avatarUrls['48x48'],
      }));

      console.log(`[ProjectsRoute] Fetched ${projects.length} projects`);

      res.json({
        data: projects,
      });
    } catch (error) {
      console.error('[ProjectsRoute] GET error:', error);
      throw error;
    }
  }
);
