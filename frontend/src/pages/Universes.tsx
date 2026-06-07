import React, { useEffect, useState } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '../components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'

interface Universe { id: string; name: string; description: string; symbols: string[]; filters: string[]; created_at: string }
const API = '/api/universes'

const Universes: React.FC = () => {
  const [universes, setUniverses] = useState<Universe[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ name: '', symbols: '', filters: [] as string[] })

  const fetchData = async () => {
    const res = await fetch(API)
    setUniverses(await res.json())
    setLoading(false)
  }
  useEffect(() => { fetchData() }, [])

  const handleCreate = async () => {
    if (!form.name || !form.symbols) return
    const symbols = form.symbols.split(/[,，\s]+/).filter((s: string) => s.trim())
    await fetch(API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, symbols, filters: form.filters }),
    })
    setCreateOpen(false)
    setForm({ name: '', symbols: '', filters: [] })
    fetchData()
  }

  const handleDelete = async (id: string) => {
    await fetch(`${API}/${id}`, { method: 'DELETE' })
    fetchData()
  }

  if (loading) return <div className="loading-text"><div className="inline-block w-5 h-5 border-2 border-[#1e2d3d] border-t-primary rounded-full animate-spin mr-2 align-middle" />加载中...</div>

  return (
    <div className="page-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">股票池管理</h1>
          <p className="text-sm text-muted mt-1">管理自选股票组合，支持ST/停牌过滤</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>+ 创建股票池</Button>
      </div>
      {universes.length === 0 ? (
        <div className="stat-card text-center py-12">
          <div className="text-3xl mb-3">🎯</div>
          <div className="text-lg font-medium mb-1">暂无股票池</div>
          <div className="text-sm text-muted">点击「创建股票池」开始管理</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {universes.map(u => (
            <Card key={u.id} className="hover:border-primary/50 transition-colors group">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="truncate mr-2">{u.name}</span>
                  <Button variant="ghost" size="sm" className="text-muted h-5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(u.id)}>删除</Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-2">{u.description || '无描述'}</p>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant="secondary">{u.symbols.length} 只</Badge>
                  {u.filters.map(f => <Badge key={f} variant="warning">{f === 'exclude_st' ? '排除ST' : '排除停牌'}</Badge>)}
                </div>
                <div className="text-xs text-muted-foreground truncate">{u.symbols.slice(0, 6).join(', ')}{u.symbols.length > 6 ? '...' : ''}</div>
                <div className="text-xs text-dim mt-2">{u.created_at?.slice(0, 10)}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogHeader><DialogTitle>创建股票池</DialogTitle></DialogHeader>
        <DialogContent>
          <div><label className="text-sm text-muted-foreground">名称</label>
            <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="mt-1" placeholder="如: 沪深300成分股" /></div>
          <div><label className="text-sm text-muted-foreground">股票代码 (逗号分隔)</label>
            <Input value={form.symbols} onChange={e => setForm({...form, symbols: e.target.value})} className="mt-1" placeholder="sh600519,sz000001,sh601318" /></div>
          <div><label className="text-sm text-muted-foreground">过滤规则</label>
            <div className="flex gap-4 mt-1">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.filters.includes('exclude_st')}
                  onChange={e => setForm({...form, filters: e.target.checked ? [...form.filters, 'exclude_st'] : form.filters.filter(f => f !== 'exclude_st')})}
                  className="w-4 h-4 rounded border-[#1e2d3d] bg-[#0a0e17] text-primary focus:ring-primary" />排除ST</label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.filters.includes('exclude_suspended')}
                  onChange={e => setForm({...form, filters: e.target.checked ? [...form.filters, 'exclude_suspended'] : form.filters.filter(f => f !== 'exclude_suspended')})}
                  className="w-4 h-4 rounded border-[#1e2d3d] bg-[#0a0e17] text-primary focus:ring-primary" />排除停牌</label>
            </div></div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
          <Button onClick={handleCreate}>创建</Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}

export default Universes
