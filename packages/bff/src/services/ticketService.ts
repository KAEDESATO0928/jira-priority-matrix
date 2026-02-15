/**
 * Ticket Service
 * チケットの取得・更新ロジック
 */
import type { SessionData } from 'express-session';
import {
  type Ticket,
  type FilterState,
  type MoveTicketRequest,
  type PriorityLevel,
  PriorityLevel as PriorityLevelValues,
  determineQuadrant,
} from '@jira-priority-matrix/shared';
import { JiraClient } from './jiraClient.js';
import { JqlBuilder } from '../utils/jqlBuilder.js';
import { config } from '../config.js';
import { discoverFieldIds } from './fieldDiscovery.js';
import {
  type JiraSearchResponse,
  type JiraIssue,
  type JiraCustomFieldOption,
  AppError,
} from '../types/index.js';

/**
 * Jira APIのカスタムフィールド値をPriorityLevelに変換（バリデーション付き）
 */
function validatePriorityLevel(value: unknown): PriorityLevel | null {
  if (value === PriorityLevelValues.HIGH || value === PriorityLevelValues.LOW) {
    return value;
  }
  return null;
}

/**
 * Jira IssueをTicket型にマッピング
 */
function mapJiraIssueToTicket(
  issue: JiraIssue,
  importanceFieldId: string | null,
  urgencyFieldId: string | null
): Ticket {
  const { fields } = issue;

  // 自動検出されたフィールドIDでカスタムフィールドから重要度・緊急度を取得
  // フィールドIDがnullの場合（フィールド未作成）はnullとして扱う
  const importanceField = importanceFieldId
    ? (fields[importanceFieldId] as JiraCustomFieldOption | null | undefined)
    : null;
  const urgencyField = urgencyFieldId
    ? (fields[urgencyFieldId] as JiraCustomFieldOption | null | undefined)
    : null;

  const importance = validatePriorityLevel(importanceField?.value);
  const urgency = validatePriorityLevel(urgencyField?.value);

  const quadrant = determineQuadrant(importance, urgency);

  return {
    key: issue.key,
    summary: fields.summary,
    status: {
      name: fields.status.name,
      categoryKey: fields.status.statusCategory.key,
    },
    assignee: fields.assignee
      ? {
          displayName: fields.assignee.displayName,
          avatarUrl: fields.assignee.avatarUrls['48x48'],
          accountId: fields.assignee.accountId,
        }
      : null,
    project: {
      key: fields.project.key,
      name: fields.project.name,
      avatarUrl: fields.project.avatarUrls['48x48'],
    },
    importance,
    urgency,
    quadrant,
    issueType: fields.issuetype.name,
    url: `${config.jiraCloudUrl}/browse/${issue.key}`,
  };
}

/**
 * チケット検索
 */
export async function searchTickets(
  session: SessionData,
  filter: FilterState
): Promise<{ tickets: Ticket[]; total: number }> {
  const client = new JiraClient(session);

  // フィールドIDを自動検出（キャッシュあり）
  const { importanceFieldId, urgencyFieldId } = await discoverFieldIds(session);

  // JQLクエリ構築
  const jqlBuilder = new JqlBuilder();

  if (filter.projectKeys.length > 0) {
    jqlBuilder.projects(filter.projectKeys);
  }

  if (filter.onlyMe) {
    jqlBuilder.currentUser();
  } else if (filter.assigneeAccountId) {
    jqlBuilder.assignee(filter.assigneeAccountId);
  }

  if (filter.sprintId) {
    jqlBuilder.sprintId(filter.sprintId);
  }

  jqlBuilder.hideDone(filter.hideDone);

  if (filter.searchText) {
    jqlBuilder.search(filter.searchText);
  }

  const jql = jqlBuilder.build();
  console.log('[TicketService] JQL:', jql);

  // ページネーション対応（nextPageTokenベース、安全上限あり）
  // 新API: /rest/api/3/search/jql（旧 /rest/api/3/search は廃止）
  // @see https://developer.atlassian.com/changelog/#CHANGE-2046
  const allIssues: JiraIssue[] = [];
  const maxResults = 100;
  const MAX_ISSUES = 1000; // 安全上限
  let nextPageToken: string | undefined;

  // 自動検出されたフィールドIDを使用（nullの場合は除外）
  const fieldList = [
    'summary',
    'status',
    'assignee',
    'project',
    'issuetype',
  ];
  if (importanceFieldId) fieldList.push(importanceFieldId);
  if (urgencyFieldId) fieldList.push(urgencyFieldId);
  const fields = fieldList.join(',');

  do {
    const searchParams = new URLSearchParams({
      jql,
      maxResults: maxResults.toString(),
      fields,
    });

    if (nextPageToken) {
      searchParams.set('nextPageToken', nextPageToken);
    }

    const result = await client.get<JiraSearchResponse>(
      `/search/jql?${searchParams.toString()}`
    );

    allIssues.push(...result.issues);

    console.log(
      `[TicketService] Fetched ${result.issues.length} issues (total so far: ${allIssues.length}${
        result.total != null ? ` of ${result.total}` : ''
      })`
    );

    // 最終ページ判定
    if (result.isLast || !result.nextPageToken) {
      break;
    }

    // 安全上限チェック
    if (allIssues.length >= MAX_ISSUES) {
      console.warn(
        `[TicketService] Hit maximum issue limit (${MAX_ISSUES})${
          result.total != null ? `, total is ${result.total}` : ''
        }`
      );
      break;
    }

    nextPageToken = result.nextPageToken;
  } while (true);

  // Ticket型にマッピング（自動検出されたフィールドIDを使用）
  const tickets = allIssues.map((issue) =>
    mapJiraIssueToTicket(issue, importanceFieldId, urgencyFieldId)
  );

  console.log(`[TicketService] Total tickets fetched: ${tickets.length}`);
  return { tickets, total: tickets.length };
}

/**
 * チケットの重要度・緊急度を更新
 */
export async function updateTicketPriority(
  session: SessionData,
  ticketKey: string,
  moveRequest: MoveTicketRequest
): Promise<void> {
  const client = new JiraClient(session);

  // フィールドIDを自動検出（キャッシュあり）
  const { importanceFieldId, urgencyFieldId } = await discoverFieldIds(session);

  if (!importanceFieldId || !urgencyFieldId) {
    const missing = [];
    if (!importanceFieldId) missing.push('Importance');
    if (!urgencyFieldId) missing.push('Urgency');
    throw new AppError(
      'FIELD_NOT_FOUND',
      `カスタムフィールド（${missing.join(', ')}）がJiraに存在しません。Jira管理画面でSelect Listフィールドを作成してください。`,
      400
    );
  }

  // 自動検出されたフィールドIDでカスタムフィールドを更新
  const updateBody = {
    fields: {
      [importanceFieldId]: { value: moveRequest.importance },
      [urgencyFieldId]: { value: moveRequest.urgency },
    },
  };

  console.log(
    `[TicketService] Updating ${ticketKey} with fields: ${importanceFieldId}=${moveRequest.importance}, ${urgencyFieldId}=${moveRequest.urgency}`
  );

  await client.put(`/issue/${ticketKey}`, updateBody);

  console.log(
    `[TicketService] Updated ${ticketKey} successfully`
  );
}
