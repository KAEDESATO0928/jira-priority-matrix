/**
 * Field Discovery Service
 * Jira REST APIからカスタムフィールドIDを自動検出する
 */
import type { SessionData } from 'express-session';
import { JiraClient } from './jiraClient.js';
import { config } from '../config.js';

/**
 * Jira Field APIのレスポンス型
 */
interface JiraField {
  id: string;
  key: string;
  name: string;
  custom: boolean;
  orderable: boolean;
  navigable: boolean;
  searchable: boolean;
  clauseNames: string[];
  schema?: {
    type: string;
    custom?: string;
    customId?: number;
    items?: string;
  };
}

/**
 * 検出済みフィールドIDのキャッシュ
 */
export interface DiscoveredFields {
  importanceFieldId: string | null;
  urgencyFieldId: string | null;
  discoveredAt: number;
  fieldsExist: boolean;
}

/** フィールドIDキャッシュ（メモリ内） */
let cachedFields: DiscoveredFields | null = null;

/** キャッシュの有効期限（30分） */
const CACHE_TTL_MS = 30 * 60 * 1000;

/**
 * Importanceフィールドの検索候補名
 * 英語名・日本語名の両方で検索する
 */
const IMPORTANCE_NAMES = ['importance', '重要度'];

/**
 * Urgencyフィールドの検索候補名
 */
const URGENCY_NAMES = ['urgency', '緊急度'];

/**
 * フィールド名の候補リストでカスタムフィールドを検索する
 */
function findFieldByNames(fields: JiraField[], names: string[]): JiraField | undefined {
  // 完全一致（大文字小文字無視）
  for (const name of names) {
    const exactMatch = fields.find(
      (f) => f.custom && f.name.toLowerCase() === name.toLowerCase()
    );
    if (exactMatch) return exactMatch;
  }

  // 部分一致のフォールバック
  for (const name of names) {
    const partialMatch = fields.find(
      (f) => f.custom && f.name.toLowerCase().includes(name.toLowerCase())
    );
    if (partialMatch) return partialMatch;
  }

  return undefined;
}

/**
 * Jira REST APIからフィールドIDを自動検出する
 *
 * GET /rest/api/3/field を呼び出し、Importance/Urgency フィールドを検索する。
 * フィールドが見つからない場合でもエラーにせず、null を返す（全チケットが未分類になる）。
 * 結果はメモリにキャッシュされ、キャッシュ有効期間中は再取得しない。
 */
export async function discoverFieldIds(session: SessionData): Promise<DiscoveredFields> {
  // キャッシュが有効ならそのまま返す
  if (cachedFields && Date.now() - cachedFields.discoveredAt < CACHE_TTL_MS) {
    return cachedFields;
  }

  console.log('[FieldDiscovery] Discovering custom field IDs from Jira...');

  const client = new JiraClient(session);
  const allFields = await client.get<JiraField[]>('/field');

  console.log(`[FieldDiscovery] Total fields from Jira: ${allFields.length}`);

  // カスタムフィールドだけをログ出力（デバッグ用）
  const customFields = allFields.filter((f) => f.custom);
  console.log(
    `[FieldDiscovery] Custom fields (${customFields.length}):`,
    customFields.map((f) => `${f.id}: ${f.name}`).join(', ')
  );

  // Importance フィールドを検索（英語・日本語両方）
  const importanceField = findFieldByNames(allFields, IMPORTANCE_NAMES);
  // Urgency フィールドを検索（英語・日本語両方）
  const urgencyField = findFieldByNames(allFields, URGENCY_NAMES);

  // .envにフォールバックIDが指定されていれば使用
  const configImportanceId = config.jiraImportanceFieldId || null;
  const configUrgencyId = config.jiraUrgencyFieldId || null;

  const importanceFieldId = importanceField?.id ?? configImportanceId;
  const urgencyFieldId = urgencyField?.id ?? configUrgencyId;
  const fieldsExist = importanceField != null && urgencyField != null;

  if (!importanceField) {
    console.warn(
      '[FieldDiscovery] ⚠ "Importance" field NOT FOUND in Jira (searched: ' +
        IMPORTANCE_NAMES.join(', ') +
        '). Tickets will be shown as "Uncategorized".'
    );
    if (configImportanceId) {
      console.warn(
        `[FieldDiscovery]   Falling back to .env value: ${configImportanceId}`
      );
    } else {
      console.warn(
        '[FieldDiscovery]   To fix: Create a custom field named "Importance" (Select List with options "High" and "Low") in Jira admin.'
      );
    }
  } else {
    console.log(`[FieldDiscovery] ✓ Importance field: ${importanceField.id} ("${importanceField.name}")`);
    if (configImportanceId && configImportanceId !== importanceField.id) {
      console.warn(
        `[FieldDiscovery]   ⚠ .env JIRA_IMPORTANCE_FIELD_ID="${configImportanceId}" differs from discovered="${importanceField.id}". Using discovered value.`
      );
    }
  }

  if (!urgencyField) {
    console.warn(
      '[FieldDiscovery] ⚠ "Urgency" field NOT FOUND in Jira (searched: ' +
        URGENCY_NAMES.join(', ') +
        '). Tickets will be shown as "Uncategorized".'
    );
    if (configUrgencyId) {
      console.warn(
        `[FieldDiscovery]   Falling back to .env value: ${configUrgencyId}`
      );
    } else {
      console.warn(
        '[FieldDiscovery]   To fix: Create a custom field named "Urgency" (Select List with options "High" and "Low") in Jira admin.'
      );
    }
  } else {
    console.log(`[FieldDiscovery] ✓ Urgency field: ${urgencyField.id} ("${urgencyField.name}")`);
    if (configUrgencyId && configUrgencyId !== urgencyField.id) {
      console.warn(
        `[FieldDiscovery]   ⚠ .env JIRA_URGENCY_FIELD_ID="${configUrgencyId}" differs from discovered="${urgencyField.id}". Using discovered value.`
      );
    }
  }

  const discovered: DiscoveredFields = {
    importanceFieldId,
    urgencyFieldId,
    discoveredAt: Date.now(),
    fieldsExist,
  };

  // キャッシュに保存
  cachedFields = discovered;

  return discovered;
}

/**
 * キャッシュをクリアする（テスト用）
 */
export function clearFieldCache(): void {
  cachedFields = null;
}

/**
 * キャッシュされたフィールドIDを返す（null = 未検出）
 */
export function getCachedFieldIds(): DiscoveredFields | null {
  if (cachedFields && Date.now() - cachedFields.discoveredAt < CACHE_TTL_MS) {
    return cachedFields;
  }
  return null;
}
