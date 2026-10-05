import assert from "node:assert/strict"
import { test } from "node:test"
import { parseBulkWords } from "../src/lib/bulkWords.ts"

test("pasted rows preserve accents, trim cells, and ignore blank lines", () => {
  assert.deepEqual(parseBulkWords("  ciao\t szia\r\ngrazie\tköszönöm\r\n\r\n", true), {
    words: [{ italian: "ciao", hungarian: "szia" }, { italian: "grazie", hungarian: "köszönöm" }],
    errors: [],
  })
})

test("column order can be reversed without splitting phrases", () => {
  assert.deepEqual(parseBulkWords("jó reggelt\tbuongiorno", false).words, [
    { italian: "buongiorno", hungarian: "jó reggelt" },
  ])
})

test("incomplete, extra, and oversized cells are rejected with source row numbers", () => {
  for (const row of ["ciao", "ciao\t", "\tszia", "ciao\tszia\textra", `${"a".repeat(201)}\tszia`]) {
    const result = parseBulkWords(`ciao\tszia\n\n${row}`, true)
    assert.equal(result.words.length, 1)
    assert.equal(result.errors.length, 1)
    assert.match(result.errors[0], /^Row 3:/)
  }
  assert.equal(parseBulkWords(`${"a".repeat(200)}\tszia`, true).errors.length, 0)
  assert.deepEqual(parseBulkWords("\r\n \r\n", true), { words: [], errors: [] })
})
