/**
 * Tickets Routes
 * チケットCRUDルート
 */
import { Router, type IRouter } from 'express';
import type { Request, Response } from 'express';
import type {
  FilterState,
  ApiResponse,
  Ticket,
  MoveTicketRequest,
  ApiError,
} from '@jira-priority-matrix/shared';
import { authGuard } from '../middleware/authGuard.js';
import { searchTickets, updateTicketPriority } from '../services/ticketService.js';

export const ticketsRouter: IRouter = Router();

// すべてのルートに認証ガードを適用
ticketsRouter.use(authGuard);

/**
 * GET /api/tickets
 * チケット一覧取得
 */
ticketsRouter.get(
  '/',
  async (req: Request, res: Response<ApiResponse<Ticket[]> | ApiError>): Promise<void> => {
    try {
      // クエリパラメータからFilterStateを構築
      const filter: FilterState = {
        projectKeys: req.query.projectKeys
          ? String(req.query.projectKeys).split(',').filter(Boolean)
          : [],
        assigneeAccountId: req.query.assigneeAccountId
          ? String(req.query.assigneeAccountId)
          : null,
        onlyMe: req.query.onlyMe === 'true',
        sprintId: req.query.sprintId ? parseInt(String(req.query.sprintId), 10) : null,
        hideDone: req.query.hideDone !== 'false', // デフォルトtrue
        searchText: req.query.searchText ? String(req.query.searchText) : '',
      };

      console.log('[TicketsRoute] Filter:', filter);

      const { tickets, total } = await searchTickets(req.session, filter);

      res.json({
        data: tickets,
        meta: {
          total,
          startAt: 0,
          maxResults: tickets.length,
        },
      });
    } catch (error) {
      console.error('[TicketsRoute] GET error:', error);
      throw error;
    }
  }
);

/**
 * PUT /api/tickets/:key
 * チケットの重要度・緊急度を更新
 */
ticketsRouter.put(
  '/:key',
  async (req: Request, res: Response<ApiResponse<void> | ApiError>): Promise<void> => {
    try {
      const key = req.params.key as string;
      const moveRequest = req.body as MoveTicketRequest;

      // バリデーション
      if (!moveRequest.importance || !moveRequest.urgency) {
        res.status(400).json({
          error: {
            code: 'INVALID_REQUEST',
            message: 'importance と urgency は必須です',
            status: 400,
          },
        });
        return;
      }

      console.log(`[TicketsRoute] Updating ${key}:`, moveRequest);

      await updateTicketPriority(req.session, key, moveRequest);

      res.json({
        data: undefined,
      });
    } catch (error) {
      console.error('[TicketsRoute] PUT error:', error);
      throw error;
    }
  }
);
