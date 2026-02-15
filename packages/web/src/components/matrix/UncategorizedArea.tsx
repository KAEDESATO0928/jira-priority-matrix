import { useDroppable } from '@dnd-kit/core';
import { Quadrant } from '@jira-priority-matrix/shared';
import { useMatrixStore } from '../../stores/matrixStore';
import { TicketCard } from '../ticket/TicketCard';

/**
 * 未分類エリアコンポーネント（ドロップゾーン）
 */
export function UncategorizedArea(): React.ReactElement | null {
  // tickets の変更を検知してリレンダーをトリガー
  useMatrixStore((state) => state.tickets);
  const getTicketsByQuadrant = useMatrixStore((state) => state.getTicketsByQuadrant);
  const uncategorizedTickets = getTicketsByQuadrant(Quadrant.UNCATEGORIZED);

  const { setNodeRef, isOver } = useDroppable({
    id: Quadrant.UNCATEGORIZED,
    data: { quadrant: Quadrant.UNCATEGORIZED },
  });

  if (uncategorizedTickets.length === 0) {
    return null;
  }

  return (
    <div
      ref={setNodeRef}
      className={`border-4 border-blue-500 rounded-lg p-4 bg-white/50 backdrop-blur-sm transition-all duration-200 ${
        isOver ? 'bg-white/80 border-opacity-100 shadow-lg' : 'border-opacity-50'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">未分類 (Uncategorized)</h3>
        <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
          {uncategorizedTickets.length}
        </span>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {uncategorizedTickets.map((ticket) => (
          <div key={ticket.key} className="min-w-[220px] max-w-[280px] flex-shrink-0">
            <TicketCard ticket={ticket} />
          </div>
        ))}
      </div>
    </div>
  );
}
