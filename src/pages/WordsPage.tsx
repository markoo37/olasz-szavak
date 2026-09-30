import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { PageHeader } from "@/components/page-header"
import { QueryState } from "@/components/query-state"
import { WordFormDialog } from "@/components/words/word-form-dialog"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getErrorMessage } from "@/lib/errors"
import { listCategories } from "@/services/categories"
import { deleteWord, listWords } from "@/services/words"
import type { CategoryWithCount, WordWithCategory } from "@/types/database"

export function WordsPage() {
  const [words, setWords] = useState<WordWithCategory[]>([])
  const [categories, setCategories] = useState<CategoryWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<WordWithCategory | null>(null)
  const [deleting, setDeleting] = useState<WordWithCategory | null>(null)
  const [deletePending, setDeletePending] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [nextWords, nextCategories] = await Promise.all([listWords(), listCategories()])
      setWords(nextWords)
      setCategories(nextCategories)
    } catch (loadError) {
      setError(getErrorMessage(loadError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(timeout)
  }, [load, reloadKey])

  const filterItems = useMemo(
    () => [
      { label: "All categories", value: "all" },
      ...categories.map((category) => ({ label: category.name, value: category.id })),
    ],
    [categories],
  )

  const filteredWords = useMemo(() => {
    const query = search.trim().toLowerCase()
    return words.filter((word) => {
      const matchesCategory = categoryFilter === "all" || word.category_id === categoryFilter
      if (!matchesCategory) return false
      if (!query) return true
      return (
        word.hungarian.toLowerCase().includes(query) ||
        word.italian.toLowerCase().includes(query) ||
        word.categoryName.toLowerCase().includes(query)
      )
    })
  }, [words, search, categoryFilter])

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(word: WordWithCategory) {
    setEditing(word)
    setFormOpen(true)
  }

  async function confirmDelete() {
    if (!deleting) return
    setDeletePending(true)
    try {
      await deleteWord(deleting.id)
      toast.success("Word deleted.")
      setDeleting(null)
      setReloadKey((value) => value + 1)
    } catch (deleteError) {
      toast.error(getErrorMessage(deleteError))
    } finally {
      setDeletePending(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Words" description="Add, edit, and search the shared vocabulary.">
        <Button type="button" onClick={openCreate} disabled={categories.length === 0}>
          Add word
        </Button>
      </PageHeader>
      <QueryState loading={loading} error={error} onRetry={() => setReloadKey((value) => value + 1)}>
        {categories.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No categories yet</EmptyTitle>
              <EmptyDescription>Create a category before adding vocabulary.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button render={<Link to="/categories" />} nativeButton={false}>
                Go to categories
              </Button>
            </EmptyContent>
          </Empty>
        ) : words.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No words yet</EmptyTitle>
              <EmptyDescription>Add your first Italian vocabulary word.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type="button" onClick={openCreate}>
                Add word
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Field className="sm:max-w-sm">
                <FieldLabel htmlFor="word-search">Search</FieldLabel>
                <Input
                  id="word-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Hungarian, Italian, or category"
                />
              </Field>
              <Field className="sm:w-56">
                <FieldLabel htmlFor="word-filter">Category</FieldLabel>
                <Select
                  items={filterItems}
                  value={categoryFilter}
                  onValueChange={(value) => {
                    if (typeof value === "string") setCategoryFilter(value)
                  }}
                >
                  <SelectTrigger id="word-filter" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {filterItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            {filteredWords.length === 0 ? (
              <p className="text-sm text-muted-foreground">No words match your search.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hungarian</TableHead>
                    <TableHead>Italian</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWords.map((word) => (
                    <TableRow key={word.id}>
                      <TableCell>{word.hungarian}</TableCell>
                      <TableCell>{word.italian}</TableCell>
                      <TableCell>{word.categoryName}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(word)}>
                            Edit
                          </Button>
                          <Button type="button" variant="ghost" size="sm" onClick={() => setDeleting(word)}>
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </QueryState>
      {formOpen ? (
        <WordFormDialog
          key={editing?.id ?? "create"}
          open={formOpen}
          word={editing}
          categories={categories}
          onOpenChange={setFormOpen}
          onSaved={() => setReloadKey((value) => value + 1)}
        />
      ) : null}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete word"
        description={
          deleting
            ? `Delete “${deleting.hungarian}”? This cannot be undone.`
            : "Delete this word? This cannot be undone."
        }
        confirmLabel="Delete"
        pending={deletePending}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
