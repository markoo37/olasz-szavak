import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { getErrorMessage } from "@/lib/errors"
import { createWord, updateWord } from "@/services/words"
import type { Category, WordWithCategory } from "@/types/database"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"

const TEXT_LIMIT = 200

type FieldName = "hungarian" | "italian" | "categoryId"

export function WordFormDialog({
  open,
  word,
  categories,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  word: WordWithCategory | null
  categories: Category[]
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const [hungarian, setHungarian] = useState(word?.hungarian ?? "")
  const [italian, setItalian] = useState(word?.italian ?? "")
  const [categoryId, setCategoryId] = useState(word?.category_id ?? categories[0]?.id ?? "")
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({})
  const [pending, setPending] = useState(false)
  const editing = Boolean(word)
  const categoryItems = categories.map((category) => ({
    label: category.name,
    value: category.id,
  }))

  function handleOpenChange(nextOpen: boolean) {
    if (pending) return
    onOpenChange(nextOpen)
  }

  function validate() {
    const nextErrors: Partial<Record<FieldName, string>> = {}
    if (!hungarian.trim()) nextErrors.hungarian = "Enter the Hungarian word."
    else if (hungarian.trim().length > TEXT_LIMIT) nextErrors.hungarian = `Use ${TEXT_LIMIT} characters or fewer.`
    if (!italian.trim()) nextErrors.italian = "Enter the Italian translation."
    else if (italian.trim().length > TEXT_LIMIT) nextErrors.italian = `Use ${TEXT_LIMIT} characters or fewer.`
    if (!categoryId) nextErrors.categoryId = "Choose a category."
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!validate()) return

    setPending(true)
    const input = {
      hungarian: hungarian.trim(),
      italian: italian.trim(),
      categoryId,
    }

    try {
      if (word) {
        await updateWord(word.id, input)
        toast.success("Word updated.")
      } else {
        await createWord(input)
        toast.success("Word added.")
      }
      onSaved()
      onOpenChange(false)
    } catch (submitError) {
      toast.error(getErrorMessage(submitError))
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit word" : "New word"}</DialogTitle>
          <DialogDescription>Store the Hungarian word with its full Italian entry.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field data-invalid={errors.hungarian ? true : undefined}>
              <FieldLabel htmlFor="word-hungarian">Hungarian word</FieldLabel>
              <Input
                id="word-hungarian"
                value={hungarian}
                onChange={(event) => setHungarian(event.target.value)}
                aria-invalid={errors.hungarian ? true : undefined}
                autoComplete="off"
                maxLength={TEXT_LIMIT}
                required
              />
              {errors.hungarian ? <FieldError>{errors.hungarian}</FieldError> : null}
            </Field>
            <Field data-invalid={errors.italian ? true : undefined}>
              <FieldLabel htmlFor="word-italian">Italian translation</FieldLabel>
              <Input
                id="word-italian"
                value={italian}
                onChange={(event) => setItalian(event.target.value)}
                aria-invalid={errors.italian ? true : undefined}
                autoComplete="off"
                maxLength={TEXT_LIMIT}
                required
              />
              {errors.italian ? <FieldError>{errors.italian}</FieldError> : null}
            </Field>
            <Field data-invalid={errors.categoryId ? true : undefined}>
              <FieldLabel htmlFor="word-category">Category</FieldLabel>
              <Select
                items={categoryItems}
                value={categoryId || null}
                onValueChange={(value) => {
                  if (typeof value === "string") setCategoryId(value)
                }}
              >
                <SelectTrigger id="word-category" className="w-full" aria-invalid={errors.categoryId ? true : undefined}>
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {categoryItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {errors.categoryId ? <FieldError>{errors.categoryId}</FieldError> : null}
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" disabled={pending} onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || categories.length === 0}>
              {pending ? <Spinner data-icon="inline-start" /> : null}
              {editing ? "Save" : "Add word"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
