"use client"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { type Case } from "@/lib/types"
import { getGroupColor, getViolationColor } from "@/lib/violations"
import { cn } from "@/lib/utils"

interface CaseCardProps {
  caseData: Case
  isOpen: boolean
  onToggle: (open: boolean) => void
  groupColor: string
}

export function CaseCard({ caseData: c, isOpen, onToggle, groupColor }: CaseCardProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <div
        className={cn(
          "border rounded-lg mb-1.5 overflow-hidden transition-colors",
          isOpen
            ? "dark:bg-[#0e0e16] dark:border-red-500/20 bg-card/80 border-primary/20"
            : "bg-card dark:bg-[#0b0b12] dark:border-[#1a1a28] border-border"
        )}
      >
        {/* Card trigger row */}
        <CollapsibleTrigger
          className={cn(
            "w-full text-left p-3 block cursor-pointer",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset rounded-lg"
          )}
        >
          <div className="flex items-start gap-3">
            {/* Gavel icon */}
            <div
              className="shrink-0 mt-0.5 flex items-center justify-center text-2xl text-foreground"
              aria-hidden="true"
            >
              ⚖
            </div>

            <div className="flex-1 min-w-0">
              {/* Case name */}
              <div className="text-[16px] font-semibold text-foreground italic leading-snug">
                {c.caseName}
              </div>

              {/* Case number */}
              {c.caseNo && (
                <div className="text-[0.7rem] text-muted-foreground italic mb-1">
                  No. {c.caseNo}
                </div>
              )}

              {/* Meta row */}
              <div className="text-[0.7rem] text-muted-foreground flex gap-3 flex-wrap mb-1">
                <span>{c.jurisdiction}</span>
                {c.judge && <><span className="text-muted-foreground/40">|</span><span className="text-muted-foreground">{c.judge}</span></>}
              </div>

              {/* Violation badges */}
              <div className="flex gap-1.5 flex-wrap items-center">
                {c.violations
                  .filter((v) => v && v !== "Misc")
                  .map((v) => (
                    <span
                      key={v}
                      className="text-[0.65rem] text-foreground/80 bg-muted border border-foreground/30 px-2 py-0.5 rounded-sm"
                    >
                      {v}
                    </span>
                  ))}
              </div>
            </div>

            {/* Date */}
            {c.date && (
              <div className="text-[0.7rem] text-muted-foreground shrink-0">
                {c.date}
              </div>
            )}
          </div>
        </CollapsibleTrigger>

        {/* Expanded detail panel */}
        <CollapsibleContent>
          <div
            className="px-4 pb-4 pt-3.5 border-t border-border"
            onClick={(e) => e.stopPropagation()}
          >
            {c.description && (
              <blockquote className="text-sm leading-relaxed text-card-foreground/80 italic border-l-2 border-red-500/40 pl-3.5 mb-3.5 max-w-3xl">
                {c.description}
              </blockquote>
            )}

            {c.judge && (
              <p className="text-xs text-muted-foreground mb-3.5">
                <span className="text-foreground/80 font-medium">Judge:</span> {c.judge}
              </p>
            )}

            {/* Links */}
            <div className="flex gap-4 flex-wrap mb-3.5">
              {c.filingUrls?.map((url, i) => (
                <a
                  key={"f" + i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-lawfare-green dark:text-lawfare-green-contrast underline transition-colors hover:text-lawfare-green/70 dark:hover:text-lawfare-green-contrast/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  View Filing/Order
                  {c.entryNos?.[i]
                    ? ` (${c.entryNos[i]})`
                    : c.filingUrls.length > 1
                      ? ` (${i + 1})`
                      : ""}{" "}
                  ↗
                </a>
              ))}
              {c.docketUrl && (
                <a
                  href={c.docketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-lawfare-green dark:text-lawfare-green-contrast underline transition-colors hover:text-lawfare-green/70 dark:hover:text-lawfare-green-contrast/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Full Docket on CourtListener ↗
                </a>
              )}
              {c.clUrls
                ?.filter((u) => !c.filingUrls?.includes(u) && u !== c.docketUrl)
                .map((url, i) => (
                  <a
                    key={"cl" + i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-lawfare-green dark:text-lawfare-green-contrast underline transition-colors hover:text-lawfare-green/70 dark:hover:text-lawfare-green-contrast/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    CourtListener ↗
                  </a>
                ))}
              {!c.filingUrls?.length && !c.docketUrl && !c.clUrls?.length && (
                <span className="text-xs text-muted-foreground/60">
                  No CourtListener links available.
                </span>
              )}
            </div>


          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
