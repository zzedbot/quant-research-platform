import React, { useEffect, useState } from 'react'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'

interface Event { event_id: string; symbol: string; market: string; event_type: string; event_date: string; title: string; summary: string }

const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('')

  useEffect(() => {
    fetch(`/api/events${filterType ? `?event_type=${filterType}` : ''}`)
      .then(r => r.json()).then(d => { setEvents(d); setLoading(false) })
  }, [filterType])

  if (loading) return <div className="loading-text"><div className="inline-block w-5 h-5 border-2 border-[#1e2d3d] border-t-primary rounded-full animate-spin mr-2 align-middle" />加载中...</div>

  const typeColors: Record<string, string> = { earnings: 'success', notice: 'warning', dividend: 'default', suspension: 'destructive' }

  return (
    <div className="page-enter">
      <h1 className="text-xl font-semibold mb-1">事件库</h1>
      <p className="text-sm text-muted mb-6">查看财报/公告/分红/停复牌等事件数据</p>
      <div className="flex gap-4 mb-4">
        <Input placeholder="按类型过滤 (earnings/notice/dividend/suspension)"
          value={filterType} onChange={e => setFilterType(e.target.value)} className="max-w-xs" />
      </div>
      {events.length === 0 ? (
        <div className="stat-card text-center py-12">
          <div className="text-3xl mb-3">📰</div>
          <div className="text-lg font-medium mb-1">暂无事件数据</div>
          <div className="text-sm text-muted">事件数据将在后续版本中自动采集</div>
        </div>
      ) : (
        <div className="section-card">
          <Table>
            <TableHeader><TableRow>
              <TableHead>日期</TableHead><TableHead>类型</TableHead><TableHead>代码</TableHead><TableHead>标题</TableHead><TableHead>摘要</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {events.map(e => (
                <TableRow key={e.event_id}>
                  <TableCell className="font-mono text-xs">{e.event_date}</TableCell>
                  <TableCell><Badge variant={typeColors[e.event_type] || 'secondary'}>{e.event_type}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{e.symbol}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{e.title}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">{e.summary}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

export default Events
