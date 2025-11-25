"use client"

import Link from "next/link"
import { MapPin, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Tráfico Los Chorros</h1>
            <p className="text-xs text-muted-foreground">Sistema de Monitoreo</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          <Link href="/">
            <Button variant="ghost" className="text-sm">
              Dashboard
            </Button>
          </Link>
          <Link href="/analytics">
            <Button variant="ghost" className="text-sm">
              Análisis
            </Button>
          </Link>
          <Link href="/predictions">
            <Button variant="ghost" className="text-sm">
              Predicciones
            </Button>
          </Link>
          <Link href="/admin">
            <Button variant="ghost" className="text-sm">
              Admin
            </Button>
          </Link>
        </nav>

        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {mobileMenuOpen && (
        <nav className="flex flex-col gap-2 border-t border-border px-4 py-2 md:hidden">
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start text-sm">
              Dashboard
            </Button>
          </Link>
          <Link href="/analytics">
            <Button variant="ghost" className="w-full justify-start text-sm">
              Análisis
            </Button>
          </Link>
          <Link href="/predictions">
            <Button variant="ghost" className="w-full justify-start text-sm">
              Predicciones
            </Button>
          </Link>
          <Link href="/admin">
            <Button variant="ghost" className="w-full justify-start text-sm">
              Admin
            </Button>
          </Link>
        </nav>
      )}
    </header>
  )
}
