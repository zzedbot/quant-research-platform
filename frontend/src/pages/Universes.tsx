import React, { useEffect, useState } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '../components/ui/dialog'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'

interface Universe { id: string; name: string; description: string; symbols: string[]; filters: string[]; created_at: string }
interface StockInfo { symbol: string; name: string; price: number; change_pct: number; amount: number }
const API = '/api/universes'

const Universes: React.FC = () => {
  const [universes, setUniverses] = useState<Universe[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedUniverse, setSelectedUniverse] = useState<Universe | null>(null)
  const [stockInfos, setStockInfos] = useState<StockInfo[]>([])
  const [stocksLoading, setStocksLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [form, setForm] = useState({ name: '', symbols: '', filters: [] as string[] })

  const fetchData = async () => {
    const res = await fetch(API)
    setUniverses(await res.json())
    setLoading(false)
  }
  useEffect(() => { fetchData() }, [])

  const openDetail = async (u: Universe) => {
    setSelectedUniverse(u)
    setDetailOpen(true)
    setStocksLoading(true)
    setSearchTerm('')
    try {
      // Fetch real-time data for all stocks in this universe
      const batchSize = 30
      const allInfos: StockInfo[] = []
      const symbols = u.symbols.filter(s => s.match(/^(sh|sz|hk)/))

      for (let i = 0; i < symbols.length; i += batchSize) {
        const batch = symbols.slice(i, i + batchSize)
        const isHK = batch.some(s => s.startsWith('hk'))
        const url = isHK ? `/api/hk-spot?codes=${batch.join(',')}` : `/api/a-spot?symbols=${batch.join(',')}`

        try {
          const res = await fetch(url)
          if (res.ok) {
            const data = await res.json()
            allInfos.push(...data)
          }
        } catch {
          // Fallback: create placeholder
          batch.forEach(s => allInfos.push({ symbol: s, name: s, price: 0, change_pct: 0, amount: 0 }))
        }
      }

      // For symbols without real-time data
      const noDataSymbols = u.symbols.filter(s => !allInfos.find(i => i.symbol === s))
      noDataSymbols.forEach(s => allInfos.push({ symbol: s, name: s, price: 0, change_pct: 0, amount: 0 }))

      setStockInfos(allInfos)
    } catch {
      // Fallback: just show symbol codes
      setStockInfos(u.symbols.map(s => ({ symbol: s, name: s, price: 0, change_pct: 0, amount: 0 })))
    }
    setStocksLoading(false)
  }

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

  const filteredStocks = stockInfos.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const pctColor = (v: number) => v >= 0 ? 'text-bullish' : 'text-bearish'
  const fmtAmount = (v: number) => {
    if (v >= 1e8) return `${(v / 1e8).toFixed(2)}亿`
    if (v >= 1e4) return `${(v / 1e4).toFixed(1)}万`
    return v.toFixed(0)
  }

  if (loading) return <div className="loading-text"><div className="inline-block w-5 h-5 border-2 border-[#1e2d3d] border-t-primary rounded-full animate-spin mr-2 align-middle" />加载中...</div>

  return (
    <div className="page-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">股票池管理</h1>
          <p className="text-sm text-muted mt-1">管理自选股票组合，点击卡片查看成分股实时行情</p>
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
            <Card key={u.id} className="hover:border-primary/50 transition-colors group cursor-pointer" onClick={() => openDetail(u)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="truncate mr-2">{u.name}</span>
                  <Button variant="ghost" size="sm" className="text-muted h-5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); handleDelete(u.id) }}>删除</Button>
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

      {/* Stock Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogHeader>
          <DialogTitle>{selectedUniverse?.name} — 成分股行情</DialogTitle>
        </DialogHeader>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          {selectedUniverse && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="secondary">{selectedUniverse.symbols.length} 只</Badge>
                {stocksLoading && <span className="text-xs text-muted">加载中...</span>}
                {!stocksLoading && (
                  <>
                    <span className="text-xs text-muted">
                      涨 {stockInfos.filter(s => s.change_pct > 0).length} / 跌 {stockInfos.filter(s => s.change_pct < 0).length} / 平 {stockInfos.filter(s => s.change_pct === 0).length}
                    </span>
                    <Input placeholder="搜索名称或代码..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="max-w-xs ml-auto" />
                  </>
                )}
              </div>

              {stocksLoading ? (
                <div className="text-center py-12 text-muted">
                  <div className="inline-block w-6 h-6 border-2 border-[#1e2d3d] border-t-primary rounded-full animate-spin mr-2 align-middle" />
                  正在获取实时行情...
                </div>
              ) : (
                <div className="max-h-[55vh] overflow-auto">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>名称</TableHead>
                      <TableHead>代码</TableHead>
                      <TableHead className="text-right">最新价</TableHead>
                      <TableHead className="text-right">涨跌幅</TableHead>
                      <TableHead className="text-right">成交额</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {filteredStocks.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center text-muted py-8">无匹配结果</TableCell></TableRow>
                      ) : (
                        filteredStocks.map((s, i) => (
                          <TableRow key={s.symbol} className="hover:bg-white/[0.02]">
                            <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                            <TableCell className="font-medium">{s.name}</TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">{s.symbol}</TableCell>
                            <TableCell className="text-right font-mono">{s.price > 0 ? s.price.toFixed(2) : '--'}</TableCell>
                            <TableCell className={`text-right font-mono ${pctColor(s.change_pct)}`}>
                              {s.price > 0 ? `${s.change_pct >= 0 ? '+' : ''}${s.change_pct.toFixed(2)}%` : '--'}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs text-muted-foreground">
                              {s.amount > 0 ? fmtAmount(s.amount) : '--'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
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
