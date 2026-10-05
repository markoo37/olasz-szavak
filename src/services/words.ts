import { fetchAllPages } from "@/lib/paging"
import { supabase } from "@/lib/supabase"
import type { Word, WordWithCategory } from "@/types/database"

type WordRow = {
  id: string
  hungarian: string
  italian: string
  category_id: string
  created_at: string
  categories: { name: string } | { name: string }[] | null
}

function categoryName(value: WordRow["categories"]): string {
  if (!value) return "Unknown category"
  if (Array.isArray(value)) return value[0]?.name ?? "Unknown category"
  return value.name
}

function toWord(row: WordRow): WordWithCategory {
  return {
    id: row.id,
    hungarian: row.hungarian,
    italian: row.italian,
    category_id: row.category_id,
    created_at: row.created_at,
    categoryName: categoryName(row.categories),
  }
}

export async function listWords(): Promise<WordWithCategory[]> {
  const rows = await fetchAllPages<WordRow>((from, to) =>
    supabase
      .from("words")
      .select("id, hungarian, italian, category_id, created_at, categories(name)")
      .order("hungarian", { ascending: true })
      .range(from, to),
  )

  return rows.map(toWord)
}

export async function listWordsByCategoryIds(categoryIds: string[]): Promise<Word[]> {
  if (categoryIds.length === 0) return []

  const rows = await fetchAllPages<Word>((from, to) =>
    supabase
      .from("words")
      .select("id, hungarian, italian, category_id, created_at")
      .in("category_id", categoryIds)
      .order("hungarian", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to),
  )

  return rows
}

type WordInput = {
  hungarian: string
  italian: string
  categoryId: string
}

export async function createWord(input: WordInput): Promise<void> {
  const { error } = await supabase.from("words").insert({
    hungarian: input.hungarian,
    italian: input.italian,
    category_id: input.categoryId,
  })
  if (error) throw error
}

export async function createWords(inputs: WordInput[]): Promise<void> {
  if (inputs.length === 0) return
  const { error } = await supabase.from("words").insert(inputs.map((input) => ({
    hungarian: input.hungarian,
    italian: input.italian,
    category_id: input.categoryId,
  })))
  if (error) throw error
}

export async function updateWord(id: string, input: WordInput): Promise<void> {
  const { error } = await supabase
    .from("words")
    .update({
      hungarian: input.hungarian,
      italian: input.italian,
      category_id: input.categoryId,
    })
    .eq("id", id)
  if (error) throw error
}

export async function deleteWord(id: string): Promise<void> {
  const { error } = await supabase.from("words").delete().eq("id", id)
  if (error) throw error
}
