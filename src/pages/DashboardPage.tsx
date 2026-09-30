import { useCallback, useEffect, useState, type ReactNode } from "react"
import { ArrowRightIcon } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { QueryState } from "@/components/query-state"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuizSession } from "@/context/quiz-session"
import { APP_NAME } from "@/lib/app"
import { getErrorMessage } from "@/lib/errors"
import { formatDateTime, formatPercent, labelCategories, pluralize } from "@/lib/format"
import { shuffle } from "@/lib/shuffle"
import { listCategories } from "@/services/categories"
import { getLatestTestResult } from "@/services/testResults"
import { listWordsByCategoryIds } from "@/services/words"
import type { CategoryWithCount, TestResult } from "@/types/database"

function Stat({ label, value, children }: { label: string; value: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:px-6 sm:first:pl-0 sm:last:pr-0">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-[2rem] leading-none font-semibold tracking-[-0.03em] tabular-nums">{value}</p>
      {children}
    </div>
  )
}

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
      <PageHeader
        title={APP_NAME}
        pageTitle={null}
        description="Hungarian to Italian vocabulary, practiced one category at a time."
      >
        <Button size="lg" render={<Link to="/practice" />} nativeButton={false}>
          Start practice
          <ArrowRightIcon data-icon="inline-end" />
        </Button>
      </PageHeader>
      <QueryState loading={loading} error={error} onRetry={() => setReloadKey((value) => value + 1)}>
        <Card>
          <CardContent className="grid gap-6 sm:grid-cols-3 sm:gap-0 sm:divide-x">
            <Stat label="Words" value={wordCount} />
            <Stat label="Categories" value={categories.length} />
            <Stat label="Latest test" value={latest ? formatPercent(latest.score, latest.total) : "–"}>
              {latest ? (
                <p className="text-sm text-muted-foreground">
                  {latest.score} / {latest.total} ·{" "}
                  <Link
                    to={`/history/${latest.id}`}
                    className="underline-offset-4 hover:text-foreground hover:underline"
                    title={labelCategories(latest.category_ids, namesById)}
                  >
                    {formatDateTime(latest.created_at)}
                  </Link>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No tests yet</p>
              )}
            </Stat>
          </CardContent>
        </Card>
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-base font-semibold tracking-[-0.01em]">Categories</h2>
            <Link
              to="/categories"
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              View all
            </Link>
          </div>
          {recentCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No categories yet. Create one before adding words.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {recentCategories.map((category) => (
                <Card key={category.id} size="sm">
                  <CardHeader>
                    <CardTitle className="truncate">{category.name}</CardTitle>
                    <CardDescription>{pluralize(category.wordCount, "word")}</CardDescription>
                    <CardAction className="self-center">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={category.wordCount === 0 || startingId === category.id}
                        onClick={() => void startCategory(category.id)}
                      >
                        Practice
                      </Button>
                    </CardAction>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </section>
      </QueryState>
    </div>
  )
}
