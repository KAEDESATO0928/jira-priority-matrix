import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { Quadrant, PriorityLevel, type Ticket } from '@jira-priority-matrix/shared';
import { QuadrantPanel } from './QuadrantPanel';
import { UncategorizedArea } from './UncategorizedArea';
import { TicketCard } from '../ticket/TicketCard';
import { useMatrixStore } from '../../stores/matrixStore';

/**
 * 未分類通知バナーコンポーネント
 */
function UncategorizedBanner({ count, onClose }: { count: number; onClose: () => void }): React.ReactElement {
  return (
    <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <svg
          className="w-6 h-6 text-amber-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div>
          <p className="text-amber-800 font-medium">
            未分類のチケットが{count}件あります
          </p>
          <p className="text-amber-700 text-sm">
            下にスクロールして象限にドラッグしてください
          </p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="text-amber-600 hover:text-amber-800 transition-colors"
        aria-label="通知を閉じる"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

/**
 * 象限から重要度・緊急度を決定
 */
function getImportanceUrgencyFromQuadrant(quadrant: Quadrant): {
  importance: PriorityLevel;
  urgency: PriorityLevel;
} | null {
  switch (quadrant) {
    case Quadrant.DO_FIRST:
      return { importance: PriorityLevel.HIGH, urgency: PriorityLevel.HIGH };
    case Quadrant.SCHEDULE:
      return { importance: PriorityLevel.HIGH, urgency: PriorityLevel.LOW };
    case Quadrant.DELEGATE:
      return { importance: PriorityLevel.LOW, urgency: PriorityLevel.HIGH };
    case Quadrant.ELIMINATE:
      return { importance: PriorityLevel.LOW, urgency: PriorityLevel.LOW };
    default:
      return null;
  }
}

/**
 * マトリクスボードコンポーネント
 * 2x2のアイゼンハワーマトリクスと未分類エリアを表示（D&D対応）
 *
 * レイアウト（画像準拠）:
 *         緊急ではない    ←  緊急度  →    緊急！
 *  重要     [B: Schedule]     [A: Do First]
 *    ↑
 *  重要度
 *    ↓
 *  重要ではない [D: Eliminate]     [C: Delegate]
 */
export function MatrixBoard(): React.ReactElement {
  const moveTicket = useMatrixStore((state) => state.moveTicket);
  const getTicketsByQuadrant = useMatrixStore((state) => state.getTicketsByQuadrant);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [showUncategorizedBanner, setShowUncategorizedBanner] = useState(true);

  const uncategorizedTickets = getTicketsByQuadrant(Quadrant.UNCATEGORIZED);
  const hasUncategorized = uncategorizedTickets.length > 0;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent): void => {
    const ticket = event.active.data.current?.ticket as Ticket | undefined;
    if (ticket) {
      setActiveTicket(ticket);
    }
  };

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;

    if (over && active.data.current?.ticket) {
      const ticket = active.data.current.ticket as Ticket;
      const targetQuadrant = over.data.current?.quadrant as Quadrant | undefined;

      if (targetQuadrant) {
        const priorities = getImportanceUrgencyFromQuadrant(targetQuadrant);
        if (priorities) {
          void moveTicket(ticket.key, priorities.importance, priorities.urgency);
        }
      }
    }

    setActiveTicket(null);
  };

  const handleDragCancel = (): void => {
    setActiveTicket(null);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="w-full h-full p-6">
        {/* 未分類通知バナー */}
        {hasUncategorized && showUncategorizedBanner && (
          <UncategorizedBanner
            count={uncategorizedTickets.length}
            onClose={(): void => setShowUncategorizedBanner(false)}
          />
        )}

        {/* マトリクス全体 */}
        <div className="flex gap-0">
          {/* Y軸ラベル（重要度） */}
          <div className="flex flex-col items-center justify-center w-12 shrink-0 mr-1">
            <span className="text-sm font-bold text-gray-700 mb-2">重要</span>
            <div className="flex-1 relative w-0.5 bg-gray-300">
              {/* 上向き矢印 */}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[8px] border-b-gray-400" />
              {/* 下向き矢印 */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[8px] border-t-gray-400" />
            </div>
            <span className="text-xs font-bold text-gray-400 mt-2 text-center leading-tight">重要<br />ではない</span>
          </div>

          {/* メインコンテンツ */}
          <div className="flex-1 flex flex-col gap-0">
            {/* X軸ラベル（緊急度） */}
            <div className="flex items-center mb-1 px-1">
              <span className="text-xs font-bold text-gray-400">緊急ではない</span>
              <div className="flex-1 relative h-0.5 bg-gray-300 mx-3">
                {/* 左向き矢印 */}
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[8px] border-r-gray-400" />
                {/* 右向き矢印 */}
                <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-gray-400" />
              </div>
              <span className="text-sm font-bold text-gray-700">緊急！</span>
            </div>

            {/* 2x2 マトリクスグリッド */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {/* 左上: B - Schedule (重要 × 緊急ではない) */}
              <QuadrantPanel
                quadrant={Quadrant.SCHEDULE}
                letter="B"
                description="緊急ではないが重要"
                bgClass="bg-blue-100/80"
                bgHoverClass="bg-blue-200"
                textClass="text-blue-800"
              />

              {/* 右上: A - Do First (重要 × 緊急) */}
              <QuadrantPanel
                quadrant={Quadrant.DO_FIRST}
                letter="A"
                description="重要かつ緊急"
                bgClass="bg-red-100/80"
                bgHoverClass="bg-red-200"
                textClass="text-red-800"
              />

              {/* 左下: D - Eliminate (重要ではない × 緊急ではない) */}
              <QuadrantPanel
                quadrant={Quadrant.ELIMINATE}
                letter="D"
                description="重要でも緊急でもない"
                bgClass="bg-gray-100/80"
                bgHoverClass="bg-gray-200"
                textClass="text-gray-600"
              />

              {/* 右下: C - Delegate (重要ではない × 緊急) */}
              <QuadrantPanel
                quadrant={Quadrant.DELEGATE}
                letter="C"
                description="重要ではないが緊急"
                bgClass="bg-yellow-100/80"
                bgHoverClass="bg-yellow-200"
                textClass="text-yellow-800"
              />
            </div>
          </div>
        </div>

        {/* 未分類エリア */}
        <UncategorizedArea />
      </div>

      {/* DragOverlay: ドラッグ中のカード表示 */}
      <DragOverlay>
        {activeTicket ? <TicketCard ticket={activeTicket} isDragOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
