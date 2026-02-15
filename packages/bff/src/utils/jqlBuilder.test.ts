import { describe, it, expect } from 'vitest';
import { JqlBuilder } from './jqlBuilder.js';

describe('JqlBuilder', () => {
  describe('build()', () => {
    it('空条件でbuildするとORDER BY updated DESCのみを返す', () => {
      const builder = new JqlBuilder();
      expect(builder.build()).toBe('ORDER BY updated DESC');
    });
  });

  describe('projects()', () => {
    it('空配列を渡すとスキップされる', () => {
      const builder = new JqlBuilder();
      builder.projects([]);
      expect(builder.build()).toBe('ORDER BY updated DESC');
    });

    it('プロジェクトキー1つを指定できる', () => {
      const builder = new JqlBuilder();
      builder.projects(['PROJ1']);
      expect(builder.build()).toBe('project in ("PROJ1") ORDER BY updated DESC');
    });

    it('複数プロジェクトを指定できる', () => {
      const builder = new JqlBuilder();
      builder.projects(['PROJ1', 'PROJ2']);
      expect(builder.build()).toBe(
        'project in ("PROJ1", "PROJ2") ORDER BY updated DESC'
      );
    });

    it('プロジェクトキーに特殊文字が含まれる場合、エスケープされる', () => {
      const builder = new JqlBuilder();
      builder.projects(['PROJ"1', "PROJ'2"]);
      expect(builder.build()).toBe(
        'project in ("PROJ\\"1", "PROJ\\\'2") ORDER BY updated DESC'
      );
    });
  });

  describe('assignee()', () => {
    it('担当者のAccount IDを指定できる', () => {
      const builder = new JqlBuilder();
      builder.assignee('user-123');
      expect(builder.build()).toBe(
        'assignee = "user-123" ORDER BY updated DESC'
      );
    });

    it('担当者IDに特殊文字が含まれる場合、エスケープされる', () => {
      const builder = new JqlBuilder();
      builder.assignee('user"123');
      expect(builder.build()).toBe(
        'assignee = "user\\"123" ORDER BY updated DESC'
      );
    });
  });

  describe('currentUser()', () => {
    it('assignee = currentUser()を追加する', () => {
      const builder = new JqlBuilder();
      builder.currentUser();
      expect(builder.build()).toBe(
        'assignee = currentUser() ORDER BY updated DESC'
      );
    });
  });

  describe('sprintId()', () => {
    it('スプリントIDを指定できる', () => {
      const builder = new JqlBuilder();
      builder.sprintId(42);
      expect(builder.build()).toBe('sprint = 42 ORDER BY updated DESC');
    });
  });

  describe('hideDone()', () => {
    it('trueを渡すとstatusCategory != "Done"を追加する', () => {
      const builder = new JqlBuilder();
      builder.hideDone(true);
      expect(builder.build()).toBe(
        'statusCategory != "Done" ORDER BY updated DESC'
      );
    });

    it('falseを渡すと条件は追加されない', () => {
      const builder = new JqlBuilder();
      builder.hideDone(false);
      expect(builder.build()).toBe('ORDER BY updated DESC');
    });
  });

  describe('search()', () => {
    it('検索テキストを指定できる', () => {
      const builder = new JqlBuilder();
      builder.search('ログイン');
      expect(builder.build()).toBe(
        '(summary ~ "ログイン" OR key = "ログイン") ORDER BY updated DESC'
      );
    });

    it('空文字列を渡すとスキップされる', () => {
      const builder = new JqlBuilder();
      builder.search('');
      expect(builder.build()).toBe('ORDER BY updated DESC');
    });

    it('前後の空白はトリミングされる', () => {
      const builder = new JqlBuilder();
      builder.search('  test  ');
      expect(builder.build()).toBe(
        '(summary ~ "test" OR key = "TEST") ORDER BY updated DESC'
      );
    });

    it('チケットキーは大文字に変換される', () => {
      const builder = new JqlBuilder();
      builder.search('proj-123');
      expect(builder.build()).toBe(
        '(summary ~ "proj-123" OR key = "PROJ-123") ORDER BY updated DESC'
      );
    });

    it('特殊文字がエスケープされる', () => {
      const builder = new JqlBuilder();
      builder.search('test"value');
      const result = builder.build();
      expect(result).toContain('test\\"value');
    });
  });

  describe('複合条件', () => {
    it('すべての条件を組み合わせられる', () => {
      const builder = new JqlBuilder();
      builder
        .projects(['PROJ1', 'PROJ2'])
        .assignee('user-123')
        .sprintId(42)
        .hideDone(true)
        .search('ログイン');

      const expected =
        'project in ("PROJ1", "PROJ2") AND assignee = "user-123" AND sprint = 42 AND statusCategory != "Done" AND (summary ~ "ログイン" OR key = "ログイン") ORDER BY updated DESC';
      expect(builder.build()).toBe(expected);
    });
  });

  describe('JQLインジェクション対策', () => {
    it('シングルクォートがエスケープされる', () => {
      const builder = new JqlBuilder();
      builder.search("'; DROP TABLE issues; --");
      expect(builder.build()).toContain("\\'");
    });

    it('ダブルクォートがエスケープされる', () => {
      const builder = new JqlBuilder();
      builder.search('" OR 1=1 --');
      expect(builder.build()).toContain('\\"');
    });

    it('バックスラッシュがエスケープされる', () => {
      const builder = new JqlBuilder();
      builder.search('test\\value');
      expect(builder.build()).toContain('\\\\');
    });

    it('改行文字がエスケープされる', () => {
      const builder = new JqlBuilder();
      builder.search('test\nvalue');
      const result = builder.build();
      // 改行がそのまま残っていないことを確認
      expect(result).not.toContain('\n');
    });

    it('複合的な攻撃文字列がエスケープされる', () => {
      const builder = new JqlBuilder();
      builder.search('\\"; DELETE FROM issues WHERE 1=1; --');
      const result = builder.build();
      expect(result).toContain('\\\\');
      expect(result).toContain('\\"');
    });
  });

  describe('reset()', () => {
    it('リセット後は空条件になる', () => {
      const builder = new JqlBuilder();
      builder.projects(['PROJ1']).assignee('user-123');
      builder.reset();
      expect(builder.build()).toBe('ORDER BY updated DESC');
    });

    it('リセット後も再利用できる', () => {
      const builder = new JqlBuilder();
      builder.projects(['PROJ1']);
      builder.reset();
      builder.projects(['PROJ2']);
      expect(builder.build()).toBe(
        'project in ("PROJ2") ORDER BY updated DESC'
      );
    });
  });

  describe('メソッドチェーン', () => {
    it('すべてのメソッドがthisを返す', () => {
      const builder = new JqlBuilder();
      const result = builder
        .projects(['PROJ1'])
        .assignee('user-123')
        .sprintId(42)
        .hideDone(true)
        .search('test')
        .reset();

      expect(result).toBe(builder);
    });
  });
});
