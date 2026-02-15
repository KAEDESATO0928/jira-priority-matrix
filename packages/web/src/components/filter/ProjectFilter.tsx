import { useState, useRef, useEffect } from 'react';
import { useMatrixStore } from '../../stores/matrixStore';

/**
 * プロジェクトフィルタコンポーネント（複数選択）
 */
export function ProjectFilter(): React.ReactElement {
  const projects = useMatrixStore((state) => state.projects);
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

  const handleToggle = (projectKey: string): void => {
    const newKeys = filterState.projectKeys.includes(projectKey)
      ? filterState.projectKeys.filter((k) => k !== projectKey)
      : [...filterState.projectKeys, projectKey];

    updateFilter({ projectKeys: newKeys });
  };

  const selectedCount = filterState.projectKeys.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={(): void => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-150"
      >
        <span>プロジェクト</span>
        {selectedCount > 0 && (
          <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white bg-blue-600 rounded-full">
            {selectedCount}
          </span>
        )}
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
          {projects.length > 0 ? (
            <div className="py-2">
              {projects.map((project) => (
                <label
                  key={project.key}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filterState.projectKeys.includes(project.key)}
                    onChange={(): void => handleToggle(project.key)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <img
                    src={project.avatarUrl}
                    alt={project.key}
                    className="w-5 h-5 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {project.name}
                    </div>
                    <div className="text-xs text-gray-500">{project.key}</div>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              プロジェクトがありません
            </div>
          )}
        </div>
      )}
    </div>
  );
}
