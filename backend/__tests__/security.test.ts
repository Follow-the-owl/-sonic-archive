// Unit tests for the security helpers. Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  hashPassword, verifyPassword, escapeHtml, escapeHtmlFields, escapeRegex,
  isRateLimited, isAllowedMediaUrl, isAuthorizedAdmin, isSessionExpired,
} from "../security.js";

test("passwords: new hashes are salted scrypt and verify correctly", () => {
  const h = hashPassword("correct horse");
  assert.match(h, /^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
  assert.notEqual(h, hashPassword("correct horse")); // random salt
  assert.equal(verifyPassword("correct horse", h), true);
  assert.equal(verifyPassword("wrong", h), false);
});

test("passwords: legacy unsalted SHA-256 hashes still verify (existing users keep working)", () => {
  const legacy = crypto.createHash("sha256").update("oldpass").digest("hex");
  assert.equal(verifyPassword("oldpass", legacy), true);
  assert.equal(verifyPassword("nope", legacy), false);
});

test("passwords: empty or malformed stored hashes are rejected", () => {
  assert.equal(verifyPassword("x", ""), false);
  assert.equal(verifyPassword("x", null), false);
  assert.equal(verifyPassword("x", "scrypt$zz"), false);
});

test("admin allow-list: owner emails are admins, a fake system address is not", () => {
  assert.equal(isAuthorizedAdmin("EVIANACONCEPTS1@gmail.com"), true);
  assert.equal(isAuthorizedAdmin("admin@system.local"), false);
  assert.equal(isAuthorizedAdmin("random@user.com"), false);
  assert.equal(isAuthorizedAdmin(null), false);
});

test("escaping: HTML special characters are neutralised", () => {
  assert.equal(escapeHtml(`<img src=x onerror="alert(1)">&'`), "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;&amp;&#39;");
  assert.deepEqual(escapeHtmlFields({ a: "<b>", n: 5 }), { a: "&lt;b&gt;", n: 5 });
});

test("escaping: emails containing regex characters match literally", () => {
  const re = new RegExp(`^${escapeRegex("a+b.c@x.com")}$`, "i");
  assert.equal(re.test("A+B.C@x.com"), true);
  assert.equal(re.test("aab.c@x.com"), false);
});

test("audio proxy guard: only own storage/CDN hosts are allowed (SSRF protection)", () => {
  assert.equal(isAllowedMediaUrl("https://pub-abc123.r2.dev/a.mp3"), true);
  assert.equal(isAllowedMediaUrl("https://res.cloudinary.com/demo/video/upload/x.mp3"), true);
  assert.equal(isAllowedMediaUrl("http://169.254.169.254/latest/meta-data/"), false);
  assert.equal(isAllowedMediaUrl("http://localhost:3000/api/admin/users"), false);
  assert.equal(isAllowedMediaUrl("https://pub-x.r2.dev.evil.com/a.mp3"), false);
  assert.equal(isAllowedMediaUrl("file:///etc/passwd"), false);
  assert.equal(isAllowedMediaUrl("not a url"), false);
});

test("rate limiter: allows the limit, blocks the next call, keys are independent", () => {
  const key = `t-${Date.now()}`;
  const results = Array.from({ length: 12 }, () => isRateLimited(key, 10, 60_000));
  assert.deepEqual(results.slice(0, 10).every((r) => r === false), true);
  assert.equal(results[10], true);
  assert.equal(isRateLimited(`${key}-other`, 10, 60_000), false);
});

test("sessions: expire after the max age; sessions without a timestamp are not expired", () => {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  assert.equal(isSessionExpired(new Date(now - 1 * day), now), false);
  assert.equal(isSessionExpired(new Date(now - 31 * day), now), true);
  assert.equal(isSessionExpired(undefined, now), false);
  assert.equal(isSessionExpired("garbage", now), false);
});
