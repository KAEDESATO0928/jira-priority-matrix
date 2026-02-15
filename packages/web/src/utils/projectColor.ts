/**
 * プロジェクトカラーパレット
 * プロジェクトキーに応じて一意の色を割り当てる
 */

/**
 * プロジェクトカラーペア（背景・テキスト・ドット）
 */
export interface ProjectColorPair {
  bg: string;    // 背景色クラス（例: "bg-blue-100"）
  text: string;  // テキスト色クラス（例: "text-blue-800"）
  dot: string;   // ドット色クラス（例: "bg-blue-500"）
}

/**
 * カラーパレット（10色）
 */
const COLOR_PALETTE: ProjectColorPair[] = [
  { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
  { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
  { bg: 'bg-purple-100', text: 'text-purple-800', dot: 'bg-purple-500' },
  { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500' },
  { bg: 'bg-pink-100', text: 'text-pink-800', dot: 'bg-pink-500' },
  { bg: 'bg-teal-100', text: 'text-teal-800', dot: 'bg-teal-500' },
  { bg: 'bg-indigo-100', text: 'text-indigo-800', dot: 'bg-indigo-500' },
  { bg: 'bg-rose-100', text: 'text-rose-800', dot: 'bg-rose-500' },
  { bg: 'bg-cyan-100', text: 'text-cyan-800', dot: 'bg-cyan-500' },
  { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500' },
];

/**
 * 文字列を数値にハッシュ化（シンプルなハッシュ関数）
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * プロジェクトキーに対して一意のカラーを返す
 *
 * @param projectKey - プロジェクトキー（例: "PROJ", "ABC"）
 * @returns プロジェクトカラーペア
 */
export function getProjectColor(projectKey: string): ProjectColorPair {
  const hash = hashString(projectKey);
  const index = hash % COLOR_PALETTE.length;
  const color = COLOR_PALETTE[index];

  // TypeScript の strict モードでは配列アクセスが undefined を含むため、型ガードを追加
  if (color === undefined) {
    // パレットは空でないので、最初の要素を使う
    const fallback = COLOR_PALETTE[0];
    if (fallback === undefined) {
      // パレットが空の場合のフォールバック（通常発生しない）
      return { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-500' };
    }
    return fallback;
  }

  return color;
}
