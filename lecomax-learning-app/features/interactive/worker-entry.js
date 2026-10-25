import { newQuickJSWASMModuleFromVariant, newVariant } from 'quickjs-emscripten-core';
import variant from '@jitl/quickjs-wasmfile-release-sync';
import quickWasm from '@jitl/quickjs-wasmfile-release-sync/wasm';
import initSqlJs from 'sql.js';
import sqlWasm from 'sql.js/dist/sql-wasm.wasm';
import ts from 'typescript';
import reactBundle from './react-bundle.json';
import { sqlSchema } from './model';

const bytes = value => value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
self.onmessage = async ({ data }) => {
  const result = { output: '', error: '', tables: [], tests: [] };
  if (!data || typeof data.code !== 'string' || data.code.length > 32000) return;
  try {
    if (data.language === 'sql') {
      const SQL = await initSqlJs({ wasmBinary: bytes(sqlWasm) });
      const db = new SQL.Database();
      try {
        db.run('PRAGMA hard_heap_limit=33554432; PRAGMA max_page_count=2048; PRAGMA foreign_keys=ON;');
        db.run(sqlSchema);
        let total = 0;
        for (const statement of db.iterateStatements(data.code)) {
          const columns = statement.getColumnNames(); if(columns.length > 30) throw new Error("At most 30 result columns per query."); const values = [];
          while (statement.step()) {
            if (++total > 200) throw new Error('Result exceeds 200 rows. Add LIMIT or a narrower WHERE clause.');
            values.push(statement.get().map(v => v instanceof Uint8Array ? `[BLOB ${v.length} bytes]` : typeof v === 'string' ? v.slice(0, 2000) : v));
          }
          if (columns.length) result.tables.push({ columns, values });
          if (result.tables.length > 10) throw new Error('At most 10 result tables per run.');
        }
        result.output = `${total} row(s). Each run starts with a fresh sample database.`;
        if (data.test) {
          const rows = result.tables.at(-1)?.values || [];
          result.tests.push({ label: 'Return the two Rabat customers, Amina then Sara (one name column)', passed: JSON.stringify(rows) === JSON.stringify([['Amina'], ['Sara']]), actual: JSON.stringify(rows) });
        }
      } finally { db.close(); }
    } else {
      let code = data.code;
      if (data.language === 'typescript' || data.language === 'react') {
        const compiled = ts.transpileModule(code, { fileName: data.language === 'react' ? 'lesson.tsx' : 'lesson.ts', compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.React }, reportDiagnostics: true });
        const errors = compiled.diagnostics?.filter(d => d.category === ts.DiagnosticCategory.Error);
        if (errors?.length) throw new Error(errors.map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n')).join('\n'));
        code = compiled.outputText;
      }
      const engine = await newQuickJSWASMModuleFromVariant(newVariant(variant, { wasmBinary: bytes(quickWasm), locateFile: name => name }));
      const runtime = engine.newRuntime();
      runtime.setMemoryLimit(16 * 1024 * 1024); runtime.setMaxStackSize(256 * 1024);
      const deadline = Date.now() + 1500; runtime.setInterruptHandler(() => Date.now() > deadline);
      const vm = runtime.newContext();
      try {
        const consoleObject = vm.newObject();
        for (const name of ['log', 'warn', 'error']) {
          const fn = vm.newFunction(name, (...args) => { if (result.output.length < 16000) result.output += args.map(arg => { const v = vm.dump(arg); return typeof v === 'string' ? v : JSON.stringify(v); }).join(' ').slice(0, 2000) + '\n'; });
          vm.setProp(consoleObject, name, fn); fn.dispose();
        }
        vm.setProp(vm.global, 'console', consoleObject); consoleObject.dispose();
        if (data.language === 'react') {
          const loaded = vm.evalCode(reactBundle, 'react-runtime.js');
          if (loaded.error) { const e = vm.dump(loaded.error); loaded.error.dispose(); throw new Error(JSON.stringify(e)); }
          loaded.value.dispose();
          code += '\nrenderLessonComponent(App);';
        }
        const outcome = vm.evalCode(code, 'lesson.js');
        if (outcome.error) { const error = vm.dump(outcome.error); outcome.error.dispose(); throw new Error(`${error.name || 'Error'}: ${error.message || error}\n${error.stack || ''}`); }
        if (data.language === 'react') result.output = String(vm.dump(outcome.value)).slice(0,16000);
        outcome.value.dispose();
        if (data.test && data.language !== 'react') for (const n of [4, -3, 0, 1.5]) {
          const checked = vm.evalCode(`square(${n})`, 'exercise-test.js');
          const actual = vm.dump(checked.error || checked.value); const passed = !checked.error && actual === n * n;
          result.tests.push({ label: `square(${n}) = ${n * n}`, passed, actual: JSON.stringify(actual).slice(0, 1000) });
          (checked.error || checked.value).dispose();
        }
      } finally { vm.dispose(); runtime.dispose(); }
    }
  } catch (error) { result.error = String(error.stack || error).slice(0, 6000); }
  self.postMessage(result);
};
