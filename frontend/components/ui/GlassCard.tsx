"use client";

import { cn } from "@/lib/utils";

// Componente reutilizable para el efecto "Liquid Glass"
export const GlassCard = ({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) => (
  <div
    onClick={onClick}
    className={cn(
      "bg-background/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-6 pointer-events-auto transition-all duration-300",
      className
    )}
  >
    {children}
  </div>
);