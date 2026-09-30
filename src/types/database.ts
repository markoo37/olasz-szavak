export type Category = {
  id: string
  name: string
  created_at: string
}

export type CategoryWithCount = Category & {
  wordCount: number
}

export type Word = {
  id: string
  hungarian: string
  italian: string
  category_id: string
  created_at: string
}

export type WordWithCategory = Word & {
  categoryName: string
}

export type QuizAnswer = {
  wordId: string
  hungarian: string
  correctAnswer: string
  userAnswer: string
  correct: boolean
}

export type TestResult = {
  id: string
  score: number
  total: number
  category_ids: string[]
  answers: QuizAnswer[]
  created_at: string
}
