import { fetchAllPages } from "@/lib/paging"
import { supabase } from "@/lib/supabase"
import type { QuizAnswer, TestResult } from "@/types/database"

type TestResultRow = {
  id: string
  score: number
  total: number
  category_ids: unknown
  answers: unknown
  created_at: string
}

function isQuizAnswer(value: unknown): value is QuizAnswer {
  if (!value || typeof value !== "object") return false
  const row = value as Record<string, unknown>
  return (
    typeof row.wordId === "string" &&
    typeof row.hungarian === "string" &&
    typeof row.correctAnswer === "string" &&
    typeof row.userAnswer === "string" &&
    typeof row.correct === "boolean"
  )
}

function parseAnswers(value: unknown): QuizAnswer[] {
  if (!Array.isArray(value)) {
    throw new Error("Stored answers were not in the expected format.")
  }

  return value.map((item, index) => {
    if (!isQuizAnswer(item)) {
      throw new Error(`Stored answer ${index + 1} was not in the expected format.`)
    }
    return item
  })
}

function parseCategoryIds(value: unknown): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error("Stored categories were not in the expected format.")
  }
  return value
}

function toTestResult(row: TestResultRow): TestResult {
  return {
    id: row.id,
    score: row.score,
    total: row.total,
    category_ids: parseCategoryIds(row.category_ids),
    answers: parseAnswers(row.answers),
    created_at: row.created_at,
  }
}

export async function listTestResults(): Promise<TestResult[]> {
  const rows = await fetchAllPages<TestResultRow>((from, to) =>
    supabase
      .from("test_results")
      .select("id, score, total, category_ids, answers, created_at")
      .order("created_at", { ascending: false })
      .range(from, to),
  )

  return rows.map(toTestResult)
}

export async function getLatestTestResult(): Promise<TestResult | null> {
  const { data, error } = await supabase
    .from("test_results")
    .select("id, score, total, category_ids, answers, created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return toTestResult(data)
}

export async function getTestResult(id: string): Promise<TestResult | null> {
  const { data, error } = await supabase
    .from("test_results")
    .select("id, score, total, category_ids, answers, created_at")
    .eq("id", id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return toTestResult(data)
}

export async function createTestResult(input: {
  score: number
  total: number
  categoryIds: string[]
  answers: QuizAnswer[]
}): Promise<void> {
  const { error } = await supabase.from("test_results").insert({
    score: input.score,
    total: input.total,
    category_ids: input.categoryIds,
    answers: input.answers,
  })

  if (error) throw error
}
