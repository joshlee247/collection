// @vitest-environment node
import { describe, expect, test } from "vitest"
import { authConfig, createToken, passcodeMatches, safeNext, SESSION_MAX_AGE, verifyToken } from "./session"

const now = Date.parse("2026-11-25T10:00:00Z")

describe("session", () => {
  test("a token verifies with its secret until it expires", async () => {
    const token = await createToken("secret", now)
    expect(await verifyToken(token, "secret", now)).toBe(true)
    expect(await verifyToken(token, "secret", now + (SESSION_MAX_AGE - 60) * 1000)).toBe(true)
    expect(await verifyToken(token, "secret", now + (SESSION_MAX_AGE + 60) * 1000)).toBe(false)
    expect(await verifyToken(token, "other", now)).toBe(false)
  })

  test("tampered or malformed tokens are rejected", async () => {
    const token = await createToken("secret", now)
    const [expires, signature] = token.split(".")
    expect(await verifyToken(`${Number(expires) + 9999}.${signature}`, "secret", now)).toBe(false)
    expect(await verifyToken(`${expires}.${signature.slice(0, -2)}xx`, "secret", now)).toBe(false)
    for (const bad of [undefined, "", "abc", "1.", ".sig", "x.y"]) {
      expect(await verifyToken(bad, "secret", now)).toBe(false)
    }
    expect(await verifyToken(token, "", now)).toBe(false)
  })

  test("passcodes compare exactly", async () => {
    expect(await passcodeMatches("pikachu-25", "pikachu-25")).toBe(true)
    expect(await passcodeMatches("pikachu-26", "pikachu-25")).toBe(false)
    expect(await passcodeMatches("", "")).toBe(false)
  })

  test("only same-site paths are followed after signing in", () => {
    expect(safeNext("/p/bin-1")).toBe("/p/bin-1")
    expect(safeNext("//evil.example")).toBe("/")
    expect(safeNext("/\\evil.example")).toBe("/")
    expect(safeNext("https://evil.example")).toBe("/")
    expect(safeNext(null)).toBe("/")
  })

  test("deployed without a passcode, the app stays locked", () => {
    expect(authConfig({ NODE_ENV: "development" }).enabled).toBe(false)
    expect(authConfig({ NODE_ENV: "production" })).toMatchObject({ enabled: true, passcode: "", secret: "" })
    expect(authConfig({ VERCEL: "1", APP_PASSCODE: "x" })).toMatchObject({ enabled: true, secret: "passcode:x" })
    expect(authConfig({ APP_PASSCODE: "x", SESSION_SECRET: "s" }).secret).toBe("s")
  })
})
