import { useEffect, type ReactNode } from "react"
import { documentTitle } from "@/lib/app"

export function PageHeader({
  title,
  description,
  pageTitle = title,
  children,
}: {
  title: string
  description?: string
  pageTitle?: string | null
  children?: ReactNode
}) {
  useEffect(() => {
    document.title = documentTitle(pageTitle ?? undefined)
  }, [pageTitle])

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex max-w-2xl flex-col gap-1.5">
        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.02em]">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </div>
  )
}
