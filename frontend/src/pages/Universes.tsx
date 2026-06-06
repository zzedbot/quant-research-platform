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

  if (loading) return <div className="p-8 text-center text-[#64748b]">加载中...</div>

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">股票池管理</h1>
        <Button onClick={() => setCreateOpen(true)}>+ 创建股票池</Button>
      </div>
      {universes.length === 0 ? (
        <div className="text-center text-[#64748b] py-12">暂无股票池，请点击创建</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {universes.map(u => (
            <Card key={u.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  {u.name}
                  <Button variant="ghost" size="sm" className="text-[#64748b] h-6" onClick={() => handleDelete(u.id)}>删除</Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#94a3b8] mb-2">{u.description || '无描述'}</p>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">{u.symbols.length} 只</Badge>
                  {u.filters.map(f => <Badge key={f} variant="warning">{f}</Badge>)}
                </div>
                <div className="text-xs text-[#64748b]">{u.symbols.slice(0, 6).join(', ')}{u.symbols.length > 6 ? '...' : ''}</div>
                <div className="text-xs text-[#475569] mt-2">{u.created_at?.slice(0, 19)}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogHeader><DialogTitle>创建股票池</DialogTitle></DialogHeader>
        <DialogContent>
          <div><label className="text-sm text-[#94a3b8]">名称</label>
            <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="mt-1" placeholder="如: 沪深300成分股" /></div>
          <div><label className="text-sm text-[#94a3b8]">股票代码 (逗号分隔)</label>
            <Input value={form.symbols} onChange={e => setForm({...form, symbols: e.target.value})} className="mt-1" placeholder="sh600519,sz000001,sh601318" /></div>
          <div><label className="text-sm text-[#94a3b8]">过滤规则</label>
            <div className="flex gap-4 mt-1">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.filters.includes('exclude_st')}
                  onChange={e => setForm({...form, filters: e.target.checked ? [...form.filters, 'exclude_st'] : form.filters.filter(f => f !== 'exclude_st')})} />排除ST</label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.filters.includes('exclude_suspended')}
                  onChange={e => setForm({...form, filters: e.target.checked ? [...form.filters, 'exclude_suspended'] : form.filters.filter(f => f !== 'exclude_suspended')})} />排除停牌</label>
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
