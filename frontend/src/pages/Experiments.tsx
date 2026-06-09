import React, { useEffect, useState } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '../components/ui/dialog'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'

interface Universe { id: string; name: string; symbols: string[] }
interface Experiment { id: string; name: string; description: string; universe_id: string; factors: any[]; portfolio: any; execution: any; status: string; created_at: string }

const Experiments: React.FC = () => {
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [universes, setUniverses] = useState<Universe[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ name: '', universe_id: '', factors: 'ma_20,rsi_14', portfolio: 'equal_weight' })

  const fetchData = async () => {
    const [el, ul] = await Promise.all([
      fetch('/api/experiments').then(r => r.json()),
      fetch('/api/universes').then(r => r.json()),
    ])
    setExperiments(el)
    setUniverses(ul)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleCreate = async () => {
    if (!form.name || !form.universe_id) return
    await fetch('/api/experiments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name, universe_id: form.universe_id,
        factors: form.factors.split(',').map(f => ({ name: f.trim() })),
        portfolio: { method: form.portfolio },
        execution: { rebalance: 'monthly', cost_rate: 0.001, slippage: 0.001 },
      }),
    })
    setCreateOpen(false)
    setForm({ name: '', universe_id: '', factors: 'ma_20,rsi_14', portfolio: 'equal_weight' })
    fetchData()
  }

  const statusColors: Record<string, 'secondary' | 'warning' | 'success' | 'destructive'> = { draft: 'secondary', running: 'warning', completed: 'success', failed: 'destructive' }

  if (loading) return <div className="loading-text"><div className="inline-block w-5 h-5 border-2 border-[#1e2d3d] border-t-primary rounded-full animate-spin mr-2 align-middle" />加载中...</div>

  return (
    <div className="page-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">实验管理</h1>
          <p className="text-sm text-muted mt-1">创建和管理量化研究实验</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>+ 创建实验</Button>
      </div>
      {experiments.length === 0 ? (
        <div className="stat-card text-center py-12">
          <div className="text-3xl mb-3">🧪</div>
          <div className="text-lg font-medium mb-1">暂无实验</div>
          <div className="text-sm text-muted">点击「创建实验」开始研究</div>
        </div>
      ) : (
        <div className="section-card">
          <Table>
            <TableHeader><TableRow>
              <TableHead>名称</TableHead><TableHead>股票池</TableHead><TableHead>因子</TableHead><TableHead>组合</TableHead><TableHead>状态</TableHead><TableHead>创建时间</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {experiments.map(e => {
                const u = universes.find(x => x.id === e.universe_id)
                return (
                  <TableRow key={e.id} className="hover:bg-white/[0.02]">
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell className="text-muted-foreground">{u?.name || e.universe_id}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {e.factors?.map((f: any, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">{f.name}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{e.portfolio?.method || '--'}</TableCell>
                    <TableCell><Badge variant={statusColors[e.status] || 'secondary'}>{e.status}</Badge></TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">{e.created_at?.slice(0, 19)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogHeader><DialogTitle>创建实验</DialogTitle></DialogHeader>
        <DialogContent>
          <div><label className="text-sm text-muted-foreground">名称</label>
            <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="mt-1" placeholder="cn_momentum_top50" /></div>
          <div><label className="text-sm text-muted-foreground">选择股票池</label>
            <select value={form.universe_id} onChange={e => setForm({...form, universe_id: e.target.value})}
              className="mt-1 w-full h-10 rounded-md border border-[#1e2d3d] bg-[#0a0e17] px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">-- 选择 --</option>
              {universes.map(u => <option key={u.id} value={u.id}>{u.name} ({u.symbols?.length || 0}只)</option>)}
            </select></div>
          <div><label className="text-sm text-muted-foreground">因子 (逗号分隔)</label>
            <Input value={form.factors} onChange={e => setForm({...form, factors: e.target.value})} className="mt-1" placeholder="ma_20,rsi_14,macd_12_26_9" /></div>
          <div><label className="text-sm text-muted-foreground">组合方法</label>
            <select value={form.portfolio} onChange={e => setForm({...form, portfolio: e.target.value})}
              className="mt-1 w-full h-10 rounded-md border border-[#1e2d3d] bg-[#0a0e17] px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="equal_weight">等权</option><option value="market_cap">市值加权</option><option value="top_n">Top N</option>
            </select></div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
          <Button onClick={handleCreate}>创建</Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}

export default Experiments
