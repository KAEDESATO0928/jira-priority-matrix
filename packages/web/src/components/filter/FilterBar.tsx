import { ProjectFilter } from './ProjectFilter';
import { AssigneeFilter } from './AssigneeFilter';
import { SprintFilter } from './SprintFilter';
import { SearchInput } from './SearchInput';
import { useMatrixStore } from '../../stores/matrixStore';

/**
 * フィルタバーコンポーネント
 */
export function FilterBar(): React.ReactElement {
  const filterState = useMatrixStore((state) => state.filterState);
  const updateFilter = useMatrixStore((state) => state.updateFilter);

  const handleHideDoneToggle = (): void => {
    updateFilter({ hideDone: !filterState.hideDone });
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center gap-3 flex-wrap">
        {/* プロジェクトフィルタ */}
        <ProjectFilter />

        {/* 担当者フィルタ（自分のみ） */}
        <AssigneeFilter />

        {/* スプリントフィルタ */}
        <SprintFilter />

        {/* 完了を非表示トグル */}
        <button
          onClick={handleHideDoneToggle}
          className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
            filterState.hideDone
              ? 'text-white bg-green-600 hover:bg-green-700'
              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
          }`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>完了を非表示</span>
        </button>

        {/* テキスト検索 */}
        <SearchInput />
      </div>
    </div>
  );
}
