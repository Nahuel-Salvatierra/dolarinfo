"use client"

import { useCallback, useLayoutEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { applyThemeToDocument, type Theme } from "@/lib/theme"

function themeFromDocument(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null)

  useLayoutEffect(() => {
    setTheme(themeFromDocument())
  }, [])

  const toggle = useCallback(() => {
    const next: Theme = themeFromDocument() === "dark" ? "light" : "dark"
    applyThemeToDocument(next)
    setTheme(next)
  }, [])

  const resolved = theme ?? "light"
  const isDark = resolved === "dark"

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-lg"
      className={cn(
        "h-10 w-10 shrink-0 border-border bg-background shadow-sm",
        className
      )}
      onClick={toggle}
      disabled={theme === null}
      aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
      aria-pressed={isDark}
    >
      {isDark ? (
        <Sun className="size-4" aria-hidden />
      ) : (
        <Moon className="size-4" aria-hidden />
      )}
    </Button>
  )
}
