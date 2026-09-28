// Protected INT-Hub endpoints used by the dashboard. See docs/API.md.
import { apiJson, publicPost } from './auth'

/** SIP = Sending in Progress, ACP = Accepted, REJ = Rejected, URV = Under revision, REV = Revised, ERR = Error in sending. */
export const LEAD_STATUSES = ['SIP', 'ACP', 'REJ', 'URV', 'REV', 'ERR'] as const
export type LeadStatus = (typeof LEAD_STATUSES)[number]

/** LeadDataFilter */
export interface LeadDataFilter {
  sourceRefIds?: string[]
  status?: LeadStatus[]
}

/** LeadDataResponse (PII fields come back decrypted) */
export interface LeadData {
  id: string
  nameCust?: string
  genderCust?: string
  phoneCust1?: string
  phoneCust2?: string
  emailCust?: string
  facebookCust?: string
  instagramCust?: string
  twitterCust?: string
  addressCust?: string
  postalCode?: string
  provCust?: string
  cityCust?: string
  kecCust?: string
  kelCust?: string
  frameNo?: string
  prevDealer?: string
  asgnMD?: string
  asgnDealer?: string
  reaprevDealer?: string
  reaprevDealerDesc?: string
  propensity?: number
  seriesMtr?: string
  proMtrID?: string
  proMtrCol?: string
  desc?: string
  progProspect?: string
  plaCode?: string
  srcCode?: string
  sourceRefId?: string
  agent?: string
  dateValid?: string
  validator?: string
  dateCreate?: string
  proFlag?: string
  status?: LeadStatus
  errorMsg?: string
}

/** PageLeadDataResponse (Spring Page) */
export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  numberOfElements: number
  first: boolean
  last: boolean
  empty: boolean
}

export interface PageRequest {
  page?: number
  size?: number
  /** e.g. ["dateCreate,desc"] */
  sort?: string[]
}

/** POST /int/v1/revision/show */
export function searchLeads(filter: LeadDataFilter, { page = 0, size = 20, sort = [] }: PageRequest = {}) {
  const q = new URLSearchParams({ page: String(page), size: String(size) })
  sort.forEach((s) => q.append('sort', s))
  return apiJson<Page<LeadData>>(`/int/v1/revision/show?${q}`, 'POST', filter)
}

/** Total lead count per status, plus the overall total, using size=1 pages. */
export async function countLeadsByStatus(): Promise<{ total: number; byStatus: Record<LeadStatus, number> }> {
  const [total, ...counts] = await Promise.all([
    searchLeads({}, { size: 1 }).then((p) => p.totalElements),
    ...LEAD_STATUSES.map((s) => searchLeads({ status: [s] }, { size: 1 }).then((p) => p.totalElements)),
  ])
  return {
    total,
    byStatus: Object.fromEntries(LEAD_STATUSES.map((s, i) => [s, counts[i]])) as Record<LeadStatus, number>,
  }
}

/** BatchStatusSummary */
export interface BatchStatus {
  id: string
  idHdr?: string
  status: string
  sent?: number
  accepted?: number
  failed?: number
  sentTime?: string
  responseTime?: string
}

/** BatchStatusCheckResponse */
export interface BatchStatusCheck {
  status: string
  batchesChecked: number
  batches: BatchStatus[]
}

/**
 * GET /int/v1/data/status — triggers an async status check against Portal PASTI
 * for every PENDING / IN PROGRESS / FAILED batch and returns their last-known state.
 */
export function checkBatchStatus() {
  return apiJson<BatchStatusCheck>('/int/v1/data/status')
}

/** POST /int/v1/auth/pasti-test — public; 200 text on success, 401/502 on failure. */
export function testPastiConnection() {
  return publicPost<string>('/int/v1/auth/pasti-test')
}

/** UserResponse */
export interface User {
  email: string
  name: string
}

/** POST /int/v1/user/add — 409 when the email is already registered. */
export function addUser(user: User) {
  return apiJson<User>('/int/v1/user/add', 'POST', user)
}
