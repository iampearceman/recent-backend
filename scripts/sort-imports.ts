#!/usr/bin/env tsx
import fs from 'fs'
import path from 'path'

function isTypescriptFile(p: string) {
  return /\.(ts|tsx|js|jsx)$/.test(p)
}

function readFilesRec(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const out: string[] = []

  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (['node_modules', '.git', 'dist', 'build'].includes(e.name)) continue
      out.push(...readFilesRec(full))
    } else if (e.isFile() && isTypescriptFile(full)) {
      out.push(full)
    }
  }

  return out
}

function sortNamedList(inBrace: string) {
  const items = inBrace
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  return items.sort((a, b) => a.localeCompare(b)).join(', ')
}

function sortBracedSpecifiers(source: string) {
  // Sort named imports: import { b, a } from 'x' -> import { a, b } from 'x'
  let updated = source.replace(/(import\s+(?:type\s+)?[^\n]*?\{)([\s\S]*?)(\}\s*from\s*['"][^'\"]+['"])/g, (_m, pre, inner, post) => {
    const sorted = sortNamedList(inner)
    return `${pre} ${sorted} ${post}`
  })

  // Sort named exports: export { b, a } -> export { a, b }
  updated = updated.replace(/(export\s*\{)([\s\S]*?)(\})/g, (_m, pre, inner, post) => {
    const sorted = sortNamedList(inner)
    return `${pre} ${sorted} ${post}`
  })

  return updated
}

function processFile(filePath: string) {
  const text = fs.readFileSync(filePath, 'utf-8')
  const newText = sortBracedSpecifiers(text)
  if (newText === text) return false
  fs.writeFileSync(filePath, newText, 'utf-8')
  return true
}

function main() {
  const start = path.resolve(process.cwd(), 'src')
  const files = readFilesRec(start)
  let changed = 0

  for (const f of files) {
    try {
      if (processFile(f)) {
        console.log('Fixed braced imports/exports:', f)
        changed++
      }
    } catch (err) {
      console.error('Error processing', f, err)
    }
  }

  console.log(`Done. Files changed: ${changed}`)
}

import { fileURLToPath } from 'url'
if (process.argv[1] === fileURLToPath(import.meta.url)) main()
