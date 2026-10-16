import {fileURLToPath as repoFileURLToPath} from 'node:url';
const REPO_ROOT=repoFileURLToPath(new URL('../',import.meta.url)).replaceAll('\\','/').replace(/\/$/,'');
import { build } from 'esbuild';
import fs from 'node:fs';
const ENTRY = (REPO_ROOT + '/plugin/client-src/index.tsx');
const OUT = (REPO_ROOT + '/plugin/lib/client.js');
const MODULE_ID = 'dsh-multi-model-discussion';
const result = await build({
  entryPoints: [ENTRY], bundle: true, write: false, format: 'cjs', platform: 'browser',
  target: 'es2022', jsx: 'automatic',
  external: ['react', 'react/jsx-runtime'],
  legalComments: 'none', charset: 'utf8', logLevel: 'info',
});
const body = result.outputFiles[0].text;
const indented = body.split('\n').map((line) => (line.length > 0 ? '    ' + line : line)).join('\n');
const wrapped =
  'window.__ModuleLoader__.load({\n' +
  "  id: '" + MODULE_ID + "',\n" +
  '  factory: (require) => {\n' +
  '    var module = { exports: {} };\n' +
  '    var exports = module.exports;\n' +
  indented +
  '\n    return module.exports;\n' +
  '  },\n' +
  '});\n';
fs.writeFileSync(OUT, wrapped, 'utf8');
console.log('[build] wrote ' + OUT + ' (' + wrapped.length + ' bytes)');