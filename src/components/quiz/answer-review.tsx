import { CheckIcon, XIcon } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { formatPercent } from "@/lib/format"
import type { QuizAnswer } from "@/types/database"

export function AnswerReview({ answers }: { answers: QuizAnswer[] }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold tracking-[-0.01em]">Every question</h2>
      <ol className="flex flex-col divide-y rounded-lg border">
        {answers.map((answer, index) => (
          <li key={`${answer.wordId}-${index}`} className="flex gap-3 px-4 py-3">
            <span className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true">
              {answer.correct ? <CheckIcon className="size-4" /> : <XIcon className="size-4 text-destructive" />}
            </span>
            <span className="sr-only">{answer.correct ? "Correct:" : "Incorrect:"}</span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p lang="hu" className="font-medium">
                {answer.hungarian}
              </p>
              {answer.correct ? (
                <p lang="it" className="text-muted-foreground">
                  {answer.correctAnswer}
                </p>
              ) : (
                <dl className="grid gap-2 pt-1 sm:grid-cols-2">
                  <div className="flex flex-col gap-0.5">
                    <dt className="text-xs text-muted-foreground">Your answer</dt>
                    <dd lang="it" className="text-muted-foreground line-through decoration-destructive/60">
                      {answer.userAnswer}
                    </dd>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <dt className="text-xs text-muted-foreground">Correct</dt>
                    <dd lang="it">{answer.correctAnswer}</dd>
                  </div>
                </dl>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function ScoreSummary({ score, total }: { score: number; total: number }) {
  const incorrect = Math.max(total - score, 0)
  const percent = formatPercent(score, total)
  const value = total > 0 ? (score / total) * 100 : 0

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <p className="text-display tabular-nums">
          {score} / {total}
        </p>
        <p className="text-2xl font-medium tracking-[-0.02em] text-muted-foreground tabular-nums">{percent}</p>
      </div>
      <Progress value={value} aria-label={`Score ${percent}`} className="max-w-md" />
      <dl className="flex gap-8 text-sm">
        <div className="flex flex-col gap-0.5">
          <dt className="text-muted-foreground">Correct</dt>
          <dd className="text-lg font-medium tabular-nums">{score}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-muted-foreground">Incorrect</dt>
          <dd className="text-lg font-medium tabular-nums">{incorrect}</dd>
        </div>
      </dl>
    </div>
  )
}
