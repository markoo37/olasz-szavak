import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { AnswerReview, ScoreSummary } from "@/components/quiz/answer-review"
import { PageHeader } from "@/components/page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { useQuizSession } from "@/context/quiz-session"
import { getErrorMessage } from "@/lib/errors"
import { shuffle } from "@/lib/shuffle"

export function ResultPage() {
  const navigate = useNavigate()
  const { session, ensurePersisted, startQuiz } = useQuizSession()
  const [saveError, setSaveError] = useState<string | null>(null)
  const finished = Boolean(session && session.answers.length === session.words.length && session.words.length > 0)
  const saving = finished && !session?.persisted && !saveError

  useEffect(() => {
    if (!finished || session?.persisted) return
    let cancelled = false
    ensurePersisted().catch((error: unknown) => {
      if (cancelled) return
      const message = getErrorMessage(error)
      setSaveError(message)
      toast.error(message)
    })
    return () => {
      cancelled = true
    }
  }, [finished, session?.persisted, ensurePersisted])

  if (!session || session.words.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Result" />
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No result to show</EmptyTitle>
            <EmptyDescription>Finish a practice test to see your score.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button render={<Link to="/practice" />} nativeButton={false}>
              Start practice
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  if (!finished) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Result" description="This test is still in progress." />
        <Button type="button" onClick={() => navigate("/practice/quiz")}>
          Resume test
        </Button>
      </div>
    )
  }

  const score = session.answers.filter((answer) => answer.correct).length
  const incorrectCount = session.answers.length - score

  function practiceIncorrect() {
    if (!session) return
    const missedIds = new Set(session.answers.filter((answer) => !answer.correct).map((answer) => answer.wordId))
    const missed = session.words.filter((word) => missedIds.has(word.id))
    if (missed.length === 0) return
    const categoryIds = [...new Set(missed.map((word) => word.category_id))]
    startQuiz(shuffle(missed), categoryIds)
    navigate("/practice/quiz")
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Result"
        description={saving ? "Saving this result…" : saveError ? "This result is not saved yet." : "This test is saved to history."}
      />
      <ScoreSummary score={score} total={session.words.length} />
      {saveError ? (
        <div className="flex flex-col items-start gap-3">
          <Alert variant="destructive">
            <AlertTitle>Could not save this result</AlertTitle>
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSaveError(null)
              ensurePersisted().catch((error: unknown) => {
                const message = getErrorMessage(error)
                setSaveError(message)
                toast.error(message)
              })
            }}
          >
            Try again
          </Button>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={incorrectCount === 0 || saving} onClick={practiceIncorrect}>
          Practice incorrect answers
        </Button>
        <Button variant="outline" render={<Link to="/practice" />} nativeButton={false}>
          Start another test
        </Button>
        <Button variant="ghost" render={<Link to="/" />} nativeButton={false}>
          Back to dashboard
        </Button>
      </div>
      <AnswerReview answers={session.answers} />
    </div>
  )
}
