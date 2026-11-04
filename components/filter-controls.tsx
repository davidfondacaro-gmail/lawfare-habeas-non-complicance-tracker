"use client"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface FilterControlsProps {
  search: string
  onSearchChange: (v: string) => void
  filterGroup: string
  onFilterGroupChange: (v: string) => void
  filterViolation: string
  onFilterViolationChange: (v: string) => void
  sortBy: string
  onSortByChange: (v: string) => void
  sortedGroupNames: string[]
  groups: Record<string, number>
  violationCounts: Record<string, number>
  sheetLoadTime: string | null
}

export function FilterControls({
  search,
  onSearchChange,
  filterGroup,
  onFilterGroupChange,
  filterViolation,
  onFilterViolationChange,
  sortBy,
  onSortByChange,
  sortedGroupNames,
  groups,
  violationCounts,
  sheetLoadTime,
}: FilterControlsProps) {
  return (
    <div className="flex gap-2 flex-wrap items-center">
      <Input
        placeholder="Search cases, judges, courts…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        aria-label="Search cases, judges, courts"
        className="w-60 h-8 text-xs dark:bg-[#111118] dark:border-[#2a2a3a]"
      />

      <Select value={filterGroup} onValueChange={(v) => onFilterGroupChange(v ?? "all")}>
        <SelectTrigger
          aria-label="Filter by jurisdiction"
          className="h-8 text-xs w-auto min-w-40 dark:bg-[#111118] dark:border-[#2a2a3a]"
        >
          <SelectValue placeholder="All Jurisdictions" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Jurisdictions</SelectItem>
          {sortedGroupNames.map((g) => (
            <SelectItem key={g} value={g}>
              {g} ({groups[g] ?? 0})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filterViolation}
        onValueChange={(v) => onFilterViolationChange(v ?? "all")}
      >
        <SelectTrigger
          aria-label="Filter by violation type"
          className="h-8 text-xs w-auto min-w-44 dark:bg-[#111118] dark:border-[#2a2a3a]"
        >
          <SelectValue placeholder="All Violation Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Violation Types</SelectItem>
          {Object.entries(violationCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([vt, count]) => (
              <SelectItem key={vt} value={vt}>
                {vt} ({count})
              </SelectItem>
            ))}
        </SelectContent>
      </Select>

      <Select value={sortBy} onValueChange={(v) => onSortByChange(v ?? "recent")}>
        <SelectTrigger
          aria-label="Sort order"
          className="h-8 text-xs w-auto min-w-36 dark:bg-[#111118] dark:border-[#2a2a3a]"
        >
          <SelectValue placeholder="Sort: Most Recent" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="recent">Sort: Most Recent</SelectItem>
          <SelectItem value="alpha">Sort: Case Name</SelectItem>
          <SelectItem value="jurisdiction">Sort: Jurisdiction</SelectItem>
          <SelectItem value="judge">Sort: Judge</SelectItem>
        </SelectContent>
      </Select>

      {sheetLoadTime && (
        <div className="font-mono text-[0.6rem] text-muted-foreground/60 ml-auto" aria-label={`Data loaded at ${sheetLoadTime}`}>
          Sheet loaded {sheetLoadTime}
        </div>
      )}
    </div>
  )
}
