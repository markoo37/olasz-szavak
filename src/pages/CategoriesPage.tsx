import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { CategoryFormDialog } from "@/components/categories/category-form-dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { PageHeader } from "@/components/page-header"
import { QueryState } from "@/components/query-state"
import { WordFormDialog } from "@/components/words/word-form-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { useQuizSession } from "@/context/quiz-session"
import { getErrorMessage } from "@/lib/errors"
import { pluralize } from "@/lib/format"
import { shuffle } from "@/lib/shuffle"
import { deleteCategory, listCategories } from "@/services/categories"
import { listWordsByCategoryIds } from "@/services/words"
import type { CategoryWithCount } from "@/types/database"

export function CategoriesPage() {
  const navigate = useNavigate()
  const { startQuiz } = useQuizSession()
  const [categories, setCategories] = useState<CategoryWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<CategoryWithCount | null>(null)
  const [deleting, setDeleting] = useState<CategoryWithCount | null>(null)
  const [deletePending, setDeletePending] = useState(false)
  const [startingId, setStartingId] = useState<string | null>(null)
  const [wordCategory, setWordCategory] = useState<CategoryWithCount | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setCategories(await listCategories())
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

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  async function startCategory(categoryId: string) {
    setStartingId(categoryId)
    try {
      const words = await listWordsByCategoryIds([categoryId])
      if (words.length === 0) {
        toast.error("This category has no words yet.")
        return
      }
      startQuiz(shuffle(words), [categoryId])
      navigate("/practice/quiz")
    } catch (startError) {
      toast.error(getErrorMessage(startError))
    } finally {
      setStartingId(null)
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    setDeletePending(true)
    try {
      await deleteCategory(deleting.id)
      toast.success("Category deleted.")
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
      <PageHeader title="Categories" description="Group words, then practice one group at a time.">
        <Button type="button" onClick={openCreate}>
          New category
        </Button>
      </PageHeader>
      <QueryState loading={loading} error={error} onRetry={() => setReloadKey((value) => value + 1)}>
        {categories.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No categories yet</EmptyTitle>
              <EmptyDescription>Create a category to start collecting words.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type="button" onClick={openCreate}>
                New category
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {categories.map((category) => (
              <Card key={category.id}>
                <CardHeader>
                  <CardTitle>
                    <Link to={`/categories/${category.id}`} className="rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4">
                      {category.name}
                    </Link>
                  </CardTitle>
                  <CardDescription>{pluralize(category.wordCount, "word")}</CardDescription>
                </CardHeader>
                <CardFooter className="flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" aria-label={`New word in ${category.name}`} onClick={() => setWordCategory(category)}>
                    New word
                  </Button>
                  <Button size="sm" variant="outline" render={<Link to={`/categories/${category.id}`} />} nativeButton={false} aria-label={`View words in ${category.name}`}>
                    View words
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={category.wordCount === 0 || startingId === category.id}
                    onClick={() => void startCategory(category.id)}
                  >
                    Start practice
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(category)
                      setFormOpen(true)
                    }}
                  >
                    Rename
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setDeleting(category)}>
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </QueryState>
      {formOpen ? (
        <CategoryFormDialog
          key={editing?.id ?? "create"}
          open={formOpen}
          category={editing}
          onOpenChange={setFormOpen}
          onSaved={() => setReloadKey((value) => value + 1)}
        />
      ) : null}
      {wordCategory ? (
        <WordFormDialog
          key={wordCategory.id}
          open
          word={null}
          categories={[wordCategory]}
          defaultCategoryId={wordCategory.id}
          onOpenChange={(open) => { if (!open) setWordCategory(null) }}
          onSaved={() => setReloadKey((value) => value + 1)}
        />
      ) : null}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete category"
        description={
          deleting
            ? `Delete “${deleting.name}” and its ${pluralize(deleting.wordCount, "word")}? This cannot be undone.`
            : "Delete this category and its words? This cannot be undone."
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
