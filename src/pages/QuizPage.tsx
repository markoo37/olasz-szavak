import { useEffect, useRef, useState, type FormEvent } from "react"
import { ArrowRightIcon, CheckIcon, XIcon } from "lucide-react"
import { Navigate, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { BrandMark } from "@/components/app-shell/app-shell"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Kbd } from "@/components/ui/kbd"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import { useQuizSession } from "@/context/quiz-session"
import { APP_NAME, documentTitle } from "@/lib/app"
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
    document.title = documentTitle("Practice")
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
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex h-14 items-center justify-between gap-3 border-b px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <BrandMark />
          <p className="truncate text-sm">
            <span className="font-medium">{APP_NAME}</span>
            <span className="text-muted-foreground"> · Practice</span>
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => setExitOpen(true)}>
          Exit
        </Button>
      </header>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-10 px-4 py-10 sm:py-16">
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

function KeyHint({ children }: { children: string }) {
  return (
    <p className="hidden items-center gap-1.5 text-xs text-muted-foreground pointer-fine:flex">
      Press <Kbd>Enter</Kbd> {children}
    </p>
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
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">Translate to Italian</p>
        <p lang="hu" className="text-display">
          {word.hungarian}
        </p>
      </div>
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <Field data-invalid={fieldError ? true : undefined}>
          <FieldLabel htmlFor="quiz-answer" className="sr-only">
            Italian answer
          </FieldLabel>
          <Input
            ref={inputRef}
            id="quiz-answer"
            lang="it"
            placeholder="Italian answer"
            value={answer ? answer.userAnswer : draft}
            onChange={(event) => {
              setDraft(event.target.value)
              if (fieldError) setFieldError(null)
            }}
            disabled={Boolean(answer)}
            aria-invalid={fieldError ? true : undefined}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="done"
            className="h-11 text-lg md:text-lg"
          />
          {fieldError ? <FieldError>{fieldError}</FieldError> : null}
        </Field>
        {answer ? null : (
          <div className="flex items-center justify-between gap-4">
            <Button type="submit" size="lg" className="w-full sm:w-auto">
              Check answer
            </Button>
            <KeyHint>to check</KeyHint>
          </div>
        )}
      </form>
      {answer ? (
        <div className="flex flex-col gap-4 duration-200 ease-out animate-in fade-in-0 slide-in-from-bottom-1" aria-live="polite">
          {answer.correct ? (
            <Alert>
              <CheckIcon />
              <AlertTitle>Correct</AlertTitle>
              <AlertDescription className="flex flex-col">
                <span lang="hu">{word.hungarian}</span>
                <span lang="it" className="text-lg leading-snug font-medium text-foreground">
                  {answer.correctAnswer}
                </span>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <XIcon />
              <AlertTitle>Incorrect</AlertTitle>
              <dl className="mt-2 grid gap-3 text-foreground sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <dt className="text-sm text-muted-foreground">Your answer</dt>
                  <dd lang="it" className="text-muted-foreground line-through decoration-destructive/60">
                    {answer.userAnswer}
                  </dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-sm text-muted-foreground">Correct answer</dt>
                  <dd lang="it" className="text-lg leading-snug font-medium">
                    {answer.correctAnswer}
                  </dd>
                </div>
              </dl>
            </Alert>
          )}
          <div className="flex items-center justify-between gap-4">
            <Button
              ref={nextRef}
              type="button"
              size="lg"
              className="w-full sm:w-auto"
              disabled={saving}
              onClick={onNext}
            >
              {saving ? <Spinner data-icon="inline-start" /> : null}
              {isLast ? "See results" : "Next"}
              {saving ? null : <ArrowRightIcon data-icon="inline-end" />}
            </Button>
            <KeyHint>{isLast ? "for results" : "for the next word"}</KeyHint>
          </div>
        </div>
      ) : null}
    </div>
  )
}
