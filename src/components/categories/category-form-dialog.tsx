import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { getErrorMessage } from "@/lib/errors"
import { createCategory, updateCategory } from "@/services/categories"
import type { Category } from "@/types/database"
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
import { Spinner } from "@/components/ui/spinner"

const NAME_LIMIT = 80

export function CategoryFormDialog({
  open,
  category,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  category: Category | null
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const [name, setName] = useState(category?.name ?? "")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const editing = Boolean(category)

  function handleOpenChange(nextOpen: boolean) {
    if (pending) return
    onOpenChange(nextOpen)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError("Enter a category name.")
      return
    }
    if (trimmed.length > NAME_LIMIT) {
      setError(`Use ${NAME_LIMIT} characters or fewer.`)
      return
    }

    setError(null)
    setPending(true)
    try {
      if (category) {
        await updateCategory(category.id, trimmed)
        toast.success("Category renamed.")
      } else {
        await createCategory(trimmed)
        toast.success("Category created.")
      }
      onSaved()
      onOpenChange(false)
    } catch (submitError) {
      const message = getErrorMessage(submitError)
      setError(message)
      toast.error(message)
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Rename category" : "New category"}</DialogTitle>
          <DialogDescription>
            {editing ? "Update the name used to group vocabulary." : "Create a group for related words."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field data-invalid={error ? true : undefined}>
              <FieldLabel htmlFor="category-name">Name</FieldLabel>
              <Input
                id="category-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                aria-invalid={error ? true : undefined}
                autoComplete="off"
                maxLength={NAME_LIMIT}
                required
              />
              {error ? <FieldError>{error}</FieldError> : null}
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" disabled={pending} onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner data-icon="inline-start" /> : null}
              {editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
