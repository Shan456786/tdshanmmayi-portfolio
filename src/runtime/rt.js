// Helpers called by compiled templates (see build/dc-compiler.js). Keep this file tiny and dependency-free.
import { parseStyle } from './style.js';

/** Text and string-attribute holes: null, undefined and functions render as nothing. */
export const s = (x) => (x == null || typeof x === 'function' ? '' : String(x));

/** <sc-for>: anything that is not an array renders nothing. */
export const each = (list, fn) => (Array.isArray(list) ? list.map(fn) : []);

/** Inline styles that contain {{holes}}. Parsed results are cached by string; the cache is bounded. */
const cache = new Map();
export function css(text) {
  const key = String(text == null ? '' : text);
  let obj = cache.get(key);
  if (!obj) {
    if (cache.size > 800) cache.clear();
    obj = parseStyle(key);
    cache.set(key, obj);
  }
  return obj;
}
