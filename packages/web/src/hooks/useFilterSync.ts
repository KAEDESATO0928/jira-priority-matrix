import { useEffect } from 'react';
import { useMatrixStore } from '../stores/matrixStore';

/**
 * フィルタ状態とURLクエリパラメータを同期するカスタムフック
 */
export function useFilterSync(): void {
  const filterState = useMatrixStore((state) => state.filterState);
  const updateFilter = useMatrixStore((state) => state.updateFilter);

  // 初回マウント時にURLパラメータからフィルタを復元
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const projectKeys = params.get('projects')?.split(',').filter(Boolean) || [];
    const onlyMe = params.get('onlyMe') === 'true';
    const sprintId = params.get('sprint') ? parseInt(params.get('sprint')!, 10) : null;
    const hideDone = params.get('hideDone') !== 'false'; // デフォルトtrue
    const searchText = params.get('q') || '';

    updateFilter({
      projectKeys,
      onlyMe,
      sprintId,
      hideDone,
      searchText,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // フィルタ変更時にURLパラメータを更新
  useEffect(() => {
    const params = new URLSearchParams();

    if (filterState.projectKeys.length > 0) {
      params.set('projects', filterState.projectKeys.join(','));
    }

    if (filterState.onlyMe) {
      params.set('onlyMe', 'true');
    }

    if (filterState.sprintId !== null) {
      params.set('sprint', filterState.sprintId.toString());
    }

    if (!filterState.hideDone) {
      params.set('hideDone', 'false');
    }

    if (filterState.searchText.trim() !== '') {
      params.set('q', filterState.searchText.trim());
    }

    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : window.location.pathname;

    // URLを更新（リロードなし）
    window.history.replaceState({}, '', newUrl);
  }, [filterState]);
}
