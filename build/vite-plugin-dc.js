// Vite plugin: `import render from './template/page.html?dc'` compiles the template (and everything it includes)
// into a render function. Editing any included file reloads the page during `npm run dev`.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileTemplate, expandIncludes } from './dc-compiler.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const runtimePath = path.resolve(here, '../src/runtime/rt.js');

export default function dcTemplates() {
  return {
    name: 'dc-templates',
    enforce: 'pre',
    load(id) {
      const [file, query] = id.split('?');
      if (!file.endsWith('.html') || !/(^|&)dc(&|$)/.test(query || '')) return null;
      const { text, files } = expandIncludes(file);
      files.forEach((f) => this.addWatchFile(f));
      return { code: compileTemplate(text, { file: path.relative(process.cwd(), file), runtimePath }), map: null };
    }
  };
}
