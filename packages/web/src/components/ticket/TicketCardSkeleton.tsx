/**
 * TicketCard のスケルトンプレースホルダー
 * ローディング中に表示する
 */
export function TicketCardSkeleton(): React.ReactElement {
  return (
    <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-md animate-pulse">
      {/* ヘッダー部分 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {/* プロジェクトアバター */}
          <div className="w-5 h-5 bg-gray-300 rounded" />
          {/* プロジェクトキーバッジ */}
          <div className="w-12 h-4 bg-gray-300 rounded" />
          {/* チケット番号 */}
          <div className="w-8 h-4 bg-gray-300 rounded" />
        </div>
        {/* ステータスドット */}
        <div className="w-2 h-2 bg-gray-300 rounded-full" />
      </div>

      {/* タイトル部分（2行） */}
      <div className="mb-2 space-y-2">
        <div className="w-full h-4 bg-gray-300 rounded" />
        <div className="w-3/4 h-4 bg-gray-300 rounded" />
      </div>

      {/* 担当者部分 */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 bg-gray-300 rounded-full" />
        <div className="w-20 h-3 bg-gray-300 rounded" />
      </div>

      {/* 課題タイプ部分 */}
      <div className="mt-2">
        <div className="w-16 h-5 bg-gray-300 rounded" />
      </div>
    </div>
  );
}
