import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { QueryState } from "@/components/query-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuizSession } from "@/context/quiz-session"
import { getErrorMessage } from "@/lib/errors"
import { formatDateTime, formatPercent, labelCategories, pluralize } from "@/lib/format"
import { shuffle } from "@/lib/shuffle"
import { listCategories } from "@/services/categories"
import { getLatestTestResult } from "@/services/testResults"
import { listWordsByCategoryIds } from "@/services/words"
import type { CategoryWithCount, TestResult } from "@/types/database"

export function DashboardPage() {
  const navigate = useNavigate()
  const { startQuiz } = useQuizSession()
  const [categories, setCategories] = useState<CategoryWithCount[]>([])
  const [latest, setLatest] = useState<TestResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [startingId, setStartingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [nextCategories, nextLatest] = await Promise.all([listCategories(), getLatestTestResult()])
      setCategories(nextCategories)
      setLatest(nextLatest)
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

  const wordCount = categories.reduce((sum, category) => sum + category.wordCount, 0)
  const namesById = new Map(categories.map((category) => [category.id, category.name]))
  const recentCategories = [...categories]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 4)

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

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Dashboard" description="A shared notebook for Hungarian to Italian vocabulary.">
        <Button render={<Link to="/practice" />} nativeButton={false}>
          Start practice
        </Button>
      </PageHeader>
      <QueryState loading={loading} error={error} onRetry={() => setReloadKey((value) => value + 1)}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Words</CardDescription>
              <CardTitle className="tabular-nums">{wordCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Categories</CardDescription>
              <CardTitle className="tabular-nums">{categories.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Latest test</CardDescription>
              {latest ? (
                <CardTitle className="tabular-nums">{formatPercent(latest.score, latest.total)}</CardTitle>
              ) : (
                <CardTitle>No tests yet</CardTitle>
              )}
            </CardHeader>
            {latest ? (
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {latest.score} / {latest.total} · {formatDateTime(latest.created_at)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{labelCategories(latest.category_ids, namesById)}</p>
                <Button
                  className="mt-3"
                  variant="outline"
                  size="sm"
                  render={<Link to={`/history/${latest.id}`} />}
                  nativeButton={false}
                >
                  View result
                </Button>
              </CardContent>
            ) : null}
          </Card>
        </div>
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">Categories</h2>
          {recentCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No categories yet. Create one before adding words.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {recentCategories.map((category) => (
                <Card key={category.id} size="sm">
                  <CardHeader>
                    <CardTitle>{category.name}</CardTitle>
                    <CardDescription>{pluralize(category.wordCount, "word")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={category.wordCount === 0 || startingId === category.id}
                      onClick={() => void startCategory(category.id)}
                    >
                      Start practice
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </QueryState>
    </div>
  )
}
