import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

type AddressService = {
  loadAccountAddresses(): Promise<{ addresses: any[]; defaultId: string | null }>;
  saveAccountAddresses(addresses: any[], selected: string | null): Promise<void>;
};
function harness(values: unknown[]) {
  let saved: any[] = [];
  const exports = {} as AddressService;
  const source = readFileSync(new URL("../mobile/src/services/addresses.ts", import.meta.url), "utf8");
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    exports,
    require(name: string) {
      if (name === "@/i18n") return { msg: (key: string) => key };
      if (name === "@/lib/supabase") return { supabase: { auth: {
        getUser: async () => ({ data: { user: { email: "buyer@example.com", user_metadata: { addresses: values } } } }),
        updateUser: async ({ data }: any) => { saved = data.addresses; return {}; },
      } } };
      throw new Error(name);
    },
  });
  return { service: exports, saved: () => JSON.parse(JSON.stringify(saved)) };
}
const original = {
  id: "a", label: "Bureau", fullName: "Client", line1: "12 rue des Fleurs",
  line2: "Appartement 4", city: "Rabat", zip: "10000", country: "Maroc",
  phone: "0600000000", isDefault: true,
};

test("website address survives app load and save without losing structured fields", async () => {
  const h = harness([original]);
  const result = await h.service.loadAccountAddresses();
  assert.equal(result.addresses[0].address, "12 rue des Fleurs, Appartement 4, 10000");
  await h.service.saveAccountAddresses(result.addresses, result.defaultId);
  assert.deepEqual(h.saved(), [original]);
});

test("editing contact details preserves the street, postal code, country and label", async () => {
  const h = harness([{ ...original, country: "France" }]);
  const { addresses } = await h.service.loadAccountAddresses();
  addresses[0].name = "Nouveau nom";
  await h.service.saveAccountAddresses(addresses, "a");
  assert.deepEqual(h.saved(), [{ ...original, fullName: "Nouveau nom", country: "France" }]);
});

test("replacing the combined street never appends stale apartment or postal details", async () => {
  const h = harness([original]);
  const { addresses } = await h.service.loadAccountAddresses();
  addresses[0].address = "20 nouvelle rue, Appartement 5, 20000";
  await h.service.saveAccountAddresses(addresses, "a");
  assert.equal(h.saved()[0].line1, addresses[0].address);
  assert.equal(h.saved()[0].line2, "");
  assert.equal(h.saved()[0].zip, "");
  assert.equal(h.saved()[0].label, "Bureau");
});

test("invalid remote default falls back to a usable address", async () => {
  const h = harness([{ ...original, id: "broken", line1: "", line2: "", zip: "" }, { ...original, isDefault: false }]);
  assert.equal((await h.service.loadAccountAddresses()).defaultId, "a");
});

test("save keeps exactly one default even when selection is missing or truncated", async () => {
  const h = harness([original]);
  const { addresses } = await h.service.loadAccountAddresses();
  const many = Array.from({ length: 11 }, (_, i) => ({ ...addresses[0], id: String(i) }));
  for (const selected of [null, "missing", "10", "3"]) {
    await h.service.saveAccountAddresses(many, selected);
    assert.equal(h.saved().length, 10);
    assert.deepEqual(h.saved().filter(a => a.isDefault).map(a => a.id), [selected === "3" ? "3" : "0"]);
  }
});

test("legacy app-only addresses remain compatible with the website", async () => {
  const h = harness([]);
  await h.service.saveAccountAddresses([{ id: "new", name: "Client", phone: "0600000000", city: "Rabat", address: "12 rue", email: "buyer@example.com" }], null);
  assert.equal(h.saved()[0].line1, "12 rue");
  assert.equal(h.saved()[0].country, "Maroc");
  assert.equal(h.saved()[0].isDefault, true);
  await h.service.saveAccountAddresses([], null);
  assert.deepEqual(h.saved(), []);
});
