import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

class ApiError extends Error {}
const exports: any = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL("../mobile/src/lib/push-registration-error.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, {
  exports, Error,
  require: (name: string) => name === "@/i18n" ? { msg: (key: string) => key } : { ApiError },
});
const message = exports.pushRegistrationErrorMessage;

test("missing Firebase configuration is not presented as a network failure", () => {
  assert.equal(message(new Error("Default FirebaseApp is not initialized in this process")), "notificationOptIn.configurationError");
  assert.equal(message(new Error("PUSH_NOT_CONFIGURED")), "notificationOptIn.configurationError");
});

test("connection errors and localized API errors keep actionable messages", () => {
  assert.equal(message(new Error("SERVICE_NOT_AVAILABLE")), "notificationOptIn.connectionError");
  assert.equal(message(new ApiError("Your session has expired.")), "Your session has expired.");
  assert.equal(message(new Error("unexpected internal details")), "notificationOptIn.error");
  assert.equal(message(null), "notificationOptIn.error");
});
