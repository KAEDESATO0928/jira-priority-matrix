import type {
  Ticket,
  Project,
  Sprint,
  FilterState,
  ApiResponse,
  MoveTicketRequest,
} from '@jira-priority-matrix/shared';

/**
 * BFF API Base URL
 */
const BFF_URL = import.meta.env.VITE_BFF_URL || 'http://localhost:3001';

/**
 * 共通のfetch関数
 */
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BFF_URL}${path}`, {
    ...options,
    credentials: 'include',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  // 認証エラーの場合はログイン画面へリダイレクト
  if (res.status === 401) {
    window.location.href = `${BFF_URL}/auth/login`;
    throw new Error('認証エラー');
  }

  if (!res.ok) {
    let errorMessage = 'APIエラーが発生しました';
    try {
      const errorBody = await res.json();
      if (errorBody?.error?.message) {
        errorMessage = errorBody.error.message;
      }
    } catch {
      // JSON解析失敗時はデフォルトメッセージを使用
    }
    throw new Error(errorMessage);
  }

  return res.json() as Promise<T>;
}

/**
 * フィルタパラメータをクエリ文字列に変換
 */
function buildTicketQueryParams(filter: FilterState): string {
  const params = new URLSearchParams();

  if (filter.projectKeys.length > 0) {
    params.append('projectKeys', filter.projectKeys.join(','));
  }

  if (filter.assigneeAccountId) {
    params.append('assigneeAccountId', filter.assigneeAccountId);
  }

  if (filter.onlyMe) {
    params.append('onlyMe', 'true');
  }

  if (filter.sprintId !== null) {
    params.append('sprintId', filter.sprintId.toString());
  }

  if (filter.hideDone) {
    params.append('hideDone', 'true');
  }

  if (filter.searchText.trim() !== '') {
    params.append('searchText', filter.searchText.trim());
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * チケット一覧を取得
 */
export async function fetchTickets(filter: FilterState): Promise<ApiResponse<Ticket[]>> {
  const queryParams = buildTicketQueryParams(filter);
  return apiFetch<ApiResponse<Ticket[]>>(`/api/tickets${queryParams}`);
}

/**
 * チケットを移動（重要度・緊急度を更新）
 */
export async function moveTicket(key: string, req: MoveTicketRequest): Promise<void> {
  await apiFetch<void>(`/api/tickets/${key}`, {
    method: 'PUT',
    body: JSON.stringify(req),
  });
}

/**
 * プロジェクト一覧を取得
 */
export async function fetchProjects(): Promise<ApiResponse<Project[]>> {
  return apiFetch<ApiResponse<Project[]>>('/api/projects');
}

/**
 * スプリント一覧を取得
 */
export async function fetchSprints(boardId: number): Promise<ApiResponse<Sprint[]>> {
  return apiFetch<ApiResponse<Sprint[]>>(`/api/sprints/${boardId}`);
}

/**
 * 現在のユーザー情報を取得
 */
export async function fetchMyself(): Promise<{
  data: { accountId: string; displayName: string; avatarUrl: string };
}> {
  return apiFetch<{
    data: { accountId: string; displayName: string; avatarUrl: string };
  }>('/api/myself');
}

/**
 * 認証状態をチェック
 */
export async function checkAuthStatus(): Promise<{ authenticated: boolean }> {
  return apiFetch<{ authenticated: boolean }>('/auth/status');
}

/**
 * ログアウト
 */
export async function logout(): Promise<void> {
  await apiFetch<void>('/auth/logout', {
    method: 'POST',
  });
}
