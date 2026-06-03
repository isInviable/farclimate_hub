import { describe, expect, it } from "vitest";

function resolveReturnPath(
  fullPath: string | undefined,
  returnPath?: string,
): string {
  if (returnPath) return returnPath;
  return fullPath && fullPath !== "/login" ? fullPath : "/";
}

describe("auth prompt return path", () => {
  it("prefers explicit returnPath", () => {
    expect(resolveReturnPath("/explorer/explorer", "/explorer/board")).toBe(
      "/explorer/board",
    );
  });

  it("uses current fullPath when no override", () => {
    expect(resolveReturnPath("/explorer/explorer?q=test")).toBe(
      "/explorer/explorer?q=test",
    );
  });

  it("falls back away from login route", () => {
    expect(resolveReturnPath("/login")).toBe("/");
  });
});
