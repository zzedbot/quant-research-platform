const API_BASE = '/api'

export interface DataStatusItem {
  dataset: string
  market: string
  latest_date: string | null
  row_count: number
  last_updated: string | null
}

export interface JobInfo {
  job_id: string
  data_source: string
  markets: string
  datasets: string
  start_date: string | null
  end_date: string | null
  started_at: string
  finished_at: string | null
  status: string
  row_count: number
  error_message: string | null
}

export interface QualityCheckInfo {
  check_id: number
  job_id: string
  dataset: string
  market: string
  check_type: string
  status: string
  details: string | null
  checked_at: string
}

export async function getDataStatus(): Promise<DataStatusItem[]> {
  const res = await fetch(`${API_BASE}/data/status`)
  return res.json()
}

export async function updateData(params: {
  markets: string[]
  datasets: string[]
  start_date: string
  end_date: string
}): Promise<{ job_id: string; status: string }> {
  const res = await fetch(`${API_BASE}/data/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  return res.json()
}

export async function getJobs(limit = 50): Promise<JobInfo[]> {
  const res = await fetch(`${API_BASE}/data/jobs?limit=${limit}`)
  return res.json()
}

export async function getQualityChecks(limit = 50): Promise<QualityCheckInfo[]> {
  const res = await fetch(`${API_BASE}/data/quality?limit=${limit}`)
  return res.json()
}
