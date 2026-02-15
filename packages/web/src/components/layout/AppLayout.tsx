import { AppHeader } from './AppHeader';
import { FilterBar } from '../filter/FilterBar';
import { NetworkStatusBanner } from '../error/NetworkStatusBanner';

export interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * アプリケーション全体のレイアウトコンポーネント
 */
export function AppLayout({ children }: AppLayoutProps): React.ReactElement {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {/* ネットワークステータスバナー */}
      <NetworkStatusBanner />

      {/* ヘッダー */}
      <AppHeader />

      {/* フィルタバー */}
      <FilterBar />

      {/* メインコンテンツエリア */}
      <main className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-gray-100">
        {children}
      </main>
    </div>
  );
}
