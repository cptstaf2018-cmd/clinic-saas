// Run with: node --test lib/image-type.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { detectImageType } from "./image-type.ts";

const buf = (...bytes) => Buffer.from([...bytes, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

test("recognises jpeg, png and webp by their content", () => {
  assert.deepEqual(detectImageType(buf(0xff, 0xd8, 0xff, 0xe0)), { mime: "image/jpeg", ext: "jpg" });
  assert.deepEqual(detectImageType(buf(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)), { mime: "image/png", ext: "png" });
  const webp = Buffer.concat([Buffer.from("RIFF"), Buffer.from([1, 2, 3, 4]), Buffer.from("WEBP")]);
  assert.deepEqual(detectImageType(webp), { mime: "image/webp", ext: "webp" });
});

test("rejects pdf, html, svg and random bytes even if named like an image", () => {
  assert.equal(detectImageType(Buffer.from("%PDF-1.7 stuff")), null);
  assert.equal(detectImageType(Buffer.from("<html><script>alert(1)</script>")), null);
  assert.equal(detectImageType(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'></svg>")), null);
  assert.equal(detectImageType(Buffer.from([1, 2, 3])), null);
  assert.equal(detectImageType(Buffer.alloc(0)), null);
});

test("a RIFF file that is not webp (e.g. wav) is rejected", () => {
  const wav = Buffer.concat([Buffer.from("RIFF"), Buffer.from([1, 2, 3, 4]), Buffer.from("WAVE")]);
  assert.equal(detectImageType(wav), null);
});
