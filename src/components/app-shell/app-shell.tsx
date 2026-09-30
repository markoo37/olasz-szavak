import { BookOpenIcon, FolderIcon, HistoryIcon, LayoutDashboardIcon, PenLineIcon } from "lucide-react"
import { NavLink, Outlet, useLocation } from "react-router-dom"
import { Separator } from "@/components/ui/separator"
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
} from "@/components/ui/sidebar"

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

export function AppShell() {
  const { pathname } = useLocation()

  return (
    <SidebarProvider>
      <Sidebar collapsible="offcanvas">
        <SidebarHeader className="px-4 py-4">
          <p className="text-sm font-semibold tracking-tight">Italiano</p>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      isActive={isNavActive(pathname, item.to)}
                      render={<NavLink to={item.to} />}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="min-w-0">
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <p className="text-sm font-medium">Italiano</p>
        </header>
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 md:p-8">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
