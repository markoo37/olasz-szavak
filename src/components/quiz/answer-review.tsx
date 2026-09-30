import { CheckIcon, XIcon } from "lucide-react"
import { formatPercent } from "@/lib/format"
import type { QuizAnswer } from "@/types/database"

export function AnswerReview({ answers }: { answers: QuizAnswer[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {answers.map((answer, index) => (
        <li key={`${answer.wordId}-${index}`} className="rounded-lg border px-4 py-3">
          {answer.correct ? (
            <div className="flex flex-col gap-1">
              <p className="flex items-center gap-2 font-medium">
                <CheckIcon className="size-4" />
                <span>{answer.hungarian}</span>
              </p>
              <p className="pl-6 text-muted-foreground">{answer.correctAnswer}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="flex items-center gap-2 font-medium">
                <XIcon className="size-4" />
                <span>{answer.hungarian}</span>
              </p>
              <div className="flex flex-col gap-1 pl-6">
                <p className="text-sm text-muted-foreground">Your answer</p>
                <p>{answer.userAnswer}</p>
              </div>
              <div className="flex flex-col gap-1 pl-6">
                <p className="text-sm text-muted-foreground">Correct</p>
                <p>{answer.correctAnswer}</p>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}

export function ScoreSummary({ score, total }: { score: number; total: number }) {
  const incorrect = Math.max(total - score, 0)
  const percent = formatPercent(score, total)

  return (
    <div className="flex flex-col gap-1">
      <p className="text-4xl font-semibold tracking-tight tabular-nums">
        {score} / {total}
      </p>
      <p className="text-xl text-muted-foreground tabular-nums">{percent}</p>
      <p className="text-sm">{score} correct</p>
      <p className="text-sm text-muted-foreground">{incorrect} incorrect</p>
    </div>
  )
}
