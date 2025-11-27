"use client";

import Link from "next/link";
import { MapPin, Menu, Activity, TrendingUp, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const handleLogout = () => {
    // Eliminar cookies
    document.cookie = "access=; path=/; max-age=0";
    document.cookie = "refresh=; path=/; max-age=0";
    window.location.href = "/login";
  };

  // Link helper para mantener el código limpio
  const NavLink = ({ href, icon: Icon, children }: any) => (
    <Link href={href}>
      <Button
        variant="ghost"
        className="text-sm text-foreground/80 hover:text-white hover:bg-white/10 transition-all gap-2"
      >
        {Icon && <Icon className="w-4 h-4 opacity-70" />}
        {children}
      </Button>
    </Link>
  );

  return (
    // Quitamos 'sticky' y bordes porque el contenedor padre en DashboardPage ya maneja el efecto Glass
    <header className="w-full bg-transparent">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* LOGO AREA */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-blue-600 to-blue-400 text-white shadow-lg shadow-blue-500/20">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight text-foreground leading-none">
              Tráfico Los Chorros
            </h1>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Sistema en vivo
              </p>
            </div>
          </div>
        </div>

        {/* DESKTOP NAV */}
        <nav className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/5">
          <NavLink href="/" icon={Activity}>
            Dashboard
          </NavLink>
          <NavLink href="/analytics" icon={TrendingUp}>
            Análisis
          </NavLink>
          <NavLink href="/admin" icon={Settings}>
            Admin
          </NavLink>
          <Button variant="ghost" onClick={handleLogout}>
            Cerrar sesion
          </Button>
        </nav>

        {/* MOBILE MENU TOGGLE */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden hover:bg-white/10 text-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* MOBILE MENU DROPDOWN */}
      {mobileMenuOpen && (
        <div className="absolute top-20 left-4 right-4 z-50 flex flex-col gap-2 p-2 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl md:hidden animate-in fade-in slide-in-from-top-5">
          <Link href="/" onClick={() => setMobileMenuOpen(false)}>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm hover:bg-white/10"
            >
              <Activity className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <Link href="/analytics" onClick={() => setMobileMenuOpen(false)}>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm hover:bg-white/10"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Análisis
            </Button>
          </Link>
          <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm hover:bg-white/10"
            >
              <Settings className="w-4 h-4 mr-2" />
              Admin
            </Button>
          </Link>
        </div>
      )}
    </header>
  );
}
