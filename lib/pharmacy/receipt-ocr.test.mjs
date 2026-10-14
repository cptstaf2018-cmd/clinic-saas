// Run with: node --test lib/pharmacy/receipt-ocr.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { linesFromOcrPage } from "./receipt-ocr.ts";

const word = (text) => ({ text });

test("lines are built from separate words, so neighbouring numbers never glue together", () => {
  const page = {
    text: "باراسيتامول 500 ملغم 10 1,50015,000",
    blocks: [{ paragraphs: [{ lines: [{ words: ["باراسيتامول", "500", "ملغم", "10", "1,500", "15,000"].map(word) }] }] }],
  };
  assert.deepEqual(linesFromOcrPage(page), ["باراسيتامول 500 ملغم 10 1,500 15,000"]);
});

test("without word data it falls back to the plain text lines", () => {
  assert.deepEqual(linesFromOcrPage({ text: "a 1\nb 2", blocks: null }), ["a 1", "b 2"]);
  assert.deepEqual(linesFromOcrPage({ text: "x", blocks: [] }), ["x"]);
});
