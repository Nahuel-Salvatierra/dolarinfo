export const THEME_STORAGE_KEY = "dolarinfo-theme" as const

export type Theme = "light" | "dark"

export function applyThemeToDocument(theme: Theme): void {
  document.documentElement.classList.toggle("dark", theme === "dark")
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    return
  }
}

export function getThemeInitScript(): string {
  const key = JSON.stringify(THEME_STORAGE_KEY)
  return `(function(){try{var k=${key};var s=localStorage.getItem(k);var d;if(s==="dark")d=true;else if(s==="light")d=false;else d=window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d);}catch(e){}})();`
}
