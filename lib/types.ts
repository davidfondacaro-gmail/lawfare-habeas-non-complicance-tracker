export interface Case {
  _idx: number
  caseName: string
  caseNo: string
  jurisdiction: string
  date: string
  description: string
  judge: string
  filingUrls: string[]
  docketUrl: string | null
  entryNos: string[]
  clUrls: string[]
  docketIds: string[]
  violations: string[]
}
