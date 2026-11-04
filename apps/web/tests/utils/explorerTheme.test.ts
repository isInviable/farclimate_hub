import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../app/assets/css/main.css",
);
const css = readFileSync(cssPath, "utf8");

function themeBlock(): string {
  const start = css.indexOf(".theme-explorer-adapt {");
  expect(start).toBeGreaterThan(-1);
  return css.slice(start, css.indexOf("}", start));
}

function declared(block: string, name: string): string | undefined {
  const match = block.match(new RegExp(`${name}:\\s*([^;]+);`));
  return match?.[1]?.trim();
}

describe("ADAPTARIUM explorer theme tokens", () => {
  it("anchors the adapt-blue scale at 600 and keeps the base token", () => {
    expect(declared(css, "--color-adapt-blue-600")).toBe("#0f4fc4");
    expect(declared(css, "--color-adapt-blue")).toBe("#0f4fc4");
  });

  it("redefines the variables the utilities actually read", () => {
    const block = themeBlock();
    expect(declared(block, "--color-neutral-darkest")).toBe("#2c2c2c");
    expect(declared(block, "--color-neutral-lightest")).toBe("#eeeadf");
    expect(declared(block, "--ui-color-primary-600")).toBe("var(--color-adapt-blue-600)");
    expect(declared(block, "--ui-color-neutral-900")).toBe("#2c2c2c");
    expect(declared(block, "--color-gray-500")).toBe("#6a6965");
    expect(declared(block, "--ui-primary")).toBe("var(--color-adapt-blue-600)");
    expect(declared(block, "--ui-bg")).toBe("#eeeadf");
    expect(declared(block, "--ui-secondary")).toBe("var(--color-adapt-teal)");
    expect(declared(block, "--ui-error")).toBe("var(--color-adapt-orange)");
    expect(declared(block, "--ui-warning")).toBe("var(--color-adapt-yellow)");
  });

  it("registers the explorer-adapt variant", () => {
    expect(css).toContain("@custom-variant explorer-adapt");
  });
});
