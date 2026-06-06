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

  if (loading) return <div className="p-8 text-center text-[#64748b]">加载中...</div>

  const typeColors: Record<string, string> = { earnings: 'success', notice: 'warning', dividend: 'default', suspension: 'destructive' }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-xl font-semibold mb-6">事件库</h1>
      <div className="flex gap-4 mb-4">
        <Input placeholder="按类型过滤" value={filterType} onChange={e => setFilterType(e.target.value)} className="max-w-xs" />
      </div>
      {events.length === 0 ? (
        <div className="text-center text-[#64748b] py-12">暂无事件数据</div>
      ) : (
        <Table>
          <TableHeader><TableRow>
            <TableHead>日期</TableHead><TableHead>类型</TableHead><TableHead>代码</TableHead><TableHead>标题</TableHead><TableHead>摘要</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {events.map(e => (
              <TableRow key={e.event_id}>
                <TableCell>{e.event_date}</TableCell>
                <TableCell><Badge variant={typeColors[e.event_type] || 'secondary'}>{e.event_type}</Badge></TableCell>
                <TableCell>{e.symbol}</TableCell>
                <TableCell className="max-w-xs truncate">{e.title}</TableCell>
                <TableCell className="max-w-xs truncate text-[#64748b]">{e.summary}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

export default Events
