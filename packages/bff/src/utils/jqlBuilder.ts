/**
 * JQL Query Builder
 * JQLクエリを安全に構築するビルダー
 */

/**
 * 特殊文字をエスケープしてJQLインジェクションを防ぐ
 */
function escapeJqlString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')    // バックスラッシュ（先に処理）
    .replace(/"/g, '\\"')       // ダブルクォート
    .replace(/'/g, "\\'")       // シングルクォート
    .replace(/\n/g, ' ')        // 改行 → スペース
    .replace(/\r/g, ' ')        // キャリッジリターン → スペース
    .replace(/\t/g, ' ');       // タブ → スペース
}

/**
 * JQLクエリビルダークラス
 */
export class JqlBuilder {
  private conditions: string[] = [];

  /**
   * プロジェクト指定（複数）
   */
  projects(keys: string[]): this {
    if (keys.length === 0) return this;
    const escapedKeys = keys.map((k) => `"${escapeJqlString(k)}"`).join(', ');
    this.conditions.push(`project in (${escapedKeys})`);
    return this;
  }

  /**
   * 担当者指定（Account ID）
   */
  assignee(accountId: string): this {
    const escaped = escapeJqlString(accountId);
    this.conditions.push(`assignee = "${escaped}"`);
    return this;
  }

  /**
   * 現在のユーザーに割り当てられているチケット
   */
  currentUser(): this {
    this.conditions.push('assignee = currentUser()');
    return this;
  }

  /**
   * スプリント指定
   */
  sprintId(id: number): this {
    this.conditions.push(`sprint = ${id}`);
    return this;
  }

  /**
   * 完了済みチケットを非表示
   */
  hideDone(hide: boolean): this {
    if (hide) {
      this.conditions.push('statusCategory != "Done"');
    }
    return this;
  }

  /**
   * テキスト検索（summary または key）
   */
  search(text: string): this {
    if (!text.trim()) return this;
    const trimmed = text.trim();
    const escaped = escapeJqlString(trimmed);
    const escapedUpper = escapeJqlString(trimmed.toUpperCase());

    this.conditions.push(
      `(summary ~ "${escaped}" OR key = "${escapedUpper}")`
    );
    return this;
  }

  /**
   * JQLクエリを構築して返す
   */
  build(): string {
    if (this.conditions.length === 0) {
      // 条件がない場合はすべてのチケットを取得（並び順のみ指定）
      return 'ORDER BY updated DESC';
    }

    const conditionsPart = this.conditions.join(' AND ');
    return `${conditionsPart} ORDER BY updated DESC`;
  }

  /**
   * リセット（再利用時）
   */
  reset(): this {
    this.conditions = [];
    return this;
  }
}
