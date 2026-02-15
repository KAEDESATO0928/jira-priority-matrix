import { useDroppable } from '@dnd-kit/core';
import type { Quadrant } from '@jira-priority-matrix/shared';
import { TicketCard } from '../ticket/TicketCard';
import { useMatrixStore } from '../../stores/matrixStore';

export interface QuadrantPanelProps {
  quadrant: Quadrant;
  /** 大文字ラベル（A, B, C, D） */
  letter: string;
  /** 日本語の説明テキスト */
  description: string;
  /** 背景色クラス */
  bgClass: string;
  /** ドラッグオーバー時の背景色クラス */
  bgHoverClass: string;
  /** テキスト色クラス */
  textClass: string;
}

/**
 * 象限パネルコンポーネント（ドロップゾーン）
 */
export function QuadrantPanel({
  quadrant,
  letter,
  description,
  bgClass,
  bgHoverClass,
  textClass,
}: QuadrantPanelProps): React.ReactElement {
  // tickets の変更を検知してリレンダーをトリガーするためにサブスクライブ
  useMatrixStore((state) => state.tickets);
  const getTicketsByQuadrant = useMatrixStore((state) => state.getTicketsByQuadrant);
  const tickets = getTicketsByQuadrant(quadrant);

  const { setNodeRef, isOver } = useDroppable({
    id: quadrant,
    data: { quadrant },
  });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg p-4 min-h-[300px] flex flex-col transition-all duration-200 ${
        isOver ? `${bgHoverClass} shadow-lg ring-2 ring-offset-2 ring-gray-400` : bgClass
      }`}
    >
      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className={`text-3xl font-black ${textClass}`}>{letter}</span>
          <p className={`text-sm font-semibold mt-1 ${textClass}`}>{description}</p>
        </div>
        <span className="inline-flex items-center justify-center w-7 h-7 bg-white/60 text-gray-700 rounded-full text-xs font-bold">
          {tickets.length}
        </span>
      </div>

      {/* チケットカード一覧 */}
      <div className="flex-1 space-y-2 overflow-y-auto">
        {tickets.length > 0 ? (
          tickets.map((ticket) => <TicketCard key={ticket.key} ticket={ticket} />)
        ) : (
          <div className="text-center text-gray-400 text-sm italic py-8">
            ここにドラッグ
          </div>
        )}
      </div>
    </div>
  );
}
