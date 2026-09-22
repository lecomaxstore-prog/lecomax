import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

test("review photo migration repairs empty and multi-photo inserts while preserving legacy photos", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated;
      create table reviews (id serial primary key, image_url text);
      insert into reviews(image_url) values ('https://example.com/legacy.jpg');`);
    await assert.rejects(db.query("insert into reviews(image_urls) values ($1)", [[]]), /image_urls/);
    const migration = readFileSync(new URL("../supabase/migrations/20260921190000_review_image_urls.sql", import.meta.url), "utf8");
    await db.exec(migration);
    await db.exec(migration);
    await db.query("insert into reviews(image_urls) values ($1), ($2)", [[], ["https://example.com/a.jpg", "https://example.com/b.jpg"]]);
    const { rows } = await db.query("select image_url, image_urls from reviews order by id");
    assert.deepEqual(rows, [
      { image_url: "https://example.com/legacy.jpg", image_urls: null },
      { image_url: null, image_urls: [] },
      { image_url: null, image_urls: ["https://example.com/a.jpg", "https://example.com/b.jpg"] },
    ]);
    await db.exec("set role anon");
    assert.equal((await db.query("select image_urls from reviews")).rows.length, 3);
    await assert.rejects(db.query("insert into reviews(image_urls) values ('{}')"), /permission denied/);
  } finally {
    await db.close();
  }
});
