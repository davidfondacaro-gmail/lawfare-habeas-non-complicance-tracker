import { Case } from "./types"
import { normalizeViolation } from "./violations"

const SHEET_ID = "1CFRm9LAKhq_ghwyE1c0bqQgii0QYKQuA9XR5G2NzRGg"
const API_KEY = "AIzaSyA_9B421PoUTiQMJ3R7-TAtUIetjWUFhYg"
const SHEET_NAME = "Mega List"
export const API_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(SHEET_NAME)}?key=${API_KEY}`

function parseHtmlCell(raw: string): { text: string; urls: string[] } {
  if (!raw || !raw.includes("<")) return { text: raw || "", urls: [] }
  const urls: string[] = []
  const hrefRegex = /href=["']?([^"'\s>]+)/gi
  let m: RegExpExecArray | null
  while ((m = hrefRegex.exec(raw)) !== null) {
    const url = m[1].trim()
    if (url.startsWith("http")) urls.push(url)
  }
  const text = raw.replace(/<[^>]*>/g, "").trim()
  return { text, urls }
}

function stripHtml(raw: string): string {
  if (!raw || !raw.includes("<")) return (raw || "").trim()
  return raw.replace(/<[^>]*>/g, "").trim()
}

function mapRowsToCases(headers: string[], dataRows: string[][]): Case[] {
  const h = headers.map((s) => (s || "").toLowerCase().trim())
  const find = (...kws: string[]) =>
    h.findIndex((col) => kws.some((kw) => col.includes(kw.toLowerCase())))

  const iName = find("case name", "casename", "case")
  const iCaseNo = find("case no", "case number")
  const iJuris = find("jurisdiction", "court")
  const iDate = find("date of order", "date", "order date", "filing")
  const iDesc = find("description", "summary")
  const iJudge = find("judge", "counsel")
  const iFilingLink = find("link to filing", "link to order")
  const iEntryNo = find("docket entry", "entry #", "entry no")
  const iDocketLink = find("link to full docket", "full docket", "link to docket")
  const iViolationType = find("violation type")

  const cases: Case[] = []
  for (const row of dataRows) {
    const get = (idx: number) =>
      idx >= 0 && idx < row.length ? (row[idx] || "").trim() : ""
    const rawName = get(iName)
    if (!rawName) continue

    const parsed = parseHtmlCell(rawName)
    const caseName = parsed.text
    if (!caseName) continue

    // Collect filing/order links (may be multiple, separated by ;)
    const filingUrls: string[] = []
    const filingVal = get(iFilingLink)
    if (filingVal) {
      const parts = filingVal.split(/;/).map((s) => s.trim()).filter((s) => s)
      for (const part of parts) {
        const cleaned = part.replace(/^\d+\)\s*/, "").trim()
        if (cleaned.startsWith("http")) {
          if (!filingUrls.includes(cleaned)) filingUrls.push(cleaned)
        } else {
          const fp = parseHtmlCell(cleaned)
          fp.urls.forEach((u) => {
            if (!filingUrls.includes(u)) filingUrls.push(u)
          })
        }
      }
    }

    // Collect full docket link
    let docketUrl: string | null = null
    const docketVal = get(iDocketLink)
    if (docketVal) {
      const dp = parseHtmlCell(docketVal)
      if (docketVal.startsWith("http")) docketUrl = docketVal.trim()
      else if (dp.urls.length > 0) docketUrl = dp.urls[0]
    }

    // Build CL URLs list (deduped)
    const clUrls: string[] = []
    parsed.urls.forEach((u) => {
      if (u.includes("courtlistener.com") && !clUrls.includes(u)) clUrls.push(u)
    })
    if (docketUrl && docketUrl.includes("courtlistener.com") && !clUrls.includes(docketUrl))
      clUrls.push(docketUrl)
    filingUrls.forEach((u) => {
      if (u.includes("courtlistener.com") && !clUrls.includes(u)) clUrls.push(u)
    })

    // Check all other columns for CL URLs
    for (let i = 0; i < row.length; i++) {
      if ([iName, iFilingLink, iDocketLink].includes(i)) continue
      const val = (row[i] || "").trim()
      if (val.includes("courtlistener.com")) {
        const p = parseHtmlCell(val)
        p.urls.forEach((u) => {
          if (u.includes("courtlistener.com") && !clUrls.includes(u)) clUrls.push(u)
        })
        if (val.startsWith("http") && val.includes("courtlistener.com") && !clUrls.includes(val))
          clUrls.push(val)
      }
    }

    const docketIds = clUrls
      .map((u) => {
        const m = u.match(/\/docket\/(\d+)\//)
        return m ? m[1] : null
      })
      .filter((id): id is string => id !== null)

    let judge = stripHtml(get(iJudge))
    let description = stripHtml(get(iDesc))
    description = description
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'")

    const entryNo = stripHtml(get(iEntryNo))
    const entryNos = entryNo
      ? entryNo.split(/;/).map((s) => s.trim()).filter((s) => s)
      : []

    const violationRaw = stripHtml(get(iViolationType))
    const violations = violationRaw
      ? violationRaw
        .split(/[,;]/)
        .map((v) => normalizeViolation(v.trim()))
        .filter((v) => v)
      : []
    const uniqueViolations = [...new Set(violations)]

    cases.push({
      caseName,
      caseNo: stripHtml(get(iCaseNo)),
      jurisdiction: stripHtml(get(iJuris)),
      date: stripHtml(get(iDate)),
      description,
      judge,
      filingUrls,
      docketUrl,
      entryNos,
      clUrls,
      docketIds,
      violations: uniqueViolations,
      _idx: cases.length,
    })
  }
  return cases
}

export async function fetchCases(): Promise<{ cases: Case[]; loadTime: string }> {
  let data: { values?: string[][] }

  // Try local snapshot first; fall back to live Google Sheets API
  const localResp = await fetch("/sheet-data.json")
  if (localResp.ok) {
    data = await localResp.json()
  } else {
    const resp = await fetch(API_URL)
    if (!resp.ok) {
      const body = await resp.text()
      throw new Error(`HTTP ${resp.status}: ${body.substring(0, 200)}`)
    }
    data = await resp.json()
  }

  const rows: string[][] = data.values || []
  const headers = rows[0] || []
  const cases = mapRowsToCases(headers, rows.slice(1))
  return { cases, loadTime: new Date().toLocaleTimeString() }
}
