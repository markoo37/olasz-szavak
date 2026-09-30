import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react"
import { toast } from "sonner"
import { createTestResult } from "@/services/testResults"
import type { QuizAnswer, Word } from "@/types/database"
import type { QuizSession } from "@/types/quiz"

type QuizContextValue = {
  session: QuizSession | null
  startQuiz: (words: Word[], selectedCategoryIds: string[]) => void
  recordAnswer: (answer: QuizAnswer) => void
  advance: () => void
  ensurePersisted: () => Promise<void>
}

const QuizContext = createContext<QuizContextValue | null>(null)

export function QuizProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<QuizSession | null>(null)
  const sessionRef = useRef<QuizSession | null>(null)
  const savePromiseRef = useRef<Promise<void> | null>(null)

  const commit = useCallback((next: QuizSession | null) => {
    sessionRef.current = next
    setSession(next)
  }, [])

  const startQuiz = useCallback(
    (words: Word[], selectedCategoryIds: string[]) => {
      savePromiseRef.current = null
      commit({
        words,
        currentIndex: 0,
        answers: [],
        selectedCategoryIds,
        persisted: false,
      })
    },
    [commit],
  )

  const recordAnswer = useCallback(
    (answer: QuizAnswer) => {
      const current = sessionRef.current
      if (!current) return
      if (current.answers.length !== current.currentIndex) return
      commit({ ...current, answers: [...current.answers, answer] })
    },
    [commit],
  )

  const advance = useCallback(() => {
    const current = sessionRef.current
    if (!current) return
    if (current.answers.length !== current.currentIndex + 1) return
    commit({ ...current, currentIndex: current.currentIndex + 1 })
  }, [commit])

  const ensurePersisted = useCallback(() => {
    const current = sessionRef.current
    if (!current) return Promise.resolve()
    if (current.persisted) return Promise.resolve()
    if (current.answers.length !== current.words.length) {
      return Promise.reject(new Error("Finish every question before saving the result."))
    }
    if (savePromiseRef.current) return savePromiseRef.current

    const score = current.answers.filter((answer) => answer.correct).length
    const pending = createTestResult({
      score,
      total: current.words.length,
      categoryIds: current.selectedCategoryIds,
      answers: current.answers,
    })
      .then(() => {
        const latest = sessionRef.current
        if (!latest) return
        commit({ ...latest, persisted: true })
        toast.success("Result saved.")
      })
      .catch((error: unknown) => {
        savePromiseRef.current = null
        throw error
      })

    savePromiseRef.current = pending
    return pending
  }, [commit])

  const value = useMemo(
    () => ({ session, startQuiz, recordAnswer, advance, ensurePersisted }),
    [session, startQuiz, recordAnswer, advance, ensurePersisted],
  )

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>
}

export function useQuizSession() {
  const context = useContext(QuizContext)
  if (!context) {
    throw new Error("useQuizSession must be used within QuizProvider.")
  }
  return context
}
