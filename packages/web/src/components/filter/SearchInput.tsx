import { useState, useEffect } from 'react';
import { useMatrixStore } from '../../stores/matrixStore';

/**
 * テキスト検索入力コンポーネント（debounce付き）
 */
export function SearchInput(): React.ReactElement {
  const filterState = useMatrixStore((state) => state.filterState);
  const updateFilter = useMatrixStore((state) => state.updateFilter);

  const [inputValue, setInputValue] = useState(filterState.searchText);
  const [isDebouncing, setIsDebouncing] = useState(false);

  // フィルタ状態が外部から変更された場合に同期
  useEffect(() => {
    setInputValue(filterState.searchText);
  }, [filterState.searchText]);

  // debounce処理
  useEffect(() => {
    if (inputValue !== filterState.searchText) {
      setIsDebouncing(true);
      const timer = setTimeout(() => {
        updateFilter({ searchText: inputValue });
        setIsDebouncing(false);
      }, 300);

      return (): void => {
        clearTimeout(timer);
      };
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue]);

  const handleClear = (): void => {
    setInputValue('');
    updateFilter({ searchText: '' });
  };

  return (
    <div className="relative flex-1 max-w-md">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={(e): void => setInputValue(e.target.value)}
          placeholder="チケットキー・タイトルで検索..."
          className="w-full pl-10 pr-10 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {/* クリアボタンまたはローディングスピナー */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {isDebouncing ? (
            <svg
              className="w-4 h-4 text-gray-400 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            inputValue && (
              <button
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600"
                aria-label="検索をクリア"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
