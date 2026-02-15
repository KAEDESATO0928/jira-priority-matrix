import { useMatrixStore } from '../../stores/matrixStore';

/**
 * アプリケーションヘッダーコンポーネント
 */
export function AppHeader(): React.ReactElement {
  const currentUser = useMatrixStore((state) => state.currentUser);
  const logout = useMatrixStore((state) => state.logout);
  const fetchTickets = useMatrixStore((state) => state.fetchTickets);

  const handleRefresh = (): void => {
    void fetchTickets();
  };

  const handleLogout = (): void => {
    void logout();
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* 左側: ロゴとアプリ名 */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">J</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Jira Priority Matrix</h1>
            <p className="text-xs text-gray-500">重要度 × 緊急度でタスクを可視化</p>
          </div>
        </div>

        {/* 右側: リフレッシュボタン + ユーザー情報 + ログアウト */}
        <div className="flex items-center gap-4">
          {/* リフレッシュボタン */}
          <button
            onClick={handleRefresh}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-150"
            aria-label="チケットを再読込"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>

          {currentUser && (
            <>
              {/* ユーザーアバター + 名前 */}
              <div className="flex items-center gap-2">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm font-medium text-gray-700">
                  {currentUser.displayName}
                </span>
              </div>

              {/* ログアウトボタン */}
              <button
                onClick={handleLogout}
                className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-150"
              >
                ログアウト
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
