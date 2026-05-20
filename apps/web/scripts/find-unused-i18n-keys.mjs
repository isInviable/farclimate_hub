#!/usr/bin/env node
/**
 * Lists i18n keys from i18n/locales/en.json that do not appear as literal strings
 * in apps/web source (.vue, .ts, .js, …).
 *
 * Limitations (manual review before deleting):
 * - Dynamic keys not built as `prefix.${var}` in the same file are still invisible.
 * - Keys only referenced from outside apps/web look "unused".
 * - Keys split across expressions are not detected.
 *
 * Heuristic: if the corpus contains $t(`foo.`) or t(`foo.${...}`), every key starting
 * with that prefix is treated as referenced. Template literals like `pins.kinds.${kind}`
 * (even when passed to t(key) later) are detected via the `.${` pattern.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WEB_ROOT = path.join(__dirname, '..')
const EN_JSON = path.join(WEB_ROOT, 'i18n', 'locales', 'en.json')

const SKIP_DIRS = new Set([
  'node_modules',
  '.nuxt',
  'dist',
  '.output',
  'coverage',
  '.git',
])

const SOURCE_EXT = /\.(vue|ts|mts|cts|js|jsx|tsx)$/

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Leaf string keys only (dot paths). */
function flattenStringKeys(obj, prefix = '') {
  const out = []
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      out.push(...flattenStringKeys(v, p))
    } else if (typeof v === 'string') {
      out.push(p)
    }
  }
  return out
}

function walkSourceFiles(dir, acc = []) {
  let entries
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return acc
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue
      walkSourceFiles(full, acc)
    } else if (ent.isFile() && SOURCE_EXT.test(ent.name)) {
      acc.push(full)
    }
  }
  return acc
}

function keyAppearsAsLiteral(key, corpus) {
  const e = escapeRegExp(key)
  // 'foo.bar' or "foo.bar" anywhere (covers $t('…'), t("…"), :label="'…'", etc.)
  return new RegExp(`['"]${e}['"]`).test(corpus)
}

/** e.g. t(`pills.${pill}`) → prefix "pills." ; t(`recipe.sections.${key}`) → "recipe.sections." */
function extractDynamicPrefixes(corpus) {
  const prefixes = new Set()
  const re = /\b(?:\$t|t)\(\s*`([a-z0-9_.]+)\$\{/gi
  let m
  while ((m = re.exec(corpus)) !== null) {
    prefixes.add(m[1])
  }
  // const key = `pins.kinds.${kind}` then t(key) — capture dotted path ending in `.` before ${
  const tplRe = /`([a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+)\.\$\{/gi
  while ((m = tplRe.exec(corpus)) !== null) {
    prefixes.add(`${m[1]}.`)
  }
  return prefixes
}

function keyCoveredByDynamicPrefix(key, prefixes) {
  for (const p of prefixes) {
    if (key === p || key.startsWith(p)) return true
  }
  return false
}

function main() {
  const raw = fs.readFileSync(EN_JSON, 'utf8')
  const en = JSON.parse(raw)
  const keys = flattenStringKeys(en).sort()

  const scanRoots = [
    path.join(WEB_ROOT, 'app'),
    path.join(WEB_ROOT, 'composables'),
    path.join(WEB_ROOT, 'plugins'),
    path.join(WEB_ROOT, 'server'),
    path.join(WEB_ROOT, 'utils'),
    path.join(WEB_ROOT, 'middleware'),
    path.join(WEB_ROOT, 'layouts'),
    path.join(WEB_ROOT, 'pages'),
    path.join(WEB_ROOT, 'stores'),
    path.join(WEB_ROOT, 'tests'),
  ].filter((p) => fs.existsSync(p))

  const files = []
  for (const root of scanRoots) {
    walkSourceFiles(root, files)
  }
  // Root-level nuxt.config, etc.
  for (const name of ['nuxt.config.ts', 'app.config.ts']) {
    const p = path.join(WEB_ROOT, name)
    if (fs.existsSync(p)) files.push(p)
  }

  const corpus = files.map((f) => fs.readFileSync(f, 'utf8')).join('\n')
  const dynamicPrefixes = extractDynamicPrefixes(corpus)

  const unusedStrict = keys.filter((k) => !keyAppearsAsLiteral(k, corpus))
  const unused = unusedStrict.filter((k) => !keyCoveredByDynamicPrefix(k, dynamicPrefixes))
  const usedDynamic = unusedStrict.length - unused.length
  const usedLiteral = keys.length - unusedStrict.length

  console.log(`Locale file: ${path.relative(process.cwd(), EN_JSON)}`)
  console.log(`Scanned ${files.length} source files under apps/web`)
  console.log(`Total string keys: ${keys.length}`)
  console.log(`Referenced (literal '…' / "…"): ${usedLiteral}`)
  console.log(`Referenced (dynamic \`prefix.\${…}\` families): ${usedDynamic}`)
  console.log(`Unused after both checks: ${unused.length}`)
  if (dynamicPrefixes.size) {
    console.log('')
    console.log('Dynamic prefixes detected:')
    for (const p of [...dynamicPrefixes].sort()) console.log(`  ${p}`)
  }
  console.log('')
  if (unused.length) {
    console.log('Unused keys:')
    for (const k of unused) console.log(`  ${k}`)
  } else {
    console.log('No unused keys detected.')
  }
}

main()
