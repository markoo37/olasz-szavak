import type { ReactNode } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export function QueryState({
  loading,
  error,
  onRetry,
  children,
}: {
  loading: boolean
  error: string | null
  onRetry?: () => void
  children: ReactNode
}) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true" aria-live="polite">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-start gap-3">
        <Alert variant="destructive">
          <AlertTitle>Could not load data</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        {onRetry ? (
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
      </div>
    )
  }

  return children
}
