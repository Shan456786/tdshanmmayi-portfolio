// Compiles the site's HTML templates (src/template/*.html) into plain React render functions at build time.
//
// The template language is deliberately tiny:
//   {{ path.to.value }}      a dotted lookup into the object returned by Component.renderVals(). Never an expression.
//   x="{{ fn }}"             a whole-value attribute is passed through as-is (functions, numbers, strings, refs)
//   x="a {{ b }} c"          an interpolated attribute becomes a string
//   onClick="{{ handler }}"  events use React's camelCase names
//   ref="{{ setEl }}"        callback refs
//   <sc-if value="{{ x }}">  renders its children when x is truthy
//   <sc-for list="{{ xs }}" as="x">  repeats its children; {{ x.y }} and {{ $index }} are in scope
//   <dc-include src="./a.html"></dc-include>   inlines another template file (resolved before parsing)
// Plain HTML otherwise. class, for and tabindex are renamed for React; SVG attributes such as stroke-width are camel-cased.
import fs from 'node:fs';
import path from 'node:path';
import { Parser } from 'htmlparser2';
import { parseStyle } from '../src/runtime/style.js';

const INCLUDE = /<dc-include\s+src="([^"]+)"\s*><\/dc-include>/g;

/** Reads a template and inlines every <dc-include>. Returns the text and every file that was read. */
export function expandIncludes(file, seen = []) {
  if (seen.includes(file)) throw new Error('Circular <dc-include>: ' + [...seen, file].join(' -> '));
  const files = [file];
  const text = fs.readFileSync(file, 'utf8').replace(INCLUDE, (_, rel) => {
    const child = expandIncludes(path.resolve(path.dirname(file), rel), [...seen, file]);
    files.push(...child.files);
    return child.text.replace(/\n$/, '');
  });
  return { text, files };
}

const ALIASES = {
  class: 'className', for: 'htmlFor', tabindex: 'tabIndex', autocomplete: 'autoComplete', autofocus: 'autoFocus',
  inputmode: 'inputMode', maxlength: 'maxLength', minlength: 'minLength', spellcheck: 'spellCheck', readonly: 'readOnly',
  contenteditable: 'contentEditable', crossorigin: 'crossOrigin', srcset: 'srcSet', colspan: 'colSpan', rowspan: 'rowSpan',
  accesskey: 'accessKey', enterkeyhint: 'enterKeyHint', fetchpriority: 'fetchPriority', novalidate: 'noValidate',
  formnovalidate: 'formNoValidate', 'xlink:href': 'xlinkHref', 'xml:space': 'xmlSpace'
};
const BOOLEAN_ATTRS = new Set([
  'allowfullscreen', 'async', 'autofocus', 'autoplay', 'checked', 'controls', 'default', 'defer', 'disabled', 'hidden',
  'loop', 'multiple', 'muted', 'nomodule', 'novalidate', 'open', 'playsinline', 'readonly', 'required', 'reversed', 'selected'
]);
const TABLE_PARTS = new Set(['table', 'thead', 'tbody', 'tfoot', 'tr', 'colgroup']);
const PRE_LIKE = new Set(['pre', 'textarea', 'listing']);

const propName = (name) => {
  if (ALIASES[name]) return ALIASES[name];
  if (/^(data|aria)-/.test(name)) return name;
  if (name.includes('-')) return name.replace(/-([a-z])/g, (_, c) => c.toUpperCase()); // SVG: stroke-width -> strokeWidth
  return name;
};

const SIMPLE = /^\$?[A-Za-z_][\w]*(\.[\w$]+)*$/;
function lookup(raw, scope, where) {
  const p = raw.trim();
  if (p === 'true' || p === 'false' || p === 'null' || p === 'undefined') return p;
  if (/^-?\d+(\.\d+)?$/.test(p)) return p;
  if (!SIMPLE.test(p)) throw new Error(`${where}: "{{ ${raw} }}" is not a dotted lookup. Compute it in renderVals() instead.`);
  const [root, ...rest] = p.split('.');
  const base = root === '$index' ? (scope.idx || 'undefined') : scope.vars.has(root) ? scope.vars.get(root) : 'v.' + root;
  return base + rest.map((k) => (/^\d+$/.test(k) ? `?.[${k}]` : `?.${k}`)).join('');
}

const HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
const hasHole = (s) => s.includes('{{');
const wholeHole = (s) => { const m = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/.exec(s); return m ? m[1] : null; };

function interpolated(str, scope, where) {
  const out = []; let last = 0; let m;
  HOLE.lastIndex = 0;
  while ((m = HOLE.exec(str))) {
    if (m.index > last) out.push(JSON.stringify(str.slice(last, m.index)));
    out.push(`s(${lookup(m[1], scope, where)})`);
    last = m.index + m[0].length;
  }
  if (last < str.length) out.push(JSON.stringify(str.slice(last)));
  return out.length ? out.join(' + ') : '""';
}

function parseTree(source, file) {
  const root = { type: 'root', children: [] }; const stack = [root];
  const parser = new Parser({
    onopentag(name, attribs) { const el = { type: 'el', name, attrs: Object.entries(attribs), children: [] }; stack[stack.length - 1].children.push(el); stack.push(el); },
    onclosetag() { stack.pop(); },
    ontext(data) {
      const kids = stack[stack.length - 1].children; const last = kids[kids.length - 1];
      if (last && last.type === 'text') last.data += data; else kids.push({ type: 'text', data });
    }
  }, { lowerCaseAttributeNames: false, lowerCaseTags: false, recognizeSelfClosing: true, decodeEntities: true });
  parser.write(source); parser.end();
  if (stack.length !== 1) throw new Error(`${file}: unclosed element <${stack[stack.length - 1].name}>`);
  return root;
}

const isStatic = (n) => n.type === 'text' ? !hasHole(n.data)
  : !(n.name === 'sc-if' || n.name === 'sc-for') && n.attrs.every(([, v]) => !hasHole(v)) && n.children.every(isStatic);

/**
 * Returns the JavaScript source of a module whose default export is render(v) -> React element.
 * Fully static subtrees are created once at module load; React skips them on every re-render.
 */
export function compileTemplate(source, { file = 'template', runtimePath }) {
  const tree = parseTree(source, file);
  const rootEls = tree.children.filter((c) => c.type === 'el');
  if (rootEls.length !== 1) throw new Error(`${file}: a page template needs exactly one root element, found ${rootEls.length}`);
  const hoisted = []; let uid = 0;

  const genText = (n, parent, scope) => {
    let d = n.data;
    if (PRE_LIKE.has(parent.name) && parent.children[0] === n) d = d.replace(/^\r?\n/, '');
    if (d === '') return null;
    if (TABLE_PARTS.has(parent.name) && /^\s*$/.test(d)) return null;
    return hasHole(d) ? interpolated(d, scope, file) : JSON.stringify(d);
  };
  const genKids = (el, scope, inStatic) => el.children.map((c) => (c.type === 'text' ? genText(c, el, scope) : gen(c, scope, inStatic))).filter((x) => x != null);

  function genProps(el, scope) {
    const props = [];
    for (const [rawName, value] of el.attrs) {
      const where = `${file} <${el.name} ${rawName}>`;
      let key = propName(rawName); let expr;
      if (rawName === 'ref' || /^on[A-Z]/.test(rawName)) {
        const h = wholeHole(value);
        if (h == null) throw new Error(`${where}: must be a whole {{ value }}`);
        expr = lookup(h, scope, where);
      } else if (rawName === 'style') {
        if (!hasHole(value)) expr = JSON.stringify(parseStyle(value));
        else expr = `css(${interpolated(value, scope, where)})`;
      } else if (hasHole(value)) {
        const h = wholeHole(value);
        expr = h != null ? lookup(h, scope, where) : interpolated(value, scope, where);
      } else if (BOOLEAN_ATTRS.has(rawName.toLowerCase()) && value === '') {
        expr = 'true';
      } else {
        expr = JSON.stringify(value);
      }
      props.push(`${JSON.stringify(key)}: ${expr}`);
    }
    return props.length ? `{ ${props.join(', ')} }` : 'null';
  }

  function gen(el, scope, inStatic = false) {
    if (inStatic) return build(el, scope, true);
    if (isStatic(el)) {
      const code = build(el, scope, true);
      if (el.children.length === 0 && el.attrs.length === 0) return code; // <br>, <i></i>: not worth hoisting
      const name = 'H' + uid++; hoisted.push(`const ${name} = ${code};`); return name;
    }
    return build(el, scope, false);
  }

  function build(el, scope, inStatic) {
    if (el.name === 'sc-if') {
      const v = el.attrs.find(([k]) => k === 'value');
      if (!v) throw new Error(`${file}: <sc-if> needs value="{{ ... }}"`);
      const h = wholeHole(v[1]);
      if (h == null) throw new Error(`${file}: <sc-if value> must be a whole {{ lookup }}`);
      return `(${lookup(h, scope, file)} ? h(F, null${genKids(el, scope, false).map((k) => ', ' + k).join('')}) : null)`;
    }
    if (el.name === 'sc-for') {
      const list = el.attrs.find(([k]) => k === 'list'); const as = el.attrs.find(([k]) => k === 'as');
      if (!list || !as) throw new Error(`${file}: <sc-for> needs list="{{ ... }}" and as="name"`);
      const h = wholeHole(list[1]);
      if (h == null) throw new Error(`${file}: <sc-for list> must be a whole {{ lookup }}`);
      const n = uid++; const item = `L${n}`; const idx = `I${n}`;
      const inner = { vars: new Map(scope.vars).set(as[1], item), idx };
      return `each(${lookup(h, scope, file)}, (${item}, ${idx}) => h(F, { key: ${idx} }${genKids(el, inner, false).map((k) => ', ' + k).join('')}))`;
    }
    const kids = genKids(el, scope, inStatic);
    return `h(${JSON.stringify(el.name)}, ${genProps(el, scope)}${kids.map((k) => ', ' + k).join('')})`;
  }

  const rootCode = build(rootEls[0], { vars: new Map(), idx: null }, false);
  return [
    `import { createElement as h, Fragment as F } from 'react';`,
    `import { s, css, each } from ${JSON.stringify(runtimePath)};`,
    ...hoisted,
    `export default function render(v) {`,
    `  return ${rootCode};`,
    `}`,
    ''
  ].join('\n');
}
