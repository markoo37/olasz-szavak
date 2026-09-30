import { useEffect, useRef, useState, type FormEvent } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import { useQuizSession } from "@/context/quiz-session"
import { getErrorMessage } from "@/lib/errors"
import { answersMatch } from "@/lib/normalizeAnswer"
import type { QuizAnswer, Word } from "@/types/database"

export function QuizPage() {
  const navigate = useNavigate()
  const { session, recordAnswer, advance, ensurePersisted } = useQuizSession()
  const [saving, setSaving] = useState(false)
  const [exitOpen, setExitOpen] = useState(false)
  const advancingRef = useRef(false)

  const word = session && session.currentIndex < session.words.length ? session.words[session.currentIndex] : null
  const currentAnswer =
    session && session.answers.length === session.currentIndex + 1 ? session.answers[session.currentIndex] : null
  const questionNumber = session ? Math.min(session.currentIndex + 1, session.words.length) : 0
  const progressValue = session && session.words.length > 0 ? (session.answers.length / session.words.length) * 100 : 0

  useEffect(() => {
    document.title = "Practice · Italiano"
  }, [])

  useEffect(() => {
    advancingRef.current = false
  }, [session?.currentIndex])

  async function handleNext() {
    if (!session || !currentAnswer || advancingRef.current) return
    advancingRef.current = true
    const isLast = session.currentIndex >= session.words.length - 1
    try {
      if (isLast) {
        setSaving(true)
        await ensurePersisted()
      }
      advance()
      if (isLast) navigate("/practice/result")
    } catch (error) {
      advancingRef.current = false
      toast.error(getErrorMessage(error))
    } finally {
      if (!isLast) advancingRef.current = false
      setSaving(false)
    }
  }

  if (!session) return <Navigate to="/practice" replace />
  if (session.currentIndex >= session.words.length) return <Navigate to="/practice/result" replace />
  if (!word) return <Navigate to="/practice" replace />

  return (
    <div className="min-h-svh bg-background">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <p className="text-sm font-medium">Practice</p>
        <Button type="button" variant="ghost" size="sm" onClick={() => setExitOpen(true)}>
          Exit
        </Button>
      </header>
      <main className="mx-auto flex w-full max-w-xl flex-col gap-8 px-4 py-10">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground tabular-nums">
            {questionNumber} / {session.words.length}
          </p>
          <Progress value={progressValue} aria-label="Test progress" />
        </div>
        <QuestionStep
          key={session.currentIndex}
          word={word}
          answer={currentAnswer}
          isLast={questionNumber === session.words.length}
          saving={saving}
          onCheck={(userAnswer) =>
            recordAnswer({
              wordId: word.id,
              hungarian: word.hungarian,
              correctAnswer: word.italian,
              userAnswer,
              correct: answersMatch(userAnswer, word.italian),
            })
          }
          onNext={() => void handleNext()}
        />
      </main>
      <ConfirmDialog
        open={exitOpen}
        title="Leave this test?"
        description="Unfinished progress stays in this tab until you start another test or refresh the page."
        confirmLabel="Leave"
        destructive={false}
        onOpenChange={setExitOpen}
        onConfirm={() => navigate("/practice")}
      />
    </div>
  )
}

function QuestionStep({
  word,
  answer,
  isLast,
  saving,
  onCheck,
  onNext,
}: {
  word: Word
  answer: QuizAnswer | null
  isLast: boolean
  saving: boolean
  onCheck: (userAnswer: string) => void
  onNext: () => void
}) {
  const [draft, setDraft] = useState("")
  const [fieldError, setFieldError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const onNextRef = useRef(onNext)

  useEffect(() => {
    onNextRef.current = onNext
  })

  useEffect(() => {
    if (answer) nextRef.current?.focus()
    else inputRef.current?.focus()
  }, [answer])

  useEffect(() => {
    if (!answer) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Enter" || event.repeat) return
      if (event.target instanceof HTMLButtonElement) return
      event.preventDefault()
      onNextRef.current()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [answer])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (answer) return
    const userAnswer = draft.trim()
    if (!userAnswer) {
      setFieldError("Enter the Italian translation.")
      return
    }
    setFieldError(null)
    onCheck(userAnswer)
  }

  return (
    <div className="flex flex-col gap-8">
      <p className="text-4xl font-medium tracking-tight">{word.hungarian}</p>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <Field data-invalid={fieldError ? true : undefined}>
          <FieldLabel htmlFor="quiz-answer">Italian answer</FieldLabel>
          <Input
            ref={inputRef}
            id="quiz-answer"
            value={answer ? answer.userAnswer : draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={Boolean(answer)}
            aria-invalid={fieldError ? true : undefined}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            required
          />
          {fieldError ? <FieldError>{fieldError}</FieldError> : null}
        </Field>
        {answer ? null : <Button type="submit">Check answer</Button>}
      </form>
      {answer ? (
        <div className="flex flex-col gap-3" aria-live="polite">
          {answer.correct ? (
            <div className="flex flex-col gap-1">
              <p className="font-medium">Correct</p>
              <p>{word.hungarian}</p>
              <p className="text-muted-foreground">{answer.correctAnswer}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="font-medium text-destructive">Incorrect</p>
              <div className="flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">Your answer</p>
                <p>{answer.userAnswer}</p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">Correct answer</p>
                <p>{answer.correctAnswer}</p>
              </div>
            </div>
          )}
          <Button ref={nextRef} type="button" disabled={saving} onClick={onNext}>
            {saving ? <Spinner data-icon="inline-start" /> : null}
            {isLast ? "See results" : "Next"}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
