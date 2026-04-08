"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { fetchCases } from "@/lib/sheets"
import { type Case } from "@/lib/types"
import { getGroupColor, normalizeViolation } from "@/lib/violations"
import { CaseCard } from "@/components/case-card"
import { ThemeToggle } from "@/components/theme-toggle"
import { FacetedSidebar, type FacetOption } from "@/components/faceted-sidebar"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function parseDate(s: string): number {
  if (!s) return 0
  const d = new Date(s.replace(/\./g, "").replace(/,/g, ",").trim())
  return isNaN(d.getTime()) ? 0 : d.getTime()
}

function getJurisGroup(jurisdiction: string): string {
  return (jurisdiction || "").trim() || "Unknown"
}

export function FacetedTracker() {
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [sheetLoadTime, setSheetLoadTime] = useState<string | null>(null)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [search, setSearch] = useState("")
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<Set<string>>(new Set())
  const [selectedViolations, setSelectedViolations] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState("recent")

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    fetchCases()
      .then(({ cases: loaded, loadTime }) => {
        if (!cancelled) {
          setCases(loaded)
          setSheetLoadTime(loadTime)
          setLoading(false)
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setLoadError(err.message)
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  // All unique normalized jurisdiction names sorted by count
  const allJurisdictions = useMemo(() => {
    const counts: Record<string, number> = {}
    cases.forEach((c) => {
      const g = getJurisGroup(c.jurisdiction)
      counts[g] = (counts[g] || 0) + 1
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name)
  }, [cases])

  // All unique normalized violation names sorted by count
  const allViolations = useMemo(() => {
    const counts: Record<string, number> = {}
    cases.forEach((c) => {
      ; (c.violations || []).forEach((v) => {
        const n = normalizeViolation(v)
        if (n) counts[n] = (counts[n] || 0) + 1
      })
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name)
  }, [cases])

  // Filtered result set: both facets AND search applied
  const filtered = useMemo(() => {
    let f = cases

    if (selectedJurisdictions.size > 0) {
      f = f.filter((c) => selectedJurisdictions.has(getJurisGroup(c.jurisdiction)))
    }

    if (selectedViolations.size > 0) {
      f = f.filter((c) =>
        (c.violations || []).some((v) => selectedViolations.has(normalizeViolation(v)))
      )
    }

    if (search) {
      const q = search.toLowerCase()
      f = f.filter((c) =>
        [c.caseName, c.caseNo, c.jurisdiction, c.description, c.judge, ...(c.violations || [])].some(
          (s) => (s || "").toLowerCase().includes(q)
        )
      )
    }

    if (sortBy === "recent") f = [...f].sort((a, b) => parseDate(b.date) - parseDate(a.date))
    else if (sortBy === "alpha") f = [...f].sort((a, b) => a.caseName.localeCompare(b.caseName))
    else if (sortBy === "jurisdiction")
      f = [...f].sort((a, b) => a.jurisdiction.localeCompare(b.jurisdiction))
    else if (sortBy === "judge") f = [...f].sort((a, b) => a.judge.localeCompare(b.judge))

    return f
  }, [cases, selectedJurisdictions, selectedViolations, search, sortBy])

  // Facet counts: each facet shows counts from cases filtered by the OTHER active facet + search
  // (so counts reflect what you'd see if you toggled that option on/off)
  const jurisFacetCounts = useMemo(() => {
    let base = cases
    if (selectedViolations.size > 0) {
      base = base.filter((c) =>
        (c.violations || []).some((v) => selectedViolations.has(normalizeViolation(v)))
      )
    }
    if (search) {
      const q = search.toLowerCase()
      base = base.filter((c) =>
        [c.caseName, c.caseNo, c.jurisdiction, c.description, c.judge, ...(c.violations || [])].some(
          (s) => (s || "").toLowerCase().includes(q)
        )
      )
    }
    const counts: Record<string, number> = {}
    base.forEach((c) => {
      const g = getJurisGroup(c.jurisdiction)
      counts[g] = (counts[g] || 0) + 1
    })
    return counts
  }, [cases, selectedViolations, search])

  const violationFacetCounts = useMemo(() => {
    let base = cases
    if (selectedJurisdictions.size > 0) {
      base = base.filter((c) => selectedJurisdictions.has(getJurisGroup(c.jurisdiction)))
    }
    if (search) {
      const q = search.toLowerCase()
      base = base.filter((c) =>
        [c.caseName, c.caseNo, c.jurisdiction, c.description, c.judge, ...(c.violations || [])].some(
          (s) => (s || "").toLowerCase().includes(q)
        )
      )
    }
    const counts: Record<string, number> = {}
    base.forEach((c) => {
      ; (c.violations || []).forEach((v) => {
        const n = normalizeViolation(v)
        if (n) counts[n] = (counts[n] || 0) + 1
      })
    })
    return counts
  }, [cases, selectedJurisdictions, search])

  // Toggle helpers
  const toggleJurisdiction = useCallback((value: string) => {
    setSelectedJurisdictions((prev) => {
      const next = new Set(prev)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }, [])

  const toggleViolation = useCallback((value: string) => {
    setSelectedViolations((prev) => {
      const next = new Set(prev)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }, [])

  const clearAll = useCallback(() => {
    setSelectedJurisdictions(new Set())
    setSelectedViolations(new Set())
  }, [])

  const handleToggleCard = useCallback(
    (idx: number) => (open: boolean) => {
      setSelectedIdx(open ? idx : null)
    },
    []
  )

  const hasActiveFilters = selectedJurisdictions.size > 0 || selectedViolations.size > 0

  // Build facet option arrays
  const jurisFacetOptions: FacetOption[] = allJurisdictions.map((name) => ({
    value: name,
    label: name,
    count: jurisFacetCounts[name] ?? 0,
  }))

  const violationFacetOptions: FacetOption[] = allViolations.map((name) => ({
    value: name,
    label: name,
    count: violationFacetCounts[name] ?? 0,
  }))

  // Sorted group names (for color assignment)
  const sortedGroupNames = allJurisdictions

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HEADER */}
      <header className="border-b border-border dark:border-[#2a1a1a] dark:bg-gradient-to-b dark:from-[#101018] dark:to-[#08080c] px-5 pt-7 pb-5">
        <div className="max-w-[1280px] mx-auto">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-baseline gap-3">
              <span className="text-[14px] font-bold uppercase tracking-[0.22em] text-lawfare-green">
                Lawfare Institute
              </span>
            </div>
            <ThemeToggle />
          </div>

          <h1 className="text-2xl font-bold text-foreground leading-tight mb-1.5">
            Habeas Non-Compliance Tracker
          </h1>

          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            {loading
              ? "Loading cases from spreadsheet…"
              : `${cases.length} documented instances of government non-compliance with federal court orders in immigration habeas cases.`}
          </p>
        </div>
      </header>

      {/* BODY */}
      <div className="max-w-[1280px] mx-auto px-5 py-6 pb-16">
        {/* Loading state */}
        {loading && (
          <div
            className="flex justify-center py-20"
            aria-busy="true"
            aria-label="Loading cases"
            role="status"
          >
            <div className="flex items-center gap-3">
              <div className="size-2.5 rounded-full bg-red-500 animate-pulse" aria-hidden="true" />
              <span className="text-sm text-muted-foreground">Loading cases…</span>
            </div>
          </div>
        )}

        {/* Error state */}
        {loadError && !loading && (
          <div className="flex flex-col items-center text-center py-16 gap-3" role="alert">
            <p className="text-sm text-red-500 font-medium">Failed to load spreadsheet data</p>
            <pre className="font-mono text-[0.65rem] text-muted-foreground max-w-lg text-left whitespace-pre-wrap bg-muted rounded p-3">
              {loadError}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded px-4 py-2 hover:bg-red-500/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Retry
            </button>
          </div>
        )}

        {/* Two-column layout: sidebar + results */}
        {!loading && !loadError && cases.length > 0 && (
          <div className="flex gap-6 items-start">
            {/* LEFT: Faceted sidebar */}
            <FacetedSidebar
              hasActiveFilters={hasActiveFilters}
              onClearAll={clearAll}
              facets={[
                {
                  id: "jurisdiction",
                  label: "Jurisdiction",
                  options: jurisFacetOptions,
                  selected: selectedJurisdictions,
                  onToggle: toggleJurisdiction,
                },
                {
                  id: "violation",
                  label: "Violation Type",
                  options: violationFacetOptions,
                  selected: selectedViolations,
                  onToggle: toggleViolation,
                },
              ]}
            />

            {/* RIGHT: Search + results */}
            <main className="flex-1 min-w-0">
              {/* Search bar */}
              <div className="relative mb-4">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <circle cx={11} cy={11} r={8} />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <Input
                  type="search"
                  placeholder="Search cases, judges, descriptions…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9 text-sm"
                  aria-label="Search cases"
                />
              </div>

              {/* Results bar: count + sort */}
              <div className="flex items-center justify-between mb-3.5">
                <p
                  className="text-sm text-muted-foreground"
                  role="status"
                  aria-live="polite"
                >
                  <span className="font-semibold text-foreground">{filtered.length}</span>
                  {" "}
                  {filtered.length === 1 ? "result" : "results"}
                  {filtered.length !== cases.length && (
                    <span className="text-xs"> of {cases.length}</span>
                  )}
                </p>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Sort by</span>
                  <Select value={sortBy} onValueChange={(v) => v && setSortBy(v)}>
                    <SelectTrigger className="h-7 text-xs w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Most recent</SelectItem>
                      <SelectItem value="alpha">A → Z</SelectItem>
                      <SelectItem value="jurisdiction">Jurisdiction</SelectItem>
                      <SelectItem value="judge">Judge</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Case cards */}
              {filtered.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-sm text-muted-foreground">No cases match your current filters.</p>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearAll}
                      className="mt-3 text-xs text-red-500 hover:underline focus-visible:outline-none"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  {filtered.map((c) => (
                    <CaseCard
                      key={c._idx}
                      caseData={c}
                      isOpen={selectedIdx === c._idx}
                      onToggle={handleToggleCard(c._idx)}
                      groupColor={getGroupColor(getJurisGroup(c.jurisdiction), sortedGroupNames)}
                    />
                  ))}
                </div>
              )}

              {/* Footer */}
              {filtered.length > 0 && (
                <div className="mt-6 border border-border rounded-lg p-4 dark:bg-[#0e0e16] dark:border-[#1e1e2a]">
                  <div className="text-[0.6rem] font-semibold uppercase tracking-widest text-red-500 mb-1.5">
                    About This Tracker
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                    Tracking instances where federal courts have found or threatened contempt, sanctions,
                    or other remedial action against the government for non-compliance with court orders
                    in immigration and habeas corpus cases. Data sourced from the{" "}
                    <a
                      href="https://www.lawfaremedia.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-500 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
                    >
                      Lawfare Institute
                    </a>
                    . Docket entries from{" "}
                    <a
                      href="https://www.courtlistener.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
                    >
                      CourtListener RECAP
                    </a>
                    .
                  </p>
                  {sheetLoadTime && (
                    <p className="text-[0.7rem] text-muted-foreground/60">
                      Data loaded at {sheetLoadTime}. Refreshes from Google Sheets on each page load.
                    </p>
                  )}
                </div>
              )}

              <p className="text-center text-[0.6rem] text-muted-foreground/40 mt-3.5">
                Data: Lawfare Institute • Documents: CourtListener RECAP • Free Law Project
              </p>
            </main>
          </div>
        )}
      </div>
    </div>
  )
}
