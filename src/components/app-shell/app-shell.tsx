import { BookOpenIcon, FolderIcon, HistoryIcon, LayoutDashboardIcon, PenLineIcon } from "lucide-react"
import { Link, NavLink, Outlet, useLocation } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { APP_NAME } from "@/lib/app"

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboardIcon },
  { to: "/words", label: "Words", icon: BookOpenIcon },
  { to: "/categories", label: "Categories", icon: FolderIcon },
  { to: "/practice", label: "Practice", icon: PenLineIcon },
  { to: "/history", label: "History", icon: HistoryIcon },
]

function isNavActive(pathname: string, to: string) {
  if (to === "/") return pathname === "/"
  return pathname === to || pathname.startsWith(`${to}/`)
}

export function BrandMark() {
  return (
    <span
      aria-hidden="true"
      className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-[0.7rem] font-semibold tracking-[0.02em] text-primary-foreground"
    >
      BT
    </span>
  )
}

function SidebarNav({ pathname }: { pathname: string }) {
  const { isMobile, setOpenMobile } = useSidebar()

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.to}>
          <SidebarMenuButton
            isActive={isNavActive(pathname, item.to)}
            render={<NavLink to={item.to} />}
            onClick={() => {
              if (isMobile) setOpenMobile(false)
            }}
          >
            <item.icon />
            <span>{item.label}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}

export function AppShell() {
  const { pathname } = useLocation()
  const section = navItems.find((item) => isNavActive(pathname, item.to))?.label

  return (
    <SidebarProvider>
      <Sidebar collapsible="offcanvas">
        <SidebarHeader className="px-3 py-4">
          <Link to="/" className="flex items-center gap-2.5 rounded-md px-1 py-1 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
            <BrandMark />
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm leading-tight font-semibold tracking-[-0.01em]">{APP_NAME}</span>
              <span className="truncate text-xs text-muted-foreground">Italian vocabulary</span>
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarNav pathname={pathname} />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger />
          <nav aria-label="Location" className="flex min-w-0 items-center gap-1.5 text-sm">
            <Link to="/" className="truncate font-medium">
              {APP_NAME}
            </Link>
            {section && section !== "Dashboard" ? (
              <>
                <span aria-hidden="true" className="text-muted-foreground">
                  /
                </span>
                <span className="truncate text-muted-foreground" aria-current="page">
                  {section}
                </span>
              </>
            ) : null}
          </nav>
        </header>
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 md:p-8">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
