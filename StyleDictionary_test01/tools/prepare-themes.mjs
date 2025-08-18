// tools/prepare-themes.mjs
// - Semantics/<theme> は Primitives/<theme> を参照して解決
// - Components/<theme> は (Primitives/<theme> + resolved(Semantics/<theme>)) を参照して解決
// ※ すべて $value/$type を残した「トークンノード」のまま出力
// 出力: .tmp/default.json, .tmp/subTheme01.json
import fs from 'node:fs';

const SRC  = new URL('../tokens.json', import.meta.url);
const DIST = new URL('../.tmp/', import.meta.url);
fs.mkdirSync(DIST, { recursive: true });

const raw = JSON.parse(fs.readFileSync(SRC, 'utf-8'));
const REF_RE = /^\{([^}]+)\}$/;

// ---------- utils ----------
function isTokenNode(n) {
  return n && typeof n === 'object' && ('$value' in n) && ('$type' in n);
}
function deepGet(obj, parts) {
  return parts.reduce((o, p) => (o && o[p] !== undefined ? o[p] : undefined), obj);
}
function deepMerge(a, b) {
  if (Array.isArray(a) || Array.isArray(b)) return b ?? a;
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return b ?? a;
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) {
    out[k] = k in a ? deepMerge(a[k], v) : v;
  }
  return out;
}
const warnings = [];
function warn(msg){ warnings.push(msg); }

// よくあるパスの正規化（color.border.default → border.default.color 等）
function normalizeRef(parts) {
  const p = [...parts];
  // タイポ補正
  if (p[0] === 'color' && p[1] === 'transparnent') p[1] = 'transparent';
  // color.border.default → border.default.color
  if (p[0] === 'color' && p[1] === 'border' && p.length === 3) {
    return ['border', p[2], 'color'];
  }
  return p;
}

// 参照解決（多段、最大10段）／$value は中身のみ解決し、$type等は温存
function resolveDeep(value, scope, maxDepth = 10) {
  let v = value;
  for (let i = 0; i < maxDepth; i++) {
    if (typeof v !== 'string') return v;
    const m = v.trim().match(/^\{([^}]+)\}$/);
    if (!m) return v;

    const rawParts = m[1].split('.');

    // 1) まずは生パスのまま
    let hit = deepGet(scope, rawParts);

    // 色名タイポ補正（transparnent → transparent）
    if (!hit && rawParts[0] === 'color' && rawParts[1] === 'transparnent') {
      const fixed = [...rawParts];
      fixed[1] = 'transparent';
      hit = deepGet(scope, fixed);
      if (!hit) {
        // よくある色名のフォールバック
        return 'transparent';
      }
    }

    // 2) 見つからない時だけエイリアス（color.border.X → border.X.color）
    if (!hit && rawParts[0] === 'color' && rawParts[1] === 'border' && rawParts.length === 3) {
      const alias = ['border', rawParts[2], 'color'];
      hit = deepGet(scope, alias);
    }

    // 3) それでも無ければよくある色名のフォールバック
    if (!hit && rawParts[0] === 'color') {
      const name = rawParts[1];
      if (name === 'transparent') return 'transparent';
      if (name === 'white') return '#ffffff';
      if (name === 'black') return '#000000';
    }

    if (!hit) {
      warnings.push(`Unresolved reference: {${rawParts.join('.')}}`);
      return v; // 解決不能なら元文字列のまま（SDが検知）
    }

    v = (typeof hit === 'object' && hit && '$value' in hit) ? hit.$value : hit;
  }
  warnings.push(`Max resolution depth reached: ${String(value)}`);
  return v;
}


// 任意ノード配下で $value のみ解決（$typeや他メタは維持）
function walkResolve(node, scope) {
  if (!node || typeof node !== 'object') return node;

  if (isTokenNode(node)) {
    const v = node.$value;
    if (Array.isArray(v)) {
      const out = v.map(item => (typeof item === 'string' ? resolveDeep(item, scope) : walkResolve(item, scope)));
      return { ...node, $value: out };
    } else if (v && typeof v === 'object') {
      const out = {};
      for (const [k, subv] of Object.entries(v)) {
        out[k] = typeof subv === 'string' ? resolveDeep(subv, scope) : walkResolve(subv, scope);
      }
      return { ...node, $value: out };
    } else {
      const resolved = typeof v === 'string' ? resolveDeep(v, scope) : v;
      return { ...node, $value: resolved };
    }
  }

  const out = Array.isArray(node) ? [] : {};
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith && k.startsWith('$')) { out[k] = v; continue; }
    out[k] = walkResolve(v, scope);
  }
  return out;
}

// Semantics/* のキーからテーマ列挙
function listThemes() {
  const s = new Set();
  for (const k of Object.keys(raw)) if (k.startsWith('Semantics/')) s.add(k.split('/')[1]);
  return [...s];
}

// 1テーマ分を解決して出力
function buildTheme(theme) {
  const prim = raw[`Primitives/${theme}`];
  const sem  = raw[`Semantics/${theme}`];
  const comp = raw[`Components/${theme}`];

  if (!prim || !sem) {
    warn(`Skip theme "${theme}": missing ${!prim ? `Primitives/${theme}` : ''} ${!sem ? `Semantics/${theme}` : ''}`.trim());
    return null;
  }

  // Semantics の自己参照を許容：Primitives + SemanticsRaw を解決スコープに
  const semScope = deepMerge(prim, sem);
  const resolvedSem = walkResolve(sem, semScope);

  // Components は Primitives + resolvedSem を解決スコープに
  const compScope = deepMerge(prim, resolvedSem);
  const resolvedComp = comp ? walkResolve(comp, compScope) : undefined;

  // 出力は SD が拾いやすい形（$value/$type ノードを維持）
  const out = { Semantics: resolvedSem };
  if (resolvedComp) out.Components = resolvedComp;
  return out;
}

// 実行
const themes = listThemes();
if (!themes.length) {
  console.error('No Semantics/* themes found.');
  process.exit(1);
}

for (const t of themes) {
  const merged = buildTheme(t);
  if (!merged) continue;
  const outPath = new URL(`./${t}.json`, DIST);
  fs.writeFileSync(outPath, JSON.stringify(merged, null, 2));
  console.log('wrote', outPath.pathname);
}

if (warnings.length) {
  console.warn(`[prepare-themes] warnings (${warnings.length}):`);
  for (const w of warnings) console.warn(' -', w);
}
console.log('Done.');
