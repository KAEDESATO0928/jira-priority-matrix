import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { MatrixBoard } from './components/matrix/MatrixBoard';
import { AppLayout } from './components/layout/AppLayout';
import { ErrorFallback } from './components/error/ErrorFallback';
import { QuadrantPanelSkeleton } from './components/matrix/QuadrantPanelSkeleton';
import { useMatrixStore } from './stores/matrixStore';
import { useFilterSync } from './hooks/useFilterSync';

/**
 * Appコンポーネント
 */
export function App(): React.ReactElement {
  const isAuthenticated = useMatrixStore((state) => state.isAuthenticated);
  const checkAuth = useMatrixStore((state) => state.checkAuth);
  const fetchCurrentUser = useMatrixStore((state) => state.fetchCurrentUser);
  const fetchProjects = useMatrixStore((state) => state.fetchProjects);
  const fetchTickets = useMatrixStore((state) => state.fetchTickets);
  const isLoading = useMatrixStore((state) => state.isLoading);
  const error = useMatrixStore((state) => state.error);

  const [isInitializing, setIsInitializing] = useState(true);

  // フィルタとURLクエリパラメータを同期
  useFilterSync();

  // 初回マウント時に認証チェック + データ取得
  useEffect(() => {
    const initialize = async (): Promise<void> => {
      await checkAuth();
      const authStatus = useMatrixStore.getState().isAuthenticated;

      if (authStatus) {
        await Promise.all([
          fetchCurrentUser(),
          fetchProjects(),
          fetchTickets(),
        ]);
      }

      setIsInitializing(false);
    };

    void initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // フィルタ変更時にチケットを再取得
  const filterState = useMatrixStore((state) => state.filterState);
  useEffect(() => {
    if (isAuthenticated && !isInitializing) {
      void fetchTickets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filterState.projectKeys,
    filterState.assigneeAccountId,
    filterState.onlyMe,
    filterState.sprintId,
    filterState.hideDone,
    filterState.searchText,
  ]);

  // 初期化中
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">読み込み中...</p>
        </div>
      </div>
    );
  }

  // 未認証
  if (!isAuthenticated) {
    const handleLogin = (): void => {
      const bffUrl = import.meta.env.VITE_BFF_URL || 'http://localhost:3001';
      window.location.href = `${bffUrl}/auth/login`;
    };

    return (
      <div className="flex items-center justify-center w-screen h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-xl">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-white font-bold text-3xl">J</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Jira Priority Matrix
          </h1>
          <p className="text-gray-600 mb-8">
            ログインが必要です
          </p>
          <button
            onClick={handleLogin}
            className="w-full px-6 py-3 text-white font-medium bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-150"
          >
            Atlassian でログイン
          </button>
        </div>
      </div>
    );
  }

  // 認証済み - メインUI表示
  return (
    <>
      <AppLayout>
        {error ? (
          <ErrorFallback error={error} onRetry={(): void => void fetchTickets()} />
        ) : isLoading ? (
          <div className="w-full h-full p-8">
            <div className="grid grid-cols-2 gap-6">
              <QuadrantPanelSkeleton colorClass="border-red-500" label="Q1: Do First" />
              <QuadrantPanelSkeleton colorClass="border-green-500" label="Q2: Schedule" />
              <QuadrantPanelSkeleton colorClass="border-yellow-500" label="Q3: Delegate" />
              <QuadrantPanelSkeleton colorClass="border-gray-500" label="Q4: Eliminate" />
            </div>
          </div>
        ) : (
          <MatrixBoard />
        )}
      </AppLayout>

      {/* トースト通知 */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}
