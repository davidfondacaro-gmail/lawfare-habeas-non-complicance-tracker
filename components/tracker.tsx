"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { fetchCases } from "@/lib/sheets"
import { type Case } from "@/lib/types"
import { getGroupColor } from "@/lib/violations"
import { JurisdictionPills } from "@/components/jurisdiction-pills"
import { FilterControls } from "@/components/filter-controls"
import { CaseCard } from "@/components/case-card"
import { ThemeToggle } from "@/components/theme-toggle"

function parseDate(s: string): number {
  if (!s) return 0
  const d = new Date(s.replace(/\./g, "").replace(/,/g, ",").trim())
  return isNaN(d.getTime()) ? 0 : d.getTime()
}

function getJurisGroup(jurisdiction: string): string {
  return (jurisdiction || "").trim() || "Unknown"
}

export function Tracker() {
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [sheetLoadTime, setSheetLoadTime] = useState<string | null>(null)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [search, setSearch] = useState("")
  const [filterGroup, setFilterGroup] = useState("all")
  const [filterViolation, setFilterViolation] = useState("all")
  const [showAllJuris, setShowAllJuris] = useState(false)
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

  // Derived data
  const groups = useMemo(() => {
    const g: Record<string, number> = {}
    cases.forEach((c) => {
      const gr = getJurisGroup(c.jurisdiction)
      g[gr] = (g[gr] || 0) + 1
    })
    return g
  }, [cases])

  const sortedGroupNames = useMemo(
    () =>
      Object.entries(groups)
        .sort((a, b) => b[1] - a[1])
        .map(([g]) => g),
    [groups]
  )

  const violationCounts = useMemo(() => {
    const vc: Record<string, number> = {}
    cases.forEach((c) => {
      ; (c.violations || []).forEach((v) => {
        vc[v] = (vc[v] || 0) + 1
      })
    })
    return vc
  }, [cases])

  const filtered = useMemo(() => {
    let f = cases
    if (filterGroup !== "all")
      f = f.filter((c) => getJurisGroup(c.jurisdiction) === filterGroup)
    if (filterViolation !== "all")
      f = f.filter((c) => (c.violations || []).includes(filterViolation))
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
    else if (sortBy === "judge")
      f = [...f].sort((a, b) => a.judge.localeCompare(b.judge))
    return f
  }, [cases, filterGroup, filterViolation, search, sortBy])

  const handleToggleCard = useCallback(
    (idx: number) => (open: boolean) => {
      setSelectedIdx(open ? idx : null)
    },
    []
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HEADER */}
      <header className="border-b border-border dark:border-[#2a1a1a] dark:bg-gradient-to-b dark:from-[#101018] dark:to-[#08080c] px-5 pt-7 pb-5">
        <div className="max-w-[1100px] mx-auto">
          {/* Brand row */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-baseline gap-3">
              <span className="text-[0.55rem] font-bold uppercase tracking-[0.22em] text-red-500">
                Lawfare Institute
              </span>
              <span className="text-muted-foreground/40 text-xs">•</span>
              <span className="text-[0.55rem] uppercase tracking-[0.12em] text-muted-foreground font-medium">
                Habeas Non-Compliance Tracker
              </span>
            </div>
            <ThemeToggle />
          </div>

          <h1 className="text-2xl font-bold text-foreground leading-tight mb-1.5">
            Government Contempt &amp; Non-Compliance
          </h1>

          <p className="text-sm text-muted-foreground mb-5 max-w-2xl leading-relaxed">
            {loading
              ? "Loading cases from spreadsheet…"
              : `${cases.length} documented instances of government non-compliance with federal court orders in immigration habeas cases, with links to the specific filings and orders.`}
          </p>

          {!loading && cases.length > 0 && (
            <>
              <div className="mb-4">
                <JurisdictionPills
                  groups={groups}
                  sortedGroupNames={sortedGroupNames}
                  filterGroup={filterGroup}
                  onFilterGroup={setFilterGroup}
                  showAll={showAllJuris}
                  onToggleShowAll={() => setShowAllJuris((v) => !v)}
                  totalCount={cases.length}
                />
              </div>
              <FilterControls
                search={search}
                onSearchChange={setSearch}
                filterGroup={filterGroup}
                onFilterGroupChange={setFilterGroup}
                filterViolation={filterViolation}
                onFilterViolationChange={setFilterViolation}
                sortBy={sortBy}
                onSortByChange={setSortBy}
                sortedGroupNames={sortedGroupNames}
                groups={groups}
                violationCounts={violationCounts}
                sheetLoadTime={sheetLoadTime}
              />
            </>
          )}
        </div>
      </header>

      {/* BODY */}
      <main className="max-w-[1100px] mx-auto px-5 py-4 pb-16">
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

        {/* Case list */}
        {!loading && cases.length > 0 && (
          <>
            {/* Status line */}
            <p
              className="text-xs text-muted-foreground mb-3.5"
              role="status"
              aria-live="polite"
            >
              Showing {filtered.length} of {cases.length} cases
              {filterGroup !== "all" && (
                <>
                  {" "}
                  in{" "}
                  <strong style={{ color: getGroupColor(filterGroup, sortedGroupNames) }}>
                    {filterGroup}
                  </strong>
                </>
              )}
              {filterViolation !== "all" && (
                <>
                  {" "}
                  •{" "}
                  <strong className="text-foreground/80">{filterViolation}</strong>
                </>
              )}
            </p>

            {/* Cards */}
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

            {/* Footer */}
            <div className="mt-6 border border-border rounded-lg p-4 dark:bg-[#0e0e16] dark:border-[#1e1e2a]">
              <div className="text-[0.6rem] font-semibold uppercase tracking-widest text-lawfare-green mb-1.5">
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
                  className="text-lawfare-green hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
                >
                  Lawfare Institute
                </a>
                . Docket entries from{" "}
                <a
                  href="https://www.courtlistener.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lawfare-green hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
                >
                  CourtListener RECAP
                </a>
                .
              </p>
              <p className="text-[0.7rem] text-muted-foreground/60">
                Data refreshes from Google Sheets on each page load.
              </p>
            </div>

            <p className="text-center text-[0.6rem] text-muted-foreground/40 mt-3.5">
              Data: Lawfare Institute • Documents: CourtListener RECAP • Free Law Project
            </p>
          </>
        )}
      </main>
    </div>
  )
}
