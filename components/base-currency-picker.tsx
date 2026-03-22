"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { COUNTRY_TO_CURRENCY } from "@/lib/frankfurter/locale"

interface BaseCurrencyPickerProps {
  currencies: Record<string, string>
  currentBase: string
}

export function BaseCurrencyPicker({
  currencies,
  currentBase,
}: BaseCurrencyPickerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const regionDisplayNamesEn = useMemo(() => {
    return new Intl.DisplayNames(["en"], { type: "region" })
  }, [])

  const regionDisplayNamesEs = useMemo(() => {
    return new Intl.DisplayNames(["es"], { type: "region" })
  }, [])

  const countryNamesByCurrency = useMemo(() => {
    const map = new Map<string, Set<string>>()

    Object.entries(COUNTRY_TO_CURRENCY).forEach(([countryCode, currencyCode]) => {
      const englishCountry = regionDisplayNamesEn.of(countryCode)
      const spanishCountry = regionDisplayNamesEs.of(countryCode)
      if (!map.has(currencyCode)) {
        map.set(currencyCode, new Set<string>())
      }
      if (englishCountry) {
        map.get(currencyCode)?.add(englishCountry)
      }
      if (spanishCountry) {
        map.get(currencyCode)?.add(spanishCountry)
      }
    })

    return map
  }, [regionDisplayNamesEn, regionDisplayNamesEs])

  const options = useMemo(() => {
    return Object.entries(currencies)
      .map(([code, name]) => {
        const countries = Array.from(countryNamesByCurrency.get(code) ?? [])
        const searchableText = `${code} ${name} ${countries.join(" ")}`.toLowerCase()
        return {
          code,
          name,
          countries,
          searchableText,
        }
      })
      .sort((a, b) => a.code.localeCompare(b.code))
  }, [countryNamesByCurrency, currencies])

  const selectedOption = useMemo(() => {
    return options.find((option) => option.code === currentBase)
  }, [currentBase, options])

  useEffect(() => {
    if (!isOpen) {
      setQuery(selectedOption ? `${selectedOption.code} — ${selectedOption.name}` : "")
    }
  }, [isOpen, selectedOption])

  const normalizedQuery = query.trim().toLowerCase()
  const filteredOptions = useMemo(() => {
    if (!normalizedQuery) {
      return options
    }
    return options.filter((option) => option.searchableText.includes(normalizedQuery))
  }, [normalizedQuery, options])

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("base", value)
    router.push(`${pathname}?${params.toString()}`)
    const selected = options.find((option) => option.code === value)
    setQuery(selected ? `${selected.code} — ${selected.name}` : value)
    setIsOpen(false)
  }

  return (
    <div className="relative w-72">
      <input
        type="text"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          setTimeout(() => {
            setIsOpen(false)
          }, 120)
        }}
        placeholder="Buscar por código o país"
        className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-md">
          {filteredOptions.length === 0 ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              Sin resultados
            </div>
          ) : (
            filteredOptions.map((option) => (
              <button
                key={option.code}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault()
                }}
                onClick={() => handleChange(option.code)}
                className="flex w-full flex-col rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
              >
                <span>
                  {option.code} — {option.name}
                </span>
                {option.countries.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {option.countries.join(" · ")}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
