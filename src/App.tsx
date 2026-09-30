import { Navigate, Route, Routes } from "react-router-dom"
import { AppShell } from "@/components/app-shell/app-shell"
import { QuizProvider } from "@/context/quiz-session"
import { APP_NAME } from "@/lib/app"
import { isSupabaseConfigured } from "@/lib/supabase"
import { CategoriesPage } from "@/pages/CategoriesPage"
import { DashboardPage } from "@/pages/DashboardPage"
import { HistoryDetailPage } from "@/pages/HistoryDetailPage"
import { HistoryPage } from "@/pages/HistoryPage"
import { PracticePage } from "@/pages/PracticePage"
import { QuizPage } from "@/pages/QuizPage"
import { ResultPage } from "@/pages/ResultPage"
import { WordsPage } from "@/pages/WordsPage"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

function MissingConfig() {
  return (
    <main className="mx-auto flex min-h-svh max-w-lg flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">{APP_NAME}</h1>
      <Alert>
        <AlertTitle>Supabase is not configured</AlertTitle>
        <AlertDescription>
          Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to a .env file, then restart the dev server.
        </AlertDescription>
      </Alert>
    </main>
  )
}

export default function App() {
  if (!isSupabaseConfigured) return <MissingConfig />

  return (
    <QuizProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="words" element={<WordsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="practice" element={<PracticePage />} />
          <Route path="practice/result" element={<ResultPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="history/:id" element={<HistoryDetailPage />} />
        </Route>
        <Route path="practice/quiz" element={<QuizPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </QuizProvider>
  )
}
