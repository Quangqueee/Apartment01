const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
module.exports = function load(file, mocks = {}) {
  const filename = path.resolve(file);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const module = { exports: {} };
  function localRequire(name) {
    if (mocks[name]) return mocks[name];
    if (name.startsWith('@/') || name.startsWith('.')) {
      const base = name.startsWith('@/') ? path.resolve(`src/${name.slice(2)}`) : path.resolve(path.dirname(filename), name);
      return load(fs.existsSync(`${base}.ts`) ? `${base}.ts` : `${base}.tsx`, mocks);
    }
    return require(name);
  }
  new Function('require', 'module', 'exports', compiled)(localRequire, module, module.exports);
  return module.exports;
};
