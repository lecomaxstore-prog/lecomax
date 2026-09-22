import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function load(path: string, modules: Record<string, unknown> = {}, globals: Record<string, unknown> = {}) {
  const exports: any = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, Blob, Uint8Array, TextEncoder, ...globals, require: (name: string) => modules[name] });
  return exports;
}

const photoBytes = new Uint8Array([0xff, 0xd8, 0xff, 0x42]);
class NativeFile {
  name = "cropped-photo.jpg";
  type = "image/jpeg";
  uri: string;
  constructor(uri: string) { this.uri = uri; }
  async bytes() { return photoBytes; }
}
const { uploadFile } = load("../mobile/src/lib/upload-file.ts", { "expo-file-system": { File: NativeFile } });
// Exercise the installed Expo encoder that rejected the old native { uri } parts.
const { convertFormDataAsync } = load("../mobile/node_modules/expo/src/winter/fetch/convertFormData.ts", {
  "../../utils/blobUtils": { blobToArrayBufferAsync: (blob: Blob) => blob.arrayBuffer() },
});
const form = (file: unknown) => ({ entries: () => [["file", file]] });

test("native photo bytes and MIME type can be encoded by Expo fetch", async () => {
  const file = uploadFile({ uri: "file:///cache/cropped-photo.jpg" });
  assert.equal(file.uri, "file:///cache/cropped-photo.jpg");
  const { body } = await convertFormDataAsync(form(file), "boundary");
  const content = Buffer.from(body);
  assert.ok(content.includes(Buffer.from(photoBytes)));
  assert.match(content.toString(), /filename="cropped-photo.jpg"/);
  assert.match(content.toString(), /content-type: image\/jpeg/);
});

test("regression: old native URI-only parts fail before making a network request", async () => {
  await assert.rejects(convertFormDataAsync(form({ uri: "file:///cache/photo.jpg", name: "photo.jpg", type: "image/jpeg" })), /Unsupported FormDataPart/);
});

test("browser uploads preserve the selected File", async () => {
  const browser = load("../mobile/src/lib/upload-file.web.ts");
  const file = new File([photoBytes], "photo.jpg", { type: "image/jpeg" });
  assert.equal(browser.uploadFile({ uri: "blob:test", file }), file);
  const { body } = await convertFormDataAsync(form(file));
  assert.ok(Buffer.from(body).includes(Buffer.from(photoBytes)));
  assert.throws(() => browser.uploadFile({ uri: "blob:missing" }), /No browser file/);
});

test("authenticated avatar upload survives native FormData and reaches the server with photo bytes", async () => {
  // Use the installed native FormData patch as well as its actual multipart encoder.
  class RNFormData { _parts: unknown[] = []; }
  const { installFormDataPatch } = load("../mobile/node_modules/expo/src/winter/FormData.ts");
  const NativeFormData = installFormDataPatch(RNFormData);
  const received: File[] = [];
  const { apiRequest } = load("../mobile/src/lib/api-client.ts", {
    "@/i18n": { msg: (key: string) => key },
    "@/i18n/errors": { localizedError: (value: unknown) => value },
    "@/lib/runtime-config": { runtimeConfig: { apiUrl: "https://example.test" } },
    "@/lib/session-timeout": { withSessionTimeout: (operation: Promise<unknown>) => operation },
    "@/lib/supabase": { supabase: { auth: { getSession: async () => ({ data: { session: { access_token: "test-token" } } }) } } },
  }, {
    FormData: NativeFormData, Headers, AbortController, setTimeout, clearTimeout,
    fetch: async (url: string, options: RequestInit) => {
      assert.equal(url, "https://example.test/api/account/avatar");
      const headers = new Headers(options.headers);
      assert.equal(headers.get("authorization"), "Bearer test-token");
      assert.equal(headers.has("content-type"), false, "fetch must supply the multipart boundary");
      const { body, boundary } = await convertFormDataAsync(options.body);
      const request = new Request(url, {
        method: options.method,
        headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
        body,
      });
      const file = (await request.formData()).get("file");
      assert.ok(file instanceof File);
      received.push(file);
      return Response.json({ avatarUrl: "https://example.test/avatar.jpg" }, { status: 201 });
    },
  });
  const body = new NativeFormData();
  body.append("file", uploadFile({ uri: "file:///cache/cropped-photo.jpg" }));
  const result = await apiRequest("/api/account/avatar", { method: "POST", authenticated: true, body });
  assert.equal(result.avatarUrl, "https://example.test/avatar.jpg");
  assert.equal(received.length, 1);
  assert.equal(received[0].name, "cropped-photo.jpg");
  assert.equal(received[0].type, "image/jpeg");
  assert.deepEqual(new Uint8Array(await received[0].arrayBuffer()), photoBytes);

  const legacyBody = new NativeFormData();
  legacyBody.append("file", { uri: "file:///cache/photo.jpg", name: "photo.jpg", type: "image/jpeg" });
  await assert.rejects(apiRequest("/api/account/avatar", {
    method: "POST", authenticated: true, body: legacyBody,
  }), (error: any) => error.code === "NETWORK_ERROR");
  assert.equal(received.length, 1, "the legacy payload fails before the server receives a file");
});
