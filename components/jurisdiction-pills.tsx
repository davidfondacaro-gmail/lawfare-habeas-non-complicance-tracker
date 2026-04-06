"use client"

import { Button } from "@/components/ui/button"
import { getGroupColor } from "@/lib/violations"
import { cn } from "@/lib/utils"

interface JurisdictionPillsProps {
  groups: Record<string, number>
  sortedGroupNames: string[]
  filterGroup: string
  onFilterGroup: (group: string) => void
  showAll: boolean
  onToggleShowAll: () => void
  totalCount: number
}

export function JurisdictionPills({
  groups,
  sortedGroupNames,
  filterGroup,
  onFilterGroup,
  showAll,
  onToggleShowAll,
  totalCount,
}: JurisdictionPillsProps) {
  const entries = Object.entries(groups).sort((a, b) => b[1] - a[1])
  const visible = showAll ? entries : entries.slice(0, 5)
  const hiddenCount = entries.length - 5

  return (
    <div className="flex gap-2.5 flex-wrap items-center" role="group" aria-label="Filter by jurisdiction">
      {visible.map(([g, count]) => {
        const color = getGroupColor(g, sortedGroupNames)
        const active = filterGroup === g
        return (
          <button
            key={g}
            onClick={() => onFilterGroup(active ? "all" : g)}
            aria-pressed={active}
            aria-label={`${g}: ${count} cases${active ? " (active filter)" : ""}`}
            className={cn(
              "px-3.5 py-1.5 rounded-lg border text-left cursor-pointer transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? "border-opacity-30" : "border-border bg-card dark:bg-[#111118] hover:border-border/80"
            )}
            style={
              active
                ? { background: color + "18", borderColor: color + "44" }
                : undefined
            }
          >
            <div
              className="font-mono text-lg font-medium leading-none"
              style={{ color }}
            >
              {count}
            </div>
            <div className="text-[0.55rem] uppercase tracking-wider text-muted-foreground mt-0.5">
              {g}
            </div>
          </button>
        )
      })}

      {hiddenCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleShowAll}
          aria-label={showAll ? "Show fewer jurisdictions" : `Show ${hiddenCount} more jurisdictions`}
          className="text-[0.65rem] h-auto py-1.5 px-3 dark:bg-[#111118] dark:border-[#2a2a3a]"
        >
          {showAll ? "Show less" : `+${hiddenCount} more`}
        </Button>
      )}

      {/* Total pill */}
      <div
        className="px-3.5 py-1.5 rounded-lg border border-border bg-card dark:bg-[#111118] dark:border-[#2a2a3a]"
        aria-label={`Total: ${totalCount} cases`}
      >
        <div className="font-mono text-lg font-medium leading-none text-red-500">
          {totalCount}
        </div>
        <div className="text-[0.55rem] uppercase tracking-wider text-muted-foreground mt-0.5">
          Total
        </div>
      </div>
    </div>
  )
}
