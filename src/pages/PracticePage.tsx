import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { QueryState } from "@/components/query-state"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { useQuizSession } from "@/context/quiz-session"
import { getErrorMessage } from "@/lib/errors"
import { pluralize } from "@/lib/format"
import { shuffle } from "@/lib/shuffle"
import { listCategories } from "@/services/categories"
import { listWordsByCategoryIds } from "@/services/words"
import type { CategoryWithCount } from "@/types/database"

export function PracticePage() {
  const navigate = useNavigate()
  const { startQuiz } = useQuizSession()
  const [categories, setCategories] = useState<CategoryWithCount[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [starting, setStarting] = useState(false)

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

  const selectedWordCount = useMemo(
    () =>
      categories
        .filter((category) => selected.includes(category.id))
        .reduce((sum, category) => sum + category.wordCount, 0),
    [categories, selected],
  )
  const allSelected = categories.length > 0 && selected.length === categories.length

  function toggleCategory(categoryId: string, checked: boolean) {
    setSelected((current) => {
      if (checked) return current.includes(categoryId) ? current : [...current, categoryId]
      return current.filter((id) => id !== categoryId)
    })
  }

  function toggleAll() {
    setSelected(allSelected ? [] : categories.map((category) => category.id))
  }

  async function startTest() {
    if (selected.length === 0 || selectedWordCount === 0 || starting) return
    setStarting(true)
    try {
      const words = await listWordsByCategoryIds(selected)
      if (words.length === 0) {
        toast.error("The selected categories have no words.")
        return
      }
      startQuiz(shuffle(words), selected)
      navigate("/practice/quiz")
    } catch (startError) {
      toast.error(getErrorMessage(startError))
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Practice"
        description="Choose one or more categories. The test includes every word in the selection."
      />
      <QueryState loading={loading} error={error} onRetry={() => setReloadKey((value) => value + 1)}>
        {categories.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No categories yet</EmptyTitle>
              <EmptyDescription>Create a category and add words before starting a test.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex max-w-xl flex-col gap-6">
            <div className="flex items-center justify-between gap-3">
              <Button type="button" variant="outline" size="sm" onClick={toggleAll}>
                {allSelected ? "Clear selection" : "Select all"}
              </Button>
              <p className="text-sm text-muted-foreground">{pluralize(selectedWordCount, "word")} selected</p>
            </div>
            <FieldSet>
              <FieldLegend>Categories</FieldLegend>
              <FieldDescription>Select the groups you want to practice.</FieldDescription>
              <FieldGroup>
                {categories.map((category) => (
                  <Field key={category.id} orientation="horizontal">
                    <Checkbox
                      id={`practice-${category.id}`}
                      checked={selected.includes(category.id)}
                      onCheckedChange={(checked) => toggleCategory(category.id, checked)}
                    />
                    <FieldLabel htmlFor={`practice-${category.id}`} className="w-full font-normal">
                      <span className="flex w-full items-center justify-between gap-4">
                        <span>{category.name}</span>
                        <span className="text-muted-foreground">{pluralize(category.wordCount, "word")}</span>
                      </span>
                    </FieldLabel>
                  </Field>
                ))}
              </FieldGroup>
            </FieldSet>
            <Button type="button" disabled={selectedWordCount === 0 || starting} onClick={() => void startTest()}>
              {starting ? <Spinner data-icon="inline-start" /> : null}
              Start test
            </Button>
          </div>
        )}
      </QueryState>
    </div>
  )
}
