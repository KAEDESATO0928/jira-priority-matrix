/**
 * Field Setup Service
 * Jiraにカスタムフィールド（Importance, Urgency）を自動作成する
 */
import type { SessionData } from 'express-session';
import { JiraClient } from './jiraClient.js';
import { clearFieldCache } from './fieldDiscovery.js';

/**
 * Jira POST /rest/api/3/field のレスポンス
 */
interface JiraCreatedField {
  id: string;
  key: string;
  name: string;
  custom: boolean;
  schema: {
    type: string;
    custom: string;
    customId: number;
  };
}

/**
 * フィールドコンテキスト
 */
interface JiraFieldContext {
  id: string;
  name: string;
  isGlobalContext: boolean;
}

interface JiraFieldContextResponse {
  values: JiraFieldContext[];
}

/**
 * スクリーンタブ
 */
interface JiraScreenTab {
  id: number;
  name: string;
}

/**
 * スクリーン検索結果
 */
interface JiraScreenSearchResponse {
  values: Array<{
    id: number;
    name: string;
  }>;
  total: number;
}

/**
 * セットアップ結果
 */
export interface FieldSetupResult {
  importanceFieldId: string | null;
  urgencyFieldId: string | null;
  importanceCreated: boolean;
  urgencyCreated: boolean;
  optionsAdded: boolean;
  screenAdded: boolean;
  errors: string[];
}

/**
 * カスタムフィールドを作成する
 */
async function createSelectField(
  client: JiraClient,
  name: string
): Promise<JiraCreatedField> {
  const body = {
    name,
    type: 'com.atlassian.jira.plugin.system.customfieldtypes:select',
    searcherKey: 'com.atlassian.jira.plugin.system.customfieldtypes:multiselectsearcher',
  };

  console.log(`[FieldSetup] Creating custom field: ${name}`);
  return client.post<JiraCreatedField>('/field', body);
}

/**
 * フィールドのコンテキストを取得
 */
async function getFieldContexts(
  client: JiraClient,
  fieldId: string
): Promise<JiraFieldContext[]> {
  const result = await client.get<JiraFieldContextResponse>(
    `/field/${fieldId}/context`
  );
  return result.values;
}

/**
 * フィールドにオプション（High, Low）を追加
 */
async function addFieldOptions(
  client: JiraClient,
  fieldId: string,
  contextId: string
): Promise<void> {
  const body = {
    options: [
      { value: 'High' },
      { value: 'Low' },
    ],
  };

  console.log(`[FieldSetup] Adding options (High, Low) to ${fieldId} context ${contextId}`);
  await client.post(`/field/${fieldId}/context/${contextId}/option`, body);
}

/**
 * スクリーンを検索してフィールドを追加
 */
async function addFieldToScreens(
  client: JiraClient,
  fieldId: string,
  fieldName: string
): Promise<string[]> {
  const errors: string[] = [];

  // スクリーン一覧を取得
  const screens = await client.get<JiraScreenSearchResponse>('/screens?maxResult=100');

  if (screens.values.length === 0) {
    errors.push('No screens found');
    return errors;
  }

  // 各スクリーンのデフォルトタブにフィールドを追加
  for (const screen of screens.values) {
    try {
      // タブ一覧を取得
      const tabs = await client.get<JiraScreenTab[]>(`/screens/${screen.id}/tabs`);
      if (tabs.length === 0) continue;

      // 最初のタブに追加
      const tabId = tabs[0].id;
      await client.post(`/screens/${screen.id}/tabs/${tabId}/fields`, {
        fieldId,
      });
      console.log(
        `[FieldSetup] Added ${fieldName} to screen "${screen.name}" (tab: ${tabs[0].name})`
      );
    } catch (error) {
      // 既に追加済みの場合は400が返る → 無視
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('already')) {
        console.log(`[FieldSetup] ${fieldName} already on screen "${screen.name}"`);
      } else {
        console.warn(`[FieldSetup] Failed to add ${fieldName} to screen "${screen.name}": ${msg}`);
        errors.push(`Screen "${screen.name}": ${msg}`);
      }
    }
  }

  return errors;
}

/**
 * Importance + Urgency フィールドをJiraに作成する
 *
 * 1. カスタムフィールドを作成（Select List）
 * 2. オプション（High, Low）を追加
 * 3. 全スクリーンに追加
 */
export async function setupFields(session: SessionData): Promise<FieldSetupResult> {
  const client = new JiraClient(session);
  const result: FieldSetupResult = {
    importanceFieldId: null,
    urgencyFieldId: null,
    importanceCreated: false,
    urgencyCreated: false,
    optionsAdded: false,
    screenAdded: false,
    errors: [],
  };

  // 既存フィールドをチェック
  interface JiraFieldInfo {
    id: string;
    name: string;
    custom: boolean;
  }
  const existingFields = await client.get<JiraFieldInfo[]>('/field');
  const existingImportance = existingFields.find(
    (f) => f.custom && f.name.toLowerCase() === 'importance'
  );
  const existingUrgency = existingFields.find(
    (f) => f.custom && f.name.toLowerCase() === 'urgency'
  );

  // === Importance フィールド ===
  if (existingImportance) {
    console.log(`[FieldSetup] Importance field already exists: ${existingImportance.id}`);
    result.importanceFieldId = existingImportance.id;
  } else {
    try {
      const field = await createSelectField(client, 'Importance');
      result.importanceFieldId = field.id;
      result.importanceCreated = true;
      console.log(`[FieldSetup] Created Importance field: ${field.id}`);

      // オプション追加
      try {
        const contexts = await getFieldContexts(client, field.id);
        if (contexts.length > 0) {
          await addFieldOptions(client, field.id, contexts[0].id);
          result.optionsAdded = true;
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        result.errors.push(`Importance options: ${msg}`);
        console.error('[FieldSetup] Failed to add Importance options:', msg);
      }

      // スクリーンに追加
      const screenErrors = await addFieldToScreens(client, field.id, 'Importance');
      if (screenErrors.length === 0) result.screenAdded = true;
      result.errors.push(...screenErrors);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      result.errors.push(`Create Importance: ${msg}`);
      console.error('[FieldSetup] Failed to create Importance field:', msg);
    }
  }

  // === Urgency フィールド ===
  if (existingUrgency) {
    console.log(`[FieldSetup] Urgency field already exists: ${existingUrgency.id}`);
    result.urgencyFieldId = existingUrgency.id;
  } else {
    try {
      const field = await createSelectField(client, 'Urgency');
      result.urgencyFieldId = field.id;
      result.urgencyCreated = true;
      console.log(`[FieldSetup] Created Urgency field: ${field.id}`);

      // オプション追加
      try {
        const contexts = await getFieldContexts(client, field.id);
        if (contexts.length > 0) {
          await addFieldOptions(client, field.id, contexts[0].id);
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        result.errors.push(`Urgency options: ${msg}`);
        console.error('[FieldSetup] Failed to add Urgency options:', msg);
      }

      // スクリーンに追加
      const screenErrors = await addFieldToScreens(client, field.id, 'Urgency');
      result.errors.push(...screenErrors);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      result.errors.push(`Create Urgency: ${msg}`);
      console.error('[FieldSetup] Failed to create Urgency field:', msg);
    }
  }

  // フィールドキャッシュをクリア（次回の検出で新しいフィールドが見つかるように）
  clearFieldCache();

  console.log('[FieldSetup] Setup complete:', result);
  return result;
}
