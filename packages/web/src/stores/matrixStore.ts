import { create } from 'zustand';
import type {
  Ticket,
  FilterState,
  PriorityLevel,
  Quadrant,
  Project,
  Sprint,
} from '@jira-priority-matrix/shared';
import { determineQuadrant } from '@jira-priority-matrix/shared';
import * as api from '../services/apiClient';
import toast from 'react-hot-toast';

/**
 * 現在のユーザー情報
 */
export interface CurrentUser {
  accountId: string;
  displayName: string;
  avatarUrl: string;
}

/**
 * マトリクスストアの状態型
 */
interface MatrixState {
  /** チケット一覧 */
  tickets: Ticket[];
  /** フィルタ状態 */
  filterState: FilterState;
  /** ローディング状態 */
  isLoading: boolean;
  /** エラーメッセージ */
  error: string | null;

  /** プロジェクト一覧 */
  projects: Project[];
  /** スプリント一覧 */
  sprints: Sprint[];
  /** 現在のユーザー */
  currentUser: CurrentUser | null;
  /** 認証状態 */
  isAuthenticated: boolean;

  /** チケットをセット（内部用） */
  setTickets: (tickets: Ticket[]) => void;
  /** チケット一覧を取得（API） */
  fetchTickets: () => Promise<void>;
  /** チケットを移動（重要度・緊急度を更新、Optimistic Update） */
  moveTicket: (ticketKey: string, importance: PriorityLevel, urgency: PriorityLevel) => Promise<void>;
  /** フィルタを更新 */
  updateFilter: (filter: Partial<FilterState>) => void;
  /** 特定の象限のチケットを取得 */
  getTicketsByQuadrant: (quadrant: Quadrant) => Ticket[];
  /** ローディング状態をセット */
  setLoading: (isLoading: boolean) => void;
  /** エラーをセット */
  setError: (error: string | null) => void;

  /** プロジェクト一覧を取得 */
  fetchProjects: () => Promise<void>;
  /** スプリント一覧を取得 */
  fetchSprints: (boardId: number) => Promise<void>;
  /** 現在のユーザー情報を取得 */
  fetchCurrentUser: () => Promise<void>;
  /** 認証状態をチェック */
  checkAuth: () => Promise<void>;
  /** ログアウト */
  logout: () => Promise<void>;
}

/**
 * マトリクスストア
 */
export const useMatrixStore = create<MatrixState>((set, get) => ({
  tickets: [],
  filterState: {
    projectKeys: [],
    assigneeAccountId: null,
    onlyMe: false,
    sprintId: null,
    hideDone: true,
    searchText: '',
  },
  isLoading: false,
  error: null,
  projects: [],
  sprints: [],
  currentUser: null,
  isAuthenticated: false,

  setTickets: (tickets: Ticket[]): void => {
    set({ tickets, error: null });
  },

  fetchTickets: async (): Promise<void> => {
    const { filterState } = get();
    set({ isLoading: true, error: null });
    try {
      const response = await api.fetchTickets(filterState);
      set({ tickets: response.data, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'チケットの取得に失敗しました';
      console.error('Failed to fetch tickets:', error);
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  moveTicket: async (ticketKey: string, importance: PriorityLevel, urgency: PriorityLevel): Promise<void> => {
    const tickets = get().tickets;
    const targetTicket = tickets.find((t) => t.key === ticketKey);
    if (!targetTicket) return;

    // Optimistic Update: UIを即座に更新
    const newQuadrant = determineQuadrant(importance, urgency);
    const optimisticTickets = tickets.map((ticket) => {
      if (ticket.key === ticketKey) {
        return {
          ...ticket,
          importance,
          urgency,
          quadrant: newQuadrant,
        };
      }
      return ticket;
    });
    set({ tickets: optimisticTickets });

    // API呼び出し
    try {
      await api.moveTicket(ticketKey, { importance, urgency });
      toast.success(`${ticketKey} を移動しました`);
    } catch (error) {
      // ロールバック
      console.error('Failed to move ticket:', error);
      set({ tickets });
      const message = error instanceof Error ? error.message : 'チケットの移動に失敗しました';
      toast.error(message);
    }
  },

  updateFilter: (filter: Partial<FilterState>): void => {
    set((state) => ({
      filterState: {
        ...state.filterState,
        ...filter,
      },
    }));
  },

  getTicketsByQuadrant: (quadrant: Quadrant): Ticket[] => {
    const { tickets, filterState } = get();

    // フィルタリング処理
    let filtered = tickets.filter((ticket) => ticket.quadrant === quadrant);

    // プロジェクトフィルタ
    if (filterState.projectKeys.length > 0) {
      filtered = filtered.filter((ticket) =>
        filterState.projectKeys.includes(ticket.project.key)
      );
    }

    // 担当者フィルタ
    if (filterState.assigneeAccountId) {
      filtered = filtered.filter(
        (ticket) => ticket.assignee?.accountId === filterState.assigneeAccountId
      );
    }

    // 完了非表示フィルタ
    if (filterState.hideDone) {
      filtered = filtered.filter((ticket) => ticket.status.categoryKey !== 'done');
    }

    // テキスト検索
    if (filterState.searchText.trim() !== '') {
      const searchLower = filterState.searchText.toLowerCase();
      filtered = filtered.filter(
        (ticket) =>
          ticket.key.toLowerCase().includes(searchLower) ||
          ticket.summary.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  },

  setLoading: (isLoading: boolean): void => {
    set({ isLoading });
  },

  setError: (error: string | null): void => {
    set({ error });
  },

  fetchProjects: async (): Promise<void> => {
    try {
      const response = await api.fetchProjects();
      set({ projects: response.data });
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      toast.error('プロジェクト一覧の取得に失敗しました');
    }
  },

  fetchSprints: async (boardId: number): Promise<void> => {
    try {
      const response = await api.fetchSprints(boardId);
      set({ sprints: response.data });
    } catch (error) {
      console.error('Failed to fetch sprints:', error);
      toast.error('スプリント一覧の取得に失敗しました');
    }
  },

  fetchCurrentUser: async (): Promise<void> => {
    try {
      const response = await api.fetchMyself();
      set({ currentUser: response.data });
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      toast.error('ユーザー情報の取得に失敗しました');
    }
  },

  checkAuth: async (): Promise<void> => {
    try {
      const response = await api.checkAuthStatus();
      set({ isAuthenticated: response.authenticated });
    } catch (error) {
      console.error('Failed to check auth status:', error);
      set({ isAuthenticated: false });
    }
  },

  logout: async (): Promise<void> => {
    try {
      await api.logout();
      set({
        isAuthenticated: false,
        currentUser: null,
        tickets: [],
        projects: [],
        sprints: [],
      });
      toast.success('ログアウトしました');
      window.location.reload();
    } catch (error) {
      console.error('Failed to logout:', error);
      toast.error('ログアウトに失敗しました');
    }
  },
}));
