const PAGE_SIZE = 1000

type PageResult<T> = {
  data: T[] | null
  error: { message: string } | null
}

export async function fetchAllPages<T>(
  loadPage: (from: number, to: number) => PromiseLike<PageResult<T>>,
): Promise<T[]> {
  const rows: T[] = []
  let from = 0

  for (;;) {
    const { data, error } = await loadPage(from, from + PAGE_SIZE - 1)
    if (error) throw error
    const batch = data ?? []
    rows.push(...batch)
    if (batch.length < PAGE_SIZE) return rows
    from += PAGE_SIZE
  }
}
