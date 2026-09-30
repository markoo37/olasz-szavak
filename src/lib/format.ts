export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export function formatPercent(score: number, total: number): string {
  if (total <= 0) return "0%"
  return `${Math.round((score / total) * 100)}%`
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}

export function labelCategories(ids: string[], namesById: Map<string, string>): string {
  if (ids.length === 0) return "No categories"
  return ids.map((id) => namesById.get(id) ?? "Removed category").join(", ")
}
