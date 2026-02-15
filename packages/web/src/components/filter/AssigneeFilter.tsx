import { useMatrixStore } from '../../stores/matrixStore';

/**
 * 担当者フィルタコンポーネント（自分のみトグル）
 */
export function AssigneeFilter(): React.ReactElement {
  const filterState = useMatrixStore((state) => state.filterState);
  const currentUser = useMatrixStore((state) => state.currentUser);
  const updateFilter = useMatrixStore((state) => state.updateFilter);

  const handleToggle = (): void => {
    if (filterState.onlyMe) {
      // OFFにする
      updateFilter({ onlyMe: false, assigneeAccountId: null });
    } else {
      // ONにする
      if (currentUser) {
        updateFilter({ onlyMe: true, assigneeAccountId: currentUser.accountId });
      }
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
        filterState.onlyMe
          ? 'text-white bg-blue-600 hover:bg-blue-700'
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
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
      <span>自分のみ</span>
    </button>
  );
}
