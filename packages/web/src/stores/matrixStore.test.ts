/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useMatrixStore } from './matrixStore';
import * as api from '../services/apiClient';
import toast from 'react-hot-toast';
import {
  Quadrant,
  PriorityLevel,
  type Ticket,
} from '@jira-priority-matrix/shared';

// モック
vi.mock('../services/apiClient');
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

/** テスト用モックチケットを生成 */
function createMockTicket(overrides?: Partial<Ticket>): Ticket {
  return {
    key: 'TEST-1',
    summary: 'Test Ticket',
    status: {
      name: 'To Do',
      categoryKey: 'new',
    },
    assignee: {
      displayName: 'Test User',
      avatarUrl: 'https://example.com/avatar.png',
      accountId: 'user-123',
    },
    project: {
      key: 'TEST',
      name: 'Test Project',
      avatarUrl: 'https://example.com/project.png',
    },
    importance: PriorityLevel.HIGH,
    urgency: PriorityLevel.HIGH,
    quadrant: Quadrant.DO_FIRST,
    issueType: 'Task',
    url: 'https://example.atlassian.net/browse/TEST-1',
    ...overrides,
  };
}

describe('matrixStore', () => {
  beforeEach(() => {
    // ストアをリセット
    useMatrixStore.setState({
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
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('初期状態', () => {
    it('初期状態が正しく設定されている', () => {
      const state = useMatrixStore.getState();
      expect(state.tickets).toEqual([]);
      expect(state.filterState.projectKeys).toEqual([]);
      expect(state.filterState.hideDone).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.currentUser).toBeNull();
    });
  });

  describe('setTickets', () => {
    it('ticketsを更新する', () => {
      const mockTicket = createMockTicket();
      useMatrixStore.getState().setTickets([mockTicket]);

      const state = useMatrixStore.getState();
      expect(state.tickets).toHaveLength(1);
      expect(state.tickets[0]?.key).toBe('TEST-1');
    });

    it('エラーをクリアする', () => {
      useMatrixStore.setState({ error: 'エラーメッセージ' });
      useMatrixStore.getState().setTickets([]);

      const state = useMatrixStore.getState();
      expect(state.error).toBeNull();
    });
  });

  describe('fetchTickets', () => {
    it('API成功時にticketsを更新し、isLoadingをfalseにする', async () => {
      const mockTicket = createMockTicket();
      vi.mocked(api.fetchTickets).mockResolvedValue({
        data: [mockTicket],
        meta: { total: 1, startAt: 0, maxResults: 100 },
      });

      await useMatrixStore.getState().fetchTickets();

      const state = useMatrixStore.getState();
      expect(state.tickets).toHaveLength(1);
      expect(state.tickets[0]?.key).toBe('TEST-1');
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('API呼び出し中はisLoadingがtrueになる', async () => {
      vi.mocked(api.fetchTickets).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                data: [],
                meta: { total: 0, startAt: 0, maxResults: 100 },
              });
            }, 50);
          })
      );

      const fetchPromise = useMatrixStore.getState().fetchTickets();

      // 即座にローディング状態を確認
      expect(useMatrixStore.getState().isLoading).toBe(true);

      await fetchPromise;
      expect(useMatrixStore.getState().isLoading).toBe(false);
    });

    it('API失敗時にerrorを設定し、toastを表示する', async () => {
      const errorMessage = 'チケットの取得に失敗しました';
      vi.mocked(api.fetchTickets).mockRejectedValue(new Error(errorMessage));

      await useMatrixStore.getState().fetchTickets();

      const state = useMatrixStore.getState();
      expect(state.error).toBe(errorMessage);
      expect(state.isLoading).toBe(false);
      expect(toast.error).toHaveBeenCalledWith(errorMessage);
    });
  });

  describe('moveTicket', () => {
    it('Optimistic Update: UIを即座に更新する', async () => {
      const mockTicket = createMockTicket({
        key: 'TEST-1',
        importance: PriorityLevel.HIGH,
        urgency: PriorityLevel.HIGH,
        quadrant: Quadrant.DO_FIRST,
      });

      useMatrixStore.setState({ tickets: [mockTicket] });

      // APIは遅延させる
      vi.mocked(api.moveTicket).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const movePromise = useMatrixStore
        .getState()
        .moveTicket('TEST-1', PriorityLevel.LOW, PriorityLevel.LOW);

      // API完了前にチケットが更新されているか確認
      const stateBeforeAPI = useMatrixStore.getState();
      expect(stateBeforeAPI.tickets[0]?.importance).toBe(PriorityLevel.LOW);
      expect(stateBeforeAPI.tickets[0]?.urgency).toBe(PriorityLevel.LOW);
      expect(stateBeforeAPI.tickets[0]?.quadrant).toBe(Quadrant.ELIMINATE);

      await movePromise;
    });

    it('API成功時にtoastを表示する', async () => {
      const mockTicket = createMockTicket();
      useMatrixStore.setState({ tickets: [mockTicket] });

      vi.mocked(api.moveTicket).mockResolvedValue(undefined);

      await useMatrixStore
        .getState()
        .moveTicket('TEST-1', PriorityLevel.LOW, PriorityLevel.LOW);

      expect(toast.success).toHaveBeenCalledWith('TEST-1 を移動しました');
    });

    it('API失敗時に元のticketsにロールバックする', async () => {
      const originalTicket = createMockTicket({
        key: 'TEST-1',
        importance: PriorityLevel.HIGH,
        urgency: PriorityLevel.HIGH,
        quadrant: Quadrant.DO_FIRST,
      });

      useMatrixStore.setState({ tickets: [originalTicket] });

      vi.mocked(api.moveTicket).mockRejectedValue(new Error('API Error'));

      await useMatrixStore
        .getState()
        .moveTicket('TEST-1', PriorityLevel.LOW, PriorityLevel.LOW);

      // ロールバック後、元の値に戻っているか確認
      const state = useMatrixStore.getState();
      expect(state.tickets[0]?.importance).toBe(PriorityLevel.HIGH);
      expect(state.tickets[0]?.urgency).toBe(PriorityLevel.HIGH);
      expect(state.tickets[0]?.quadrant).toBe(Quadrant.DO_FIRST);

      expect(toast.error).toHaveBeenCalledWith('API Error');
    });

    it('存在しないチケットキーの場合は何もしない', async () => {
      const mockTicket = createMockTicket({ key: 'TEST-1' });
      useMatrixStore.setState({ tickets: [mockTicket] });

      await useMatrixStore
        .getState()
        .moveTicket('TEST-999', PriorityLevel.LOW, PriorityLevel.LOW);

      // APIは呼ばれない
      expect(api.moveTicket).not.toHaveBeenCalled();
    });
  });

  describe('updateFilter', () => {
    it('filterStateを部分更新する', () => {
      useMatrixStore
        .getState()
        .updateFilter({ projectKeys: ['PROJ1', 'PROJ2'] });

      const state = useMatrixStore.getState();
      expect(state.filterState.projectKeys).toEqual(['PROJ1', 'PROJ2']);
      expect(state.filterState.hideDone).toBe(true); // 他の値は維持される
    });

    it('複数のプロパティを同時に更新できる', () => {
      useMatrixStore.getState().updateFilter({
        projectKeys: ['PROJ1'],
        hideDone: false,
        searchText: 'test',
      });

      const state = useMatrixStore.getState();
      expect(state.filterState.projectKeys).toEqual(['PROJ1']);
      expect(state.filterState.hideDone).toBe(false);
      expect(state.filterState.searchText).toBe('test');
    });
  });

  describe('getTicketsByQuadrant', () => {
    const ticketQ1 = createMockTicket({
      key: 'Q1-1',
      importance: PriorityLevel.HIGH,
      urgency: PriorityLevel.HIGH,
      quadrant: Quadrant.DO_FIRST,
    });

    const ticketQ2 = createMockTicket({
      key: 'Q2-1',
      importance: PriorityLevel.HIGH,
      urgency: PriorityLevel.LOW,
      quadrant: Quadrant.SCHEDULE,
    });

    const ticketDone = createMockTicket({
      key: 'DONE-1',
      importance: PriorityLevel.HIGH,
      urgency: PriorityLevel.HIGH,
      quadrant: Quadrant.DO_FIRST,
      status: {
        name: 'Done',
        categoryKey: 'done',
      },
    });

    it('指定した象限のチケットのみを返す', () => {
      useMatrixStore.setState({
        tickets: [ticketQ1, ticketQ2, ticketDone],
      });
      // hideDone: false にして完了チケットも含める
      useMatrixStore.getState().updateFilter({ hideDone: false });

      const q1Tickets = useMatrixStore
        .getState()
        .getTicketsByQuadrant(Quadrant.DO_FIRST);
      expect(q1Tickets).toHaveLength(2);

      const q2Tickets = useMatrixStore
        .getState()
        .getTicketsByQuadrant(Quadrant.SCHEDULE);
      expect(q2Tickets).toHaveLength(1);
      expect(q2Tickets[0]?.key).toBe('Q2-1');
    });

    it('hideDoneがtrueの場合、完了チケットを除外する', () => {
      useMatrixStore.setState({
        tickets: [ticketQ1, ticketDone],
      });
      useMatrixStore.getState().updateFilter({ hideDone: true });

      const q1Tickets = useMatrixStore
        .getState()
        .getTicketsByQuadrant(Quadrant.DO_FIRST);
      expect(q1Tickets).toHaveLength(1);
      expect(q1Tickets[0]?.key).toBe('Q1-1');
    });

    it('hideDoneがfalseの場合、完了チケットも表示する', () => {
      useMatrixStore.setState({
        tickets: [ticketQ1, ticketDone],
      });
      useMatrixStore.getState().updateFilter({ hideDone: false });

      const q1Tickets = useMatrixStore
        .getState()
        .getTicketsByQuadrant(Quadrant.DO_FIRST);
      expect(q1Tickets).toHaveLength(2);
    });

    it('searchTextでチケットキーを検索できる', () => {
      useMatrixStore.setState({
        tickets: [ticketQ1, ticketDone],
      });
      useMatrixStore.getState().updateFilter({
        hideDone: false,
        searchText: 'q1',
      });

      const tickets = useMatrixStore
        .getState()
        .getTicketsByQuadrant(Quadrant.DO_FIRST);
      expect(tickets).toHaveLength(1);
      expect(tickets[0]?.key).toBe('Q1-1');
    });

    it('searchTextでタイトルを検索できる', () => {
      const testTicket = createMockTicket({
        key: 'SEARCH-1',
        summary: 'ログイン機能の実装',
        quadrant: Quadrant.DO_FIRST,
      });

      useMatrixStore.setState({ tickets: [testTicket] });
      useMatrixStore.getState().updateFilter({ searchText: 'ログイン' });

      const tickets = useMatrixStore
        .getState()
        .getTicketsByQuadrant(Quadrant.DO_FIRST);
      expect(tickets).toHaveLength(1);
      expect(tickets[0]?.key).toBe('SEARCH-1');
    });

    it('projectKeysでプロジェクトフィルタできる', () => {
      const projATicket = createMockTicket({
        key: 'PROJA-1',
        project: { key: 'PROJA', name: 'Project A', avatarUrl: '' },
        quadrant: Quadrant.DO_FIRST,
      });

      const projBTicket = createMockTicket({
        key: 'PROJB-1',
        project: { key: 'PROJB', name: 'Project B', avatarUrl: '' },
        quadrant: Quadrant.DO_FIRST,
      });

      useMatrixStore.setState({ tickets: [projATicket, projBTicket] });
      useMatrixStore.getState().updateFilter({ projectKeys: ['PROJA'] });

      const tickets = useMatrixStore
        .getState()
        .getTicketsByQuadrant(Quadrant.DO_FIRST);
      expect(tickets).toHaveLength(1);
      expect(tickets[0]?.key).toBe('PROJA-1');
    });

    it('assigneeAccountIdで担当者フィルタできる', () => {
      const userATicket = createMockTicket({
        key: 'USER-A',
        assignee: {
          displayName: 'User A',
          avatarUrl: '',
          accountId: 'user-a',
        },
        quadrant: Quadrant.DO_FIRST,
      });

      const userBTicket = createMockTicket({
        key: 'USER-B',
        assignee: {
          displayName: 'User B',
          avatarUrl: '',
          accountId: 'user-b',
        },
        quadrant: Quadrant.DO_FIRST,
      });

      useMatrixStore.setState({ tickets: [userATicket, userBTicket] });
      useMatrixStore.getState().updateFilter({ assigneeAccountId: 'user-a' });

      const tickets = useMatrixStore
        .getState()
        .getTicketsByQuadrant(Quadrant.DO_FIRST);
      expect(tickets).toHaveLength(1);
      expect(tickets[0]?.key).toBe('USER-A');
    });

    it('複合フィルタが正しく動作する', () => {
      const targetTicket = createMockTicket({
        key: 'TARGET-1',
        summary: 'ログイン機能',
        project: { key: 'PROJ1', name: 'Project 1', avatarUrl: '' },
        quadrant: Quadrant.DO_FIRST,
        status: { name: 'In Progress', categoryKey: 'indeterminate' },
      });

      const otherTicket = createMockTicket({
        key: 'OTHER-1',
        summary: '別の機能',
        project: { key: 'PROJ2', name: 'Project 2', avatarUrl: '' },
        quadrant: Quadrant.DO_FIRST,
        status: { name: 'Done', categoryKey: 'done' },
      });

      useMatrixStore.setState({ tickets: [targetTicket, otherTicket] });
      useMatrixStore.getState().updateFilter({
        projectKeys: ['PROJ1'],
        hideDone: true,
        searchText: 'ログイン',
      });

      const tickets = useMatrixStore
        .getState()
        .getTicketsByQuadrant(Quadrant.DO_FIRST);
      expect(tickets).toHaveLength(1);
      expect(tickets[0]?.key).toBe('TARGET-1');
    });

    it('マッチするチケットがない場合は空配列を返す', () => {
      useMatrixStore.setState({ tickets: [ticketQ1] });

      const tickets = useMatrixStore
        .getState()
        .getTicketsByQuadrant(Quadrant.ELIMINATE);
      expect(tickets).toEqual([]);
    });
  });

  describe('fetchProjects', () => {
    it('プロジェクト一覧を取得する', async () => {
      const mockProjects = [
        { key: 'PROJ1', name: 'Project 1', avatarUrl: '' },
        { key: 'PROJ2', name: 'Project 2', avatarUrl: '' },
      ];

      vi.mocked(api.fetchProjects).mockResolvedValue({
        data: mockProjects,
      });

      await useMatrixStore.getState().fetchProjects();

      const state = useMatrixStore.getState();
      expect(state.projects).toHaveLength(2);
      expect(state.projects[0]?.key).toBe('PROJ1');
    });

    it('取得失敗時にtoastを表示する', async () => {
      vi.mocked(api.fetchProjects).mockRejectedValue(new Error('Failed'));

      await useMatrixStore.getState().fetchProjects();

      expect(toast.error).toHaveBeenCalledWith(
        'プロジェクト一覧の取得に失敗しました'
      );
    });
  });

  describe('checkAuth', () => {
    it('認証済みの場合、isAuthenticatedをtrueにする', async () => {
      vi.mocked(api.checkAuthStatus).mockResolvedValue({
        authenticated: true,
      });

      await useMatrixStore.getState().checkAuth();

      expect(useMatrixStore.getState().isAuthenticated).toBe(true);
    });

    it('未認証の場合、isAuthenticatedをfalseにする', async () => {
      vi.mocked(api.checkAuthStatus).mockResolvedValue({
        authenticated: false,
      });

      await useMatrixStore.getState().checkAuth();

      expect(useMatrixStore.getState().isAuthenticated).toBe(false);
    });

    it('認証チェック失敗時はfalseにする', async () => {
      vi.mocked(api.checkAuthStatus).mockRejectedValue(new Error('Failed'));

      await useMatrixStore.getState().checkAuth();

      expect(useMatrixStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe('logout', () => {
    it('ログアウト成功時に状態をリセットする', async () => {
      vi.mocked(api.logout).mockResolvedValue(undefined);

      // window.location.reloadをモック
      const reloadMock = vi.fn();
      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        value: { ...originalLocation, reload: reloadMock },
        writable: true,
        configurable: true,
      });

      useMatrixStore.setState({
        isAuthenticated: true,
        currentUser: {
          accountId: 'user-123',
          displayName: 'Test User',
          avatarUrl: '',
        },
        tickets: [createMockTicket()],
      });

      await useMatrixStore.getState().logout();

      const state = useMatrixStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.currentUser).toBeNull();
      expect(state.tickets).toEqual([]);
      expect(toast.success).toHaveBeenCalledWith('ログアウトしました');
    });

    it('ログアウト失敗時にtoastを表示する', async () => {
      vi.mocked(api.logout).mockRejectedValue(new Error('Logout failed'));

      await useMatrixStore.getState().logout();

      expect(toast.error).toHaveBeenCalledWith('ログアウトに失敗しました');
    });
  });
});
