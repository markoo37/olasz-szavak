export const APP_NAME = "Bojso Tanul"

export function documentTitle(page?: string): string {
  return page ? `${page} · ${APP_NAME}` : APP_NAME
}
