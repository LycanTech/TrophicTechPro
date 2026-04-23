import { formatDuration, formatRelativeTime, truncateSha } from "@/lib/utils"

describe("formatDuration", () => {
  it("returns — for null", () => expect(formatDuration(null)).toBe("—"))
  it("formats seconds under a minute", () => expect(formatDuration(45)).toBe("45s"))
  it("formats whole minutes", () => expect(formatDuration(120)).toBe("2m"))
  it("formats minutes with remainder seconds", () => expect(formatDuration(95)).toBe("1m 35s"))
})

describe("truncateSha", () => {
  it("returns — for null", () => expect(truncateSha(null)).toBe("—"))
  it("truncates to 7 chars", () => expect(truncateSha("abc1234567890")).toBe("abc1234"))
})

describe("formatRelativeTime", () => {
  it("returns just now for sub-minute", () => {
    const d = new Date(Date.now() - 30_000)
    expect(formatRelativeTime(d)).toBe("just now")
  })
  it("returns minutes for < 1hr", () => {
    const d = new Date(Date.now() - 5 * 60_000)
    expect(formatRelativeTime(d)).toBe("5m ago")
  })
})
