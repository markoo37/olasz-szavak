import { useCallback, useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { AnswerReview, ScoreSummary } from "@/components/quiz/answer-review"
import { PageHeader } from "@/components/page-header"
import { QueryState } from "@/components/query-state"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { getErrorMessage } from "@/lib/errors"
import { formatDateTime, labelCategories } from "@/lib/format"
import { listCategories } from "@/services/categories"
import { getTestResult } from "@/services/testResults"
import type { CategoryWithCount, TestResult } from "@/types/database"

export function HistoryDetailPage() {
  const { id } = useParams()
  const [result, setResult] = useState<TestResult | null>(null)
  const [categories, setCategories] = useState<CategoryWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [missing, setMissing] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const load = useCallback(async () => {
    if (!id) {
      setMissing(true)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    setMissing(false)
    try {
      const [nextResult, nextCategories] = await Promise.all([getTestResult(id), listCategories()])
      setCategories(nextCategories)
      if (!nextResult) setMissing(true)
      else setResult(nextResult)
    } catch (loadError) {
      setError(getErrorMessage(loadError))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(timeout)
  }, [load, reloadKey])

  const namesById = new Map(categories.map((category) => [category.id, category.name]))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Test result" description={result ? formatDateTime(result.created_at) : undefined}>
        <Button variant="outline" render={<Link to="/history" />} nativeButton={false}>
          Back to history
        </Button>
      </PageHeader>
      <QueryState loading={loading} error={error} onRetry={() => setReloadKey((value) => value + 1)}>
        {missing || !result ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Result not found</EmptyTitle>
              <EmptyDescription>This test is no longer available.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button render={<Link to="/history" />} nativeButton={false}>
                Back to history
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="flex flex-col gap-6">
            <ScoreSummary score={result.score} total={result.total} />
            <p className="text-sm text-muted-foreground">{labelCategories(result.category_ids, namesById)}</p>
            <AnswerReview answers={result.answers} />
          </div>
        )}
      </QueryState>
    </div>
  )
}
