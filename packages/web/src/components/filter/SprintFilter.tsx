import { useState, useRef, useEffect } from 'react';
import { useMatrixStore } from '../../stores/matrixStore';

/**
 * スプリントフィルタコンポーネント
 */
export function SprintFilter(): React.ReactElement {
  const sprints = useMatrixStore((state) => state.sprints);
  const filterState = useMatrixStore((state) => state.filterState);
  const updateFilter = useMatrixStore((state) => state.updateFilter);

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return (): void => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (sprintId: number | null): void => {
    updateFilter({ sprintId });
    setIsOpen(false);
  };

  const selectedSprint = sprints.find((s) => s.id === filterState.sprintId);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={(): void => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-150 min-w-[140px] justify-between"
      >
        <span className="truncate">
          {selectedSprint ? selectedSprint.name : 'スプリント'}
        </span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {sprints.length > 0 ? (
            <div className="py-2">
              {/* すべて表示オプション */}
              <button
                onClick={(): void => handleSelect(null)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                  filterState.sprintId === null ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                }`}
              >
                すべて表示
              </button>

              {/* スプリントリスト */}
              {sprints.map((sprint) => (
                <button
                  key={sprint.id}
                  onClick={(): void => handleSelect(sprint.id)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${
                    filterState.sprintId === sprint.id
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700'
                  }`}
                >
                  <span className="truncate">{sprint.name}</span>
                  {sprint.state === 'active' && (
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                      アクティブ
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              スプリントがありません
            </div>
          )}
        </div>
      )}
    </div>
  );
}
