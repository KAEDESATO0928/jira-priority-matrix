import { memo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Ticket } from '@jira-priority-matrix/shared';
import { getProjectColor } from '../../utils/projectColor';

export interface TicketCardProps {
  ticket: Ticket;
  isDragOverlay?: boolean;
}

/**
 * ステータスカテゴリに応じたドットの色を返す
 */
function getStatusDotColor(categoryKey: string): string {
  switch (categoryKey) {
    case 'new':
      return 'bg-gray-400';
    case 'indeterminate':
      return 'bg-blue-500';
    case 'done':
      return 'bg-green-500';
    default:
      return 'bg-gray-400';
  }
}

/**
 * チケットカードコンポーネント（ドラッグ可能）
 */
function TicketCardComponent({ ticket, isDragOverlay = false }: TicketCardProps): React.ReactElement {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.key,
    data: { ticket },
  });

  const handleClick = (): void => {
    if (!isDragging) {
      window.open(ticket.url, '_blank', 'noopener,noreferrer');
    }
  };

  const statusDotColor = getStatusDotColor(ticket.status.categoryKey);
  const projectColor = getProjectColor(ticket.project.key);

  // ドラッグ中のスタイル
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={`bg-white rounded-lg p-3 border border-gray-200 cursor-move transition-all duration-200 ${
        isDragging && !isDragOverlay
          ? 'opacity-50'
          : 'shadow-md hover:shadow-lg'
      } ${isDragOverlay ? 'scale-105 shadow-2xl rotate-2' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={`チケット ${ticket.key}: ${ticket.summary}`}
      onKeyDown={(e): void => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* ヘッダー: プロジェクトキー + チケットキー + ステータスドット */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <img
            src={ticket.project.avatarUrl}
            alt={ticket.project.key}
            className="w-5 h-5 rounded"
          />
          <span
            className={`px-1.5 py-0.5 text-xs font-medium rounded ${projectColor.bg} ${projectColor.text}`}
            title={ticket.project.name}
          >
            {ticket.project.key}
          </span>
          <span className="text-xs font-semibold text-gray-600">
            {ticket.key.split('-')[1]}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${statusDotColor}`} title={ticket.status.name} />
        </div>
      </div>

      {/* タイトル */}
      <div className="text-sm font-medium text-gray-900 mb-2 line-clamp-2" title={ticket.summary}>
        {ticket.summary}
      </div>

      {/* 担当者 */}
      <div className="flex items-center gap-2">
        {ticket.assignee ? (
          <>
            <img
              src={ticket.assignee.avatarUrl}
              alt={ticket.assignee.displayName}
              className="w-5 h-5 rounded-full"
            />
            <span className="text-xs text-gray-600 truncate">
              {ticket.assignee.displayName}
            </span>
          </>
        ) : (
          <span className="text-xs text-gray-400 italic">未割り当て</span>
        )}
      </div>

      {/* 課題タイプ */}
      <div className="mt-2">
        <span className="inline-block px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">
          {ticket.issueType}
        </span>
      </div>
    </div>
  );
}

// React.memoで最適化
export const TicketCard = memo(TicketCardComponent);
