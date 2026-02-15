import { TicketCardSkeleton } from '../ticket/TicketCardSkeleton';

export interface QuadrantPanelSkeletonProps {
  /** 象限の色クラス（border色） */
  colorClass: string;
  /** 象限ラベル */
  label: string;
}

/**
 * QuadrantPanel のスケルトンプレースホルダー
 * ローディング中に表示する
 */
export function QuadrantPanelSkeleton({ colorClass, label }: QuadrantPanelSkeletonProps): React.ReactElement {
  return (
    <div
      className={`border-4 ${colorClass} border-opacity-50 rounded-lg p-4 bg-white/50 backdrop-blur-sm min-h-[300px] flex flex-col`}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">{label}</h3>
        <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-200 text-gray-400 rounded-full text-sm font-semibold">
          ...
        </span>
      </div>

      {/* スケルトンカード3枚 */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        <TicketCardSkeleton />
        <TicketCardSkeleton />
        <TicketCardSkeleton />
      </div>
    </div>
  );
}
