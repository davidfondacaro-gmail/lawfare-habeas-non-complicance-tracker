"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface FacetOption {
  value: string
  label: string
  count: number
}

export interface FacetGroup {
  id: string
  label: string
  options: FacetOption[]
  selected: Set<string>
  onToggle: (value: string) => void
}

interface FacetedSidebarProps {
  facets: FacetGroup[]
  hasActiveFilters: boolean
  onClearAll: () => void
}

function FacetSection({ facet }: { facet: FacetGroup }) {
  const [open, setOpen] = useState(true)
  const selectedCount = facet.selected.size

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-none"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          {facet.label}
          {selectedCount > 0 && (
            <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-red-500 text-[0.6rem] font-bold text-white leading-none">
              {selectedCount}
            </span>
          )}
        </span>
        {open ? (
          <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
        ) : (
          <ChevronRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
        )}
      </button>

      {open && (
        <ul className="py-1" role="group" aria-label={facet.label}>
          {facet.options.map((opt) => {
            const checked = facet.selected.has(opt.value)
            const dimmed = opt.count === 0 && !checked
            return (
              <li key={opt.value}>
                <label
                  className={cn(
                    "flex items-center gap-2.5 px-4 py-1.5 text-sm cursor-pointer select-none hover:bg-muted/40 transition-colors",
                    dimmed && "opacity-40"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => facet.onToggle(opt.value)}
                    className="size-3.5 rounded border-border accent-red-500 cursor-pointer shrink-0"
                    aria-label={opt.label}
                  />
                  <span className="flex-1 min-w-0 truncate text-foreground/90 leading-tight">
                    {opt.label}
                  </span>
                  <span className="text-[0.7rem] text-muted-foreground tabular-nums shrink-0">
                    {opt.count}
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export function FacetedSidebar({ facets, hasActiveFilters, onClearAll }: FacetedSidebarProps) {
  return (
    <aside
      className="w-56 shrink-0 self-start sticky top-4"
      aria-label="Filter cases"
    >
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <span className="text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground">
            Filters
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-[0.65rem] text-red-500 hover:text-red-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
            >
              Clear all
            </button>
          )}
        </div>

        {facets.map((facet) => (
          <FacetSection key={facet.id} facet={facet} />
        ))}
      </div>
    </aside>
  )
}
