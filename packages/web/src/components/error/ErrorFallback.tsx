export interface ErrorFallbackProps {
  /** エラーメッセージ */
  error: string;
  /** 再試行ボタンのクリックハンドラ */
  onRetry: () => void;
}

/**
 * エラー表示フォールバックコンポーネント
 * Jira API障害時などに表示
 */
export function ErrorFallback({ error, onRetry }: ErrorFallbackProps): React.ReactElement {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-lg">
        {/* エラーアイコン */}
        <div className="text-red-500 mb-4">
          <svg
            className="w-16 h-16 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* エラーメッセージ */}
        <h2 className="text-xl font-bold text-gray-900 mb-2">エラーが発生しました</h2>
        <p className="text-gray-600 mb-6">{error}</p>

        {/* アクション */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onRetry}
            className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-150"
          >
            再試行
          </button>
          <a
            href="https://status.atlassian.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-150"
          >
            Jiraのステータスを確認
          </a>
        </div>
      </div>
    </div>
  );
}
