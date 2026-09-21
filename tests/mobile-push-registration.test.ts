import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function service({ provisional = false, disabled = false, fail = false, granted = true } = {}) {
  const storage = new Map<string, string>();
  if (disabled) storage.set("lecomax.push-disabled", "true");
  const calls: string[] = [];
  const permission = { granted, status: granted ? "granted" : "undetermined", canAskAgain: true, ios: { status: provisional ? 3 : 0 } };
  const exports: any = {};
  const modules: Record<string, unknown> = {
    "@/i18n": { msg: (key: string) => key },
    "expo-device": { isDevice: true },
    "react-native": { Platform: { OS: "android" } },
    "expo-constants": { default: { easConfig: { projectId: "project" } } },
    "expo-notifications": {
      IosAuthorizationStatus: { PROVISIONAL: 3 }, AndroidImportance: { HIGH: 4 },
      setNotificationHandler: () => {},
      setNotificationChannelAsync: async () => { calls.push("channel"); },
      getPermissionsAsync: async () => permission,
      requestPermissionsAsync: async () => { calls.push("prompt"); return permission; },
      getExpoPushTokenAsync: async () => { calls.push("token"); return { data: "ExpoPushToken[test]" }; },
    },
    "@/lib/secure-storage": {
      secureGetItem: async (key: string) => storage.get(key) ?? null,
      secureSetItem: async (key: string, value: string) => { storage.set(key, value); },
      secureRemoveItem: async (key: string) => { storage.delete(key); },
    },
    "@/lib/api-client": { apiRequest: async () => { calls.push("subscribe"); if (fail) throw new Error("offline"); } },
  };
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL("../mobile/src/services/notifications.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, require: (name: string) => modules[name] });
  return { api: exports, calls, storage };
}

test("iOS provisional authorization registers without asking again", async () => {
  const { api, calls } = service({ provisional: true, granted: false });
  assert.ok(await api.registerForPushNotifications(undefined, { requestPermission: false }));
  assert.equal(calls.includes("prompt"), false);
  assert.equal((await api.getPushNotificationState()).enabled, true);
});
test("background registration respects device opt-out and never asks permission", async () => {
  for (const options of [{ disabled: true }, { granted: false }]) {
    const { api, calls } = service(options);
    assert.equal(await api.registerForPushNotifications(undefined, { requestPermission: false }), null);
    assert.equal(calls.includes("prompt"), false);
    assert.equal(calls.includes("subscribe"), false);
  }
});
test("failed server registration cannot report notifications as enabled", async () => {
  const { api, storage } = service({ fail: true });
  await assert.rejects(api.registerForPushNotifications(), /offline/);
  assert.equal(storage.has("lecomax.push-token"), false);
  assert.equal((await api.getPushNotificationState()).enabled, false);
});
test("explicit opt-in restores a disabled device after successful registration", async () => {
  const { api, storage, calls } = service({ disabled: true });
  await api.registerForPushNotifications(undefined, { requestPermission: true });
  assert.equal(storage.has("lecomax.push-disabled"), false);
  assert.ok(calls.indexOf("channel") < calls.indexOf("token"));
  assert.equal((await api.getPushNotificationState()).enabled, true);
});
