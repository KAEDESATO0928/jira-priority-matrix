import type { Ticket } from '@jira-priority-matrix/shared';
import { PriorityLevel, Quadrant } from '@jira-priority-matrix/shared';

/**
 * モックチケットデータ
 */
export const mockTickets: Ticket[] = [
  // Q1: Do First (High Importance, High Urgency)
  {
    key: 'PROJ-101',
    summary: '本番環境でログイン不可の致命的バグを修正',
    status: {
      name: 'In Progress',
      categoryKey: 'indeterminate',
    },
    assignee: {
      displayName: '田中太郎',
      avatarUrl: 'https://ui-avatars.com/api/?name=Taro+Tanaka&background=EF4444&color=fff',
      accountId: 'acc-tanaka',
    },
    project: {
      key: 'PROJ',
      name: 'Main Project',
      avatarUrl: 'https://ui-avatars.com/api/?name=PROJ&background=3B82F6&color=fff',
    },
    importance: PriorityLevel.HIGH,
    urgency: PriorityLevel.HIGH,
    quadrant: Quadrant.DO_FIRST,
    issueType: 'Bug',
    url: 'https://example.atlassian.net/browse/PROJ-101',
  },
  {
    key: 'PROJ-102',
    summary: 'セキュリティパッチの緊急適用',
    status: {
      name: 'To Do',
      categoryKey: 'new',
    },
    assignee: {
      displayName: '佐藤花子',
      avatarUrl: 'https://ui-avatars.com/api/?name=Hanako+Sato&background=EF4444&color=fff',
      accountId: 'acc-sato',
    },
    project: {
      key: 'PROJ',
      name: 'Main Project',
      avatarUrl: 'https://ui-avatars.com/api/?name=PROJ&background=3B82F6&color=fff',
    },
    importance: PriorityLevel.HIGH,
    urgency: PriorityLevel.HIGH,
    quadrant: Quadrant.DO_FIRST,
    issueType: 'Task',
    url: 'https://example.atlassian.net/browse/PROJ-102',
  },

  // Q2: Schedule (High Importance, Low Urgency)
  {
    key: 'PROJ-201',
    summary: '新機能: ユーザー管理画面のリニューアル',
    status: {
      name: 'To Do',
      categoryKey: 'new',
    },
    assignee: {
      displayName: '鈴木一郎',
      avatarUrl: 'https://ui-avatars.com/api/?name=Ichiro+Suzuki&background=22C55E&color=fff',
      accountId: 'acc-suzuki',
    },
    project: {
      key: 'PROJ',
      name: 'Main Project',
      avatarUrl: 'https://ui-avatars.com/api/?name=PROJ&background=3B82F6&color=fff',
    },
    importance: PriorityLevel.HIGH,
    urgency: PriorityLevel.LOW,
    quadrant: Quadrant.SCHEDULE,
    issueType: 'Story',
    url: 'https://example.atlassian.net/browse/PROJ-201',
  },
  {
    key: 'PROJ-202',
    summary: 'パフォーマンス改善: DBクエリ最適化',
    status: {
      name: 'In Progress',
      categoryKey: 'indeterminate',
    },
    assignee: {
      displayName: '高橋次郎',
      avatarUrl: 'https://ui-avatars.com/api/?name=Jiro+Takahashi&background=22C55E&color=fff',
      accountId: 'acc-takahashi',
    },
    project: {
      key: 'DEV',
      name: 'Development',
      avatarUrl: 'https://ui-avatars.com/api/?name=DEV&background=8B5CF6&color=fff',
    },
    importance: PriorityLevel.HIGH,
    urgency: PriorityLevel.LOW,
    quadrant: Quadrant.SCHEDULE,
    issueType: 'Task',
    url: 'https://example.atlassian.net/browse/PROJ-202',
  },

  // Q3: Delegate (Low Importance, High Urgency)
  {
    key: 'PROJ-301',
    summary: '営業部門からの緊急データ出力依頼',
    status: {
      name: 'To Do',
      categoryKey: 'new',
    },
    assignee: {
      displayName: '渡辺三郎',
      avatarUrl: 'https://ui-avatars.com/api/?name=Saburo+Watanabe&background=F59E0B&color=fff',
      accountId: 'acc-watanabe',
    },
    project: {
      key: 'OPS',
      name: 'Operations',
      avatarUrl: 'https://ui-avatars.com/api/?name=OPS&background=F59E0B&color=fff',
    },
    importance: PriorityLevel.LOW,
    urgency: PriorityLevel.HIGH,
    quadrant: Quadrant.DELEGATE,
    issueType: 'Task',
    url: 'https://example.atlassian.net/browse/PROJ-301',
  },
  {
    key: 'PROJ-302',
    summary: '定例会議用のレポート作成',
    status: {
      name: 'In Progress',
      categoryKey: 'indeterminate',
    },
    assignee: null,
    project: {
      key: 'OPS',
      name: 'Operations',
      avatarUrl: 'https://ui-avatars.com/api/?name=OPS&background=F59E0B&color=fff',
    },
    importance: PriorityLevel.LOW,
    urgency: PriorityLevel.HIGH,
    quadrant: Quadrant.DELEGATE,
    issueType: 'Task',
    url: 'https://example.atlassian.net/browse/PROJ-302',
  },

  // Q4: Eliminate (Low Importance, Low Urgency)
  {
    key: 'PROJ-401',
    summary: 'ドキュメントの誤字修正',
    status: {
      name: 'To Do',
      categoryKey: 'new',
    },
    assignee: {
      displayName: '伊藤四郎',
      avatarUrl: 'https://ui-avatars.com/api/?name=Shiro+Ito&background=6B7280&color=fff',
      accountId: 'acc-ito',
    },
    project: {
      key: 'DOC',
      name: 'Documentation',
      avatarUrl: 'https://ui-avatars.com/api/?name=DOC&background=6B7280&color=fff',
    },
    importance: PriorityLevel.LOW,
    urgency: PriorityLevel.LOW,
    quadrant: Quadrant.ELIMINATE,
    issueType: 'Task',
    url: 'https://example.atlassian.net/browse/PROJ-401',
  },
  {
    key: 'PROJ-402',
    summary: 'UIの色合い微調整（オプション）',
    status: {
      name: 'To Do',
      categoryKey: 'new',
    },
    assignee: null,
    project: {
      key: 'PROJ',
      name: 'Main Project',
      avatarUrl: 'https://ui-avatars.com/api/?name=PROJ&background=3B82F6&color=fff',
    },
    importance: PriorityLevel.LOW,
    urgency: PriorityLevel.LOW,
    quadrant: Quadrant.ELIMINATE,
    issueType: 'Story',
    url: 'https://example.atlassian.net/browse/PROJ-402',
  },

  // Uncategorized (未分類)
  {
    key: 'PROJ-501',
    summary: '新規チケット: 優先度未設定',
    status: {
      name: 'To Do',
      categoryKey: 'new',
    },
    assignee: {
      displayName: '山田五郎',
      avatarUrl: 'https://ui-avatars.com/api/?name=Goro+Yamada&background=3B82F6&color=fff',
      accountId: 'acc-yamada',
    },
    project: {
      key: 'PROJ',
      name: 'Main Project',
      avatarUrl: 'https://ui-avatars.com/api/?name=PROJ&background=3B82F6&color=fff',
    },
    importance: null,
    urgency: null,
    quadrant: Quadrant.UNCATEGORIZED,
    issueType: 'Task',
    url: 'https://example.atlassian.net/browse/PROJ-501',
  },
  {
    key: 'PROJ-502',
    summary: '緊急度のみ設定されたチケット',
    status: {
      name: 'To Do',
      categoryKey: 'new',
    },
    assignee: null,
    project: {
      key: 'DEV',
      name: 'Development',
      avatarUrl: 'https://ui-avatars.com/api/?name=DEV&background=8B5CF6&color=fff',
    },
    importance: null,
    urgency: PriorityLevel.HIGH,
    quadrant: Quadrant.UNCATEGORIZED,
    issueType: 'Bug',
    url: 'https://example.atlassian.net/browse/PROJ-502',
  },
];
