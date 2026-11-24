// Turns an inline CSS string ("left: 4%; --c: red") into a React style object.
// Used at build time for static styles (build/dc-compiler.js) and at run time for styles that contain {{holes}}.
const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

export function styleKey(prop) {
  if (prop.startsWith('--')) return prop; // custom property
  if (prop.startsWith('-ms-')) return 'ms' + camel(prop.slice(4)).replace(/^./, (c) => c.toUpperCase());
  if (prop.startsWith('-')) return camel(prop.slice(1)).replace(/^./, (c) => c.toUpperCase()); // -webkit-x -> WebkitX
  return camel(prop);
}

export function parseStyle(text) {
  const out = {};
  let depth = 0; let quote = ''; let cur = '';
  const flush = () => {
    const i = cur.indexOf(':');
    if (i > 0) {
      const prop = cur.slice(0, i).trim();
      const val = cur.slice(i + 1).trim();
      if (prop && val !== '') out[styleKey(prop)] = val;
    }
    cur = '';
  };
  for (const ch of String(text == null ? '' : text)) {
    if (quote) { cur += ch; if (ch === quote) quote = ''; continue; }
    if (ch === '"' || ch === "'") { quote = ch; cur += ch; continue; }
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ';' && depth === 0) { flush(); continue; }
    cur += ch;
  }
  flush();
  return out;
}
