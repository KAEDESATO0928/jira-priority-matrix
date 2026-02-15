/**
 * BFF Server Configuration
 * 環境変数のロード・バリデーション
 */
import dotenv from 'dotenv';

// .envファイルを読み込み（存在しない場合はスキップ）
dotenv.config();

/**
 * 必須環境変数をチェックして値を返す
 */
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * オプション環境変数を返す（デフォルト値あり）
 */
function optionalEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

/**
 * 環境変数の設定
 */
export const config = {
  // Jira設定
  jiraCloudUrl: requireEnv('JIRA_CLOUD_URL'),
  jiraClientId: requireEnv('JIRA_CLIENT_ID'),
  jiraClientSecret: requireEnv('JIRA_CLIENT_SECRET'),
  jiraRedirectUri: requireEnv('JIRA_REDIRECT_URI'),
  jiraImportanceFieldId: optionalEnv('JIRA_IMPORTANCE_FIELD_ID', ''),
  jiraUrgencyFieldId: optionalEnv('JIRA_URGENCY_FIELD_ID', ''),

  // BFFサーバー設定
  port: parseInt(optionalEnv('BFF_PORT', '3001'), 10),
  sessionSecret: requireEnv('SESSION_SECRET'),
  frontendUrl: optionalEnv('FRONTEND_URL', 'http://localhost:5173'),

  // 環境
  nodeEnv: optionalEnv('NODE_ENV', 'development'),
  isProduction: process.env.NODE_ENV === 'production',
} as const;

// 起動時に設定を表示（機密情報は除く）
console.log('[Config] Loaded configuration:', {
  jiraCloudUrl: config.jiraCloudUrl,
  port: config.port,
  frontendUrl: config.frontendUrl,
  nodeEnv: config.nodeEnv,
});
