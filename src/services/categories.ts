import { fetchAllPages } from "@/lib/paging"
import { supabase } from "@/lib/supabase"
import type { CategoryWithCount } from "@/types/database"

type CategoryRow = {
  id: string
  name: string
  created_at: string
  words: { count: number }[] | null
}

function toCategory(row: CategoryRow): CategoryWithCount {
  const count = row.words?.[0]?.count ?? 0
  return {
    id: row.id,
    name: row.name,
    created_at: row.created_at,
    wordCount: Number(count),
  }
}

export async function listCategories(): Promise<CategoryWithCount[]> {
  const rows = await fetchAllPages<CategoryRow>((from, to) =>
    supabase
      .from("categories")
      .select("id, name, created_at, words(count)")
      .order("name", { ascending: true })
      .range(from, to),
  )

  return rows.map(toCategory)
}

export async function createCategory(name: string): Promise<void> {
  const { error } = await supabase.from("categories").insert({ name })
  if (error) throw error
}

export async function updateCategory(id: string, name: string): Promise<void> {
  const { error } = await supabase.from("categories").update({ name }).eq("id", id)
  if (error) throw error
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from("categories").delete().eq("id", id)
  if (error) throw error
}
