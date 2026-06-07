import React, { useEffect, useState } from 'react'
import * as api from '../api/client'

const DataCenter: React.FC = () => {
  const [dataStatus, setDataStatus] = useState<api.DataStatusItem[]>([])
  const [jobs, setJobs] = useState<api.JobInfo[]>([])
  const [quality, setQuality] = useState<api.QualityCheckInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      const [status, jobList, qcList] = await Promise.all([
        api.getDataStatus(),
        api.getJobs(20),
        api.getQualityChecks(20),
      ])
      setDataStatus(status)
      setJobs(jobList)
      setQuality(qcList)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleUpdate = async () => {
    setUpdating(true)
    try {
      await api.updateData({
        markets: ['CN'],
        datasets: ['symbols', 'trade_calendar', 'daily_bars'],
        start_date: '2026-06-01',
        end_date: '',
      })
      setTimeout(fetchData, 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setUpdating(false)
    }
  }

  const statusColor = (status: string) => {
    if (status === 'pass' || status === 'completed') return 'text-green-400'
    if (status === 'warning') return 'text-yellow-400'
    return 'text-red-400'
  }
  const dotColor = (status: string) => {
    if (status === 'pass' || status === 'completed') return 'bg-green-400'
    if (status === 'warning') return 'bg-yellow-400'
    return 'bg-red-400'
  }

  if (loading) return <div className="loading-text"><div className="inline-block w-5 h-5 border-2 border-[#1e2d3d] border-t-primary rounded-full animate-spin mr-2 align-middle" />加载中...</div>

  return (
    <div className="page-enter">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">数据中心</h1>
        <button
          onClick={handleUpdate}
          disabled={updating}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            updating ? 'bg-dim cursor-not-allowed' : 'bg-primary hover:bg-primary/90'
          } text-white`}
        >
          <span className={`inline-block w-4 h-4 ${updating ? 'animate-spin' : ''}`}>
            {updating ? '⏳' : '🔄'}
          </span>
          {updating ? '更新中...' : '更新数据'}
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Data Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {dataStatus.map((s, i) => (
          <div key={i} className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-xs text-muted uppercase tracking-wide">{s.market} {s.dataset}</span>
            </div>
            <div className="text-lg font-bold text-foreground">{s.latest_date || '--'}</div>
            <div className="text-xs text-muted mt-1">{s.row_count.toLocaleString()} 条记录</div>
          </div>
        ))}
        {dataStatus.length === 0 && (
          <div className="col-span-full stat-card text-center py-8">
            <div className="text-2xl mb-2">📂</div>
            <div className="text-muted text-sm">暂无数据，点击「更新数据」拉取</div>
          </div>
        )}
      </div>

      {/* Quality Checks */}
      {quality.length > 0 && (
        <div className="section-card mb-6">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <span>🔍</span>
            <span className="font-semibold text-sm">数据质量检查</span>
            <span className="ml-auto text-xs text-muted">{quality.filter(q => q.status === 'pass').length}/{quality.length} 通过</span>
          </div>
          <div className="p-4 space-y-2">
            {quality.map(q => (
              <div key={q.check_id} className="flex items-center gap-3 py-2 text-sm">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor(q.status)}`} />
                <span className="text-muted-foreground w-16">{q.dataset}</span>
                <span className="text-muted w-20">{q.check_type}</span>
                <span className={`font-medium ${statusColor(q.status)}`}>{q.status}</span>
                {q.details && (
                  <span className="text-dim text-xs ml-auto truncate max-w-[300px]">{q.details}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Job History */}
      <div className="section-card">
        <div className="px-4 py-3 border-b border-border">
          <span className="font-semibold text-sm">📜 更新历史</span>
        </div>
        {jobs.length === 0 ? (
          <div className="loading-text">暂无更新记录</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['时间', '数据源', '市场', '数据集', '状态', '行数'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.map(j => (
                  <tr key={j.job_id} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-2.5 font-mono text-xs">{j.started_at?.slice(0, 19)}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{j.data_source}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{j.markets}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{j.datasets}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1.5 font-medium ${statusColor(j.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dotColor(j.status)}`} />
                        {j.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground font-mono">{j.row_count.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default DataCenter
