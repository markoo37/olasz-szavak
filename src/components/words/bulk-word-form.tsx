import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { DialogFooter } from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { parseBulkWords, tableClipboardText } from "@/lib/bulkWords"
import { getErrorMessage } from "@/lib/errors"
import { createWords } from "@/services/words"

export function BulkWordForm({ categoryId, pending, setPending, onSaved, onClose }: {
  categoryId: string
  pending: boolean
  setPending: (pending: boolean) => void
  onSaved: () => void
  onClose: () => void
}) {
  const [text, setText] = useState("")
  const [italianFirst, setItalianFirst] = useState(true)
  const { words, errors } = parseBulkWords(text, italianFirst)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (pending || !categoryId || errors.length || !words.length) return
    setPending(true)
    try {
      await createWords(words.map((word) => ({ ...word, categoryId })))
      toast.success(`${words.length} ${words.length === 1 ? "word" : "words"} added.`)
      onSaved()
      onClose()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-w-0 flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="bulk-column-order">Column languages</FieldLabel>
        <select
          id="bulk-column-order"
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring"
          value={italianFirst ? "italian-first" : "hungarian-first"}
          onChange={(event) => setItalianFirst(event.target.value === "italian-first")}
          disabled={pending}
        >
          <option value="italian-first">Left: Italian · Right: Hungarian</option>
          <option value="hungarian-first">Left: Hungarian · Right: Italian</option>
        </select>
      </Field>
      <Field data-invalid={errors.length ? true : undefined}>
        <FieldLabel htmlFor="bulk-words">Paste table rows</FieldLabel>
        <p id="bulk-words-help" className="text-sm text-muted-foreground">
          Copy the two columns from your Google Docs table, without the header, and paste here. Each row becomes one word pair.
        </p>
        <textarea
          id="bulk-words"
          className="min-h-36 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onPaste={(event) => {
            const tableText = tableClipboardText(event.clipboardData.getData("text/html"))
            if (tableText === null) return
            event.preventDefault()
            const start = event.currentTarget.selectionStart
            const end = event.currentTarget.selectionEnd
            setText((current) => current.slice(0, start) + tableText + current.slice(end))
          }}
          placeholder={italianFirst ? "ciao\t szia\n grazie\t köszönöm" : "szia\t ciao\n köszönöm\t grazie"}
          aria-describedby={errors.length ? "bulk-words-help bulk-words-errors" : "bulk-words-help"}
          aria-invalid={errors.length ? true : undefined}
          disabled={pending}
        />
        {errors.length ? (
          <FieldError id="bulk-words-errors">
            <ul className="max-h-24 overflow-y-auto list-disc pl-4">
              {errors.map((error) => <li key={error}>{error}</li>)}
            </ul>
          </FieldError>
        ) : null}
      </Field>
      {words.length ? (
        <div>
          <p className="mb-2 text-sm font-medium" aria-live="polite">Preview · {words.length} {words.length === 1 ? "word" : "words"}</p>
          <div className="max-h-48 overflow-auto rounded-md border">
            <Table>
              <TableHeader><TableRow><TableHead>Italian</TableHead><TableHead>Hungarian</TableHead></TableRow></TableHeader>
              <TableBody>{words.map((word, index) => (
                <TableRow key={index}><TableCell className="whitespace-normal break-words">{word.italian}</TableCell><TableCell className="whitespace-normal break-words">{word.hungarian}</TableCell></TableRow>
              ))}</TableBody>
            </Table>
          </div>
        </div>
      ) : null}
      <DialogFooter>
        <Button type="button" variant="outline" disabled={pending} onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={pending || !categoryId || !words.length || errors.length > 0}>
          {pending ? <Spinner data-icon="inline-start" /> : null}
          Add {words.length || ""} {words.length === 1 ? "word" : "words"}
        </Button>
      </DialogFooter>
    </form>
  )
}
