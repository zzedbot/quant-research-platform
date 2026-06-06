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
    if (status === 'pass' || status === 'completed') return '#22c55e'
    if (status === 'warning') return '#f59e0b'
    return '#ef4444'
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>加载中...</div>

  return (
    <div>
      <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px' }}>数据中心</h1>

      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', marginBottom: '16px', color: '#ef4444' }}>
          {error}
        </div>
      )}

      {/* Data Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {dataStatus.map((s, i) => (
          <div key={i} style={{ background: '#111827', border: '1px solid #1e2d3d', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
              {s.market} {s.dataset}
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700 }}>{s.latest_date || '--'}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              {s.row_count.toLocaleString()} 条
            </div>
          </div>
        ))}
        {dataStatus.length === 0 && (
          <div style={{ gridColumn: '1/-1', padding: '20px', textAlign: 'center', color: '#64748b' }}>
            暂无数据，请点击更新按钮拉取数据
          </div>
        )}
      </div>

      {/* Update Button */}
      <button
        onClick={handleUpdate}
        disabled={updating}
        style={{
          padding: '10px 24px', background: updating ? '#475569' : '#0F766E', color: 'white',
          border: 'none', borderRadius: '8px', fontWeight: 600, cursor: updating ? 'not-allowed' : 'pointer',
          marginBottom: '20px', fontSize: '13px',
        }}
      >
        {updating ? '更新中...' : '🔄 更新数据'}
      </button>

      {/* Quality Checks */}
      {quality.length > 0 && (
        <div style={{ marginBottom: '20px', background: '#111827', border: '1px solid #1e2d3d', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e2d3d', fontWeight: 600, fontSize: '13px' }}>
            数据质量检查
          </div>
          <div style={{ padding: '12px 16px', fontSize: '12px' }}>
            {quality.map(q => (
              <div key={q.check_id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusColor(q.status), flexShrink: 0 }} />
                <span style={{ color: '#94a3b8' }}>{q.dataset}</span>
                <span style={{ color: '#64748b' }}>{q.check_type}</span>
                <span style={{ color: statusColor(q.status), fontWeight: 600 }}>{q.status}</span>
                {q.details && <span style={{ color: '#475569', fontSize: '11px', marginLeft: 'auto', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.details}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Job History */}
      <div style={{ background: '#111827', border: '1px solid #1e2d3d', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e2d3d', fontWeight: 600, fontSize: '13px' }}>
          更新历史
        </div>
        {jobs.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>暂无更新记录</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1e2d3d' }}>
                {['时间', '数据源', '市场', '数据集', '状态', '行数'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.map(j => (
                <tr key={j.job_id} style={{ borderBottom: '1px solid rgba(30,45,61,0.5)' }}>
                  <td style={{ padding: '8px 12px' }}>{j.started_at.slice(0, 19)}</td>
                  <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{j.data_source}</td>
                  <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{j.markets}</td>
                  <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{j.datasets}</td>
                  <td style={{ padding: '8px 12px', color: statusColor(j.status), fontWeight: 600 }}>{j.status}</td>
                  <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{j.row_count.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default DataCenter
