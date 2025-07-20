"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  BarChart3, Zap, AlertTriangle, RefreshCw, Target, Settings, ChevronDown, Bug, TestTube, Database, Code, Search, Menu
} from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"

const mainNavigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Price Sync", href: "/price-sync", icon: Zap },
  { name: "Missing Prices", href: "/missing-prices", icon: AlertTriangle },
  { name: "Quick Update", href: "/update-prices", icon: RefreshCw },
]

const advancedTools = [
  { name: "Smart Fix", href: "/smart-fix", icon: Target, description: "Auto-fix option symbols" },
  { name: "Smart Analyzer", href: "/smart-analyzer", icon: Search, description: "Analyze option formats" },
]

const debugTools = [
  { name: "Data Flow Debug", href: "/debug-data-flow", icon: Code, description: "Debug data transformation" },
  { name: "Trade Debug", href: "/debug-trades", icon: TestTube, description: "Debug individual trades" },
  { name: "Alpaca Test", href: "/alpaca-test", icon: Settings, description: "Test API connection" },
  { name: "API Debug", href: "/alpaca-debug", icon: Bug, description: "Detailed API debugging" },
  { name: "Diagnostics", href: "/diagnostics", icon: Database, description: "System diagnostics" },
]

const NavLink = ({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) => {
  const pathname = usePathname()
  const isActive = pathname === href
  return (
    <Link href={href} passHref>
      <Button variant={isActive ? "default" : "ghost"} size="sm" className="w-full justify-start flex items-center gap-2" onClick={onClick}>
        {children}
      </Button>
    </Link>
  )
}

const DesktopNav = () => {
  const pathname = usePathname()
  const isAdvancedActive = advancedTools.some((item) => pathname === item.href)
  const isDebugActive = debugTools.some((item) => pathname === item.href)

  return (
    <nav className="hidden md:flex items-center space-x-2 lg:space-x-4 mb-6">
      {mainNavigation.map((item) => (
        <NavLink key={item.name} href={item.href}><item.icon className="h-4 w-4" /> {item.name}</NavLink>
      ))}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={isAdvancedActive ? "default" : "ghost"} size="sm" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Advanced Tools
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {advancedTools.map((item) => (
            <DropdownMenuItem key={item.name} asChild>
              <Link href={item.href} className="flex items-center gap-3 cursor-pointer">
                <item.icon className="h-4 w-4" />
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={isDebugActive ? "default" : "ghost"} size="sm" className="flex items-center gap-2">
            <Bug className="h-4 w-4" />
            Debug Tools
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {debugTools.map((item, index) => (
            <DropdownMenuItem key={item.name} asChild>
              <Link href={item.href} className="flex items-center gap-3 cursor-pointer">
                <item.icon className="h-4 w-4" />
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  )
}

const MobileNav = () => {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="md:hidden mb-6">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <div className="flex flex-col space-y-2 p-4">
            <p className="text-lg font-semibold mb-2">Menu</p>
            {mainNavigation.map((item) => (
              <NavLink key={item.name} href={item.href} onClick={() => setIsOpen(false)}><item.icon className="h-4 w-4" /> {item.name}</NavLink>
            ))}
            <p className="text-sm font-semibold pt-4">Advanced Tools</p>
            {advancedTools.map((item) => (
              <NavLink key={item.name} href={item.href} onClick={() => setIsOpen(false)}><item.icon className="h-4 w-4" /> {item.name}</NavLink>
            ))}
            <p className="text-sm font-semibold pt-4">Debug Tools</p>
            {debugTools.map((item) => (
              <NavLink key={item.name} href={item.href} onClick={() => setIsOpen(false)}><item.icon className="h-4 w-4" /> {item.name}</NavLink>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default function Navigation() {
  const isMobile = useMobile()
  return isMobile ? <MobileNav /> : <DesktopNav />
}
