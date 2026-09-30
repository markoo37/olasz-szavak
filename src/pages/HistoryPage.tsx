import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { PageHeader } from "@/components/page-header"
import { QueryState } from "@/components/query-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { getErrorMessage } from "@/lib/errors"
import { formatDateTime, formatPercent, labelCategories } from "@/lib/format"
import { listCategories } from "@/services/categories"
import { listTestResults } from "@/services/testResults"
import type { CategoryWithCount, TestResult } from "@/types/database"

export function HistoryPage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [categories, setCategories] = useState<CategoryWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [nextResults, nextCategories] = await Promise.all([listTestResults(), listCategories()])
      setResults(nextResults)
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

  const namesById = new Map(categories.map((category) => [category.id, category.name]))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="History" description="Completed tests saved from this shared vocabulary." />
      <QueryState loading={loading} error={error} onRetry={() => setReloadKey((value) => value + 1)}>
        {results.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No tests yet</EmptyTitle>
              <EmptyDescription>Finish a practice test and it will appear here.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button render={<Link to="/practice" />} nativeButton={false}>
                Start practice
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="flex flex-col gap-3">
            {results.map((result) => (
              <Card key={result.id} size="sm">
                <CardHeader>
                  <CardTitle className="tabular-nums">{formatPercent(result.score, result.total)}</CardTitle>
                  <CardDescription>{formatDateTime(result.created_at)}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-1 text-sm">
                    <p>
                      {result.score} / {result.total} · {result.total} questions
                    </p>
                    <p className="text-muted-foreground">{labelCategories(result.category_ids, namesById)}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    render={<Link to={`/history/${result.id}`} />}
                    nativeButton={false}
                  >
                    View answers
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </QueryState>
    </div>
  )
}
