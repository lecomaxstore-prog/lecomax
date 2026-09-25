import test from "node:test";
import assert from "node:assert/strict";
import { createChatDictation, type ChatRecognition, type DictationState } from "../lib/chat-dictation.ts";

function setup(draft = "") {
  let recognition: FakeRecognition;
  class FakeRecognition implements ChatRecognition {
    lang = ""; continuous = false; interimResults = false; maxAlternatives = 0;
    onstart: ChatRecognition["onstart"] = null;
    onresult: ChatRecognition["onresult"] = null;
    onerror: ChatRecognition["onerror"] = null;
    onend: ChatRecognition["onend"] = null;
    stops = 0; aborts = 0;
    constructor() { recognition = this; }
    start() { this.onstart?.(); }
    stop() { this.stops++; }
    abort() { this.aborts++; }
    result(...texts: string[]) { this.onresult?.({ results: texts.map(transcript => ({ 0: { transcript } })) }); }
  }
  const states: DictationState[] = [];
  const errors: string[] = [];
  const texts: string[] = [];
  const controller = createChatDictation({ Recognition: FakeRecognition, draft, onText: text => texts.push(text), onState: state => states.push(state), onError: error => errors.push(error) });
  return { controller, recognition: recognition!, states, errors, texts };
}

test("dictation preserves the draft and replaces interim hypotheses without duplicating text", () => {
  const h = setup("Bonjour");
  h.controller.start();
  assert.equal(h.recognition.lang, "fr-FR");
  assert.equal(h.recognition.interimResults, true);
  h.recognition.result("je veux");
  h.recognition.result("je voudrais", "une livraison");
  assert.deepEqual(h.texts, ["Bonjour je veux", "Bonjour je voudrais une livraison"]);
  h.recognition.onend?.();
  assert.deepEqual(h.states, ["starting", "listening", "idle"]);
});

test("stop waits for the final transcript and is safe to press twice", () => {
  const h = setup();
  h.controller.start();
  h.controller.stop(); h.controller.stop();
  assert.equal(h.recognition.stops, 1);
  assert.equal(h.states.at(-1), "stopping");
  h.recognition.result("Mon message final");
  h.recognition.onend?.();
  assert.equal(h.texts.at(-1), "Mon message final");
  assert.equal(h.states.at(-1), "idle");
});

test("closing dictation releases the microphone and ignores late results", () => {
  const h = setup();
  h.controller.start();
  const lateResult = h.recognition.onresult;
  h.controller.cancel();
  lateResult?.({ results: [{ 0: { transcript: "Late text" } }] });
  assert.equal(h.recognition.aborts, 1);
  assert.equal(h.texts.length, 0);
  assert.equal(h.recognition.onresult, null);
});

test("permission denial reports actionable feedback and preserves existing text", () => {
  const h = setup("Brouillon");
  h.controller.start();
  h.recognition.onerror?.({ error: "not-allowed" });
  assert.match(h.errors[0], /Autorisez le microphone/);
  assert.equal(h.texts.length, 0);
  assert.equal(h.states.at(-1), "idle");
  assert.equal(h.recognition.aborts, 1);
});

test("dictation respects the message limit and stops recording", () => {
  const h = setup("x".repeat(1995));
  h.controller.start();
  h.recognition.result("une longue phrase");
  assert.equal(h.texts.at(-1)?.length, 2000);
  assert.equal(h.recognition.stops, 1);
  h.controller.cancel();
});

test("silent recordings provide retry feedback", () => {
  const h = setup();
  h.controller.start();
  h.recognition.onend?.();
  assert.match(h.errors[0], /Aucune voix détectée/);
  assert.equal(h.states.at(-1), "idle");
});

test("recording stops after a minute and aborts if the browser never finishes", context => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const h = setup();
  h.controller.start();
  context.mock.timers.tick(60_000);
  assert.equal(h.recognition.stops, 1);
  context.mock.timers.tick(2000);
  assert.equal(h.recognition.aborts, 1);
  assert.equal(h.states.at(-1), "idle");
});
