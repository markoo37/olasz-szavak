export const WORD_TEXT_LIMIT = 200

export function parseBulkWords(text: string, italianFirst: boolean) {
  const words: { italian: string; hungarian: string }[] = []
  const errors: string[] = []
  text.split(/\r\n|\n|\r/).forEach((line, index) => {
    if (!line.trim()) return
    const cells = line.split("\t").map((cell) => cell.trim())
    if (cells.length !== 2 || cells.some((cell) => !cell)) {
      errors.push(`Row ${index + 1}: include exactly two non-empty cells, separated by a tab.`)
      return
    }
    if (cells.some((cell) => cell.length > WORD_TEXT_LIMIT)) {
      errors.push(`Row ${index + 1}: each word must be ${WORD_TEXT_LIMIT} characters or fewer.`)
      return
    }
    words.push({ italian: cells[italianFirst ? 0 : 1]!, hungarian: cells[italianFirst ? 1 : 0]! })
  })
  return { words, errors }
}

// Table HTML preserves cell boundaries when document clipboard text does not.
export function tableClipboardText(html: string): string | null {
  if (!html) return null
  const document = new DOMParser().parseFromString(html, "text/html")
  const table = document.querySelector("table")
  if (!table) return null
  return Array.from(table.rows).map((row) =>
    Array.from(row.cells).map((cell) => {
      const copy = cell.cloneNode(true) as HTMLElement
      copy.querySelectorAll("br").forEach((br) => br.replaceWith(" "))
      return (copy.textContent ?? "").replace(/\s+/g, " ").trim()
    }).join("\t"),
  ).join("\n")
}
