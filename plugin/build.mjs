/**
 * Build the browser half of the plugin.
 *
 * DSH loads a client plugin bundle as a plain <script> that registers a lazy
 * factory through `window.__ModuleLoader__.load({ id, factory })`. A bare
 * esbuild ESM output (`--format=esm`) does NOT satisfy that contract -- the
 * page fails with "Cannot use import statement outside a module" and the whole
 * web boot is blocked. So the CJS body esbuild produces is wrapped in the
 * loader envelope here, in one place.
 *
 * Usage:  node build.mjs      (esbuild must be installed: npm i)
 */
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const entry = path.join(here, 'client-src', 'index.tsx');
const outFile = path.join(here, 'lib', 'client.js');
/** Must match the package name the host resolves for this bundle. */
const MODULE_ID = 'dsh-multi-model-discussion';

const result = await build({
  entryPoints: [entry],
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  jsx: 'automatic',
  // Both are in the DSH client platform seed table, so they resolve at runtime
  // and must not be bundled.
  external: ['react', 'react/jsx-runtime'],
  legalComments: 'none',
  charset: 'utf8',
  logLevel: 'info',
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

fs.writeFileSync(outFile, wrapped, 'utf8');
console.log('[build] wrote ' + outFile + ' (' + wrapped.length + ' bytes)');
