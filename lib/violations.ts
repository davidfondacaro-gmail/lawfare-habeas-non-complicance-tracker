const VIOLATION_COLOR_RULES: { match: string; color: string }[] = [
  { match: "failure to file", color: "#3b82f6" },
  { match: "failure to timely release", color: "#ef4444" },
  { match: "failure to release", color: "#ef4444" },
  { match: "transfer de", color: "#f97316" },
  { match: "unauthorized transfer", color: "#f97316" },
  { match: "failure to return detainee", color: "#f59e0b" },
  { match: "failure to return property", color: "#a855f7" },
  { match: "failure to provide bond", color: "#10b981" },
  { match: "failure to hold bond", color: "#10b981" },
  { match: "failure to produce evidence", color: "#06b6d4" },
  { match: "failure to provide evidence", color: "#06b6d4" },
  { match: "failure to produce detainee", color: "#06b6d4" },
  { match: "removal", color: "#dc2626" },
  { match: "deportation", color: "#dc2626" },
  { match: "imposed conditions", color: "#eab308" },
  { match: "conditions in violation", color: "#eab308" },
  { match: "conditions on release", color: "#eab308" },
  { match: "misrepresentation", color: "#e11d48" },
  { match: "false", color: "#e11d48" },
  { match: "failure to coordinate", color: "#14b8a6" },
  { match: "failure to provide detainee medication", color: "#ec4899" },
  { match: "medication", color: "#ec4899" },
  { match: "failure to respond", color: "#06b6d4" },
  { match: "incomplete", color: "#8b5cf6" },
  { match: "misc", color: "#6b7280" },
]

export function getViolationColor(type: string): string {
  if (!type) return "#6b7280"
  const lower = type.toLowerCase().trim()
  for (const rule of VIOLATION_COLOR_RULES) {
    if (lower.startsWith(rule.match) || lower.includes(rule.match)) return rule.color
  }
  return "#6b7280"
}

export function normalizeViolation(v: string): string {
  if (!v) return ""
  const t = v.trim()
  const tl = t.toLowerCase()
  if (tl.includes("transfer de") || tl.includes("unauthorized transfer"))
    return "Transfer Despite Order"
  if (tl.includes("removal") || tl.includes("deportation"))
    return "Removal/Deportation Despite Order"
  if (
    tl.includes("imposed conditions") ||
    tl.includes("conditions in violation") ||
    tl.includes("conditions on release")
  )
    return "Imposed Conditions in Violation of Order"
  if (tl.includes("provide bond") || tl.includes("hold bond"))
    return "Failure to Provide Bond Hearing"
  if (tl.includes("produce evidence") || tl.includes("provide evidence"))
    return "Failure to Produce Evidence"
  if (tl === "failure to release") return "Failure to Timely Release"
  if (tl.includes("coordinate")) return "Failure to Coordinate with Counsel"
  if (tl === "misc" || tl === "misc.") return "Misc"
  if (tl.startsWith("failure to file")) return "Failure to File"
  if (tl.includes("failure to respond")) return "Failure to File"
  if (tl.includes("return propertyi")) return "Failure to Return Property"
  return t
}

export const PALETTE = [
  "#ef4444",
  "#3b82f6",
  "#f59e0b",
  "#10b981",
  "#a855f7",
  "#06b6d4",
  "#f97316",
  "#e11d48",
  "#8b5cf6",
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#84cc16",
  "#fb923c",
  "#22d3ee",
]

export function getGroupColor(group: string, allGroups: string[]): string {
  const idx = allGroups.indexOf(group)
  if (idx >= 0 && idx < PALETTE.length) return PALETTE[idx]
  return "#6b7280"
}
