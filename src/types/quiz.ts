import type { QuizAnswer, Word } from "@/types/database"

export type QuizSession = {
  words: Word[]
  currentIndex: number
  answers: QuizAnswer[]
  selectedCategoryIds: string[]
  persisted: boolean
}

export type { QuizAnswer }
