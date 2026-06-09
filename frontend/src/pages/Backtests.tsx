import React, { useEffect, useState } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '../components/ui/dialog'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'

interface Backtest {
  id: string
  name: string
  backtest_type: string
  status: string
  start_date: string
  end_date: string
  initial_capital: number
  final_capital: number
  benchmark: string
  metrics: any
  equity_curve: any[]
  drawdown_curve: any[]
  trades: any[]
  error_message: string
  created_at: string
}

const Backtests: React.FC = () => {
  const [backtests, setBacktests] = useState<Backtest[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedBt, setSelectedBt] = useState<Backtest | null>(null)
  const [running, setRunning] = useState(false)
  const [form, setForm] = useState({
    name: '',
    backtest_type: 'portfolio',
    start_date: '2024-06-01',
    end_date: '2026-06-06',
    initial_capital: 100000,
    top_n: 3,
    rebalance_freq: 'weekly',
    entry_signal: 'golden_cross',
    exit_signal: 'death_cross',
  })

  const fetchData = async () => {
    const res = await fetch('/api/backtests')
    setBacktests(await res.json())
    setLoading(false)
  }
  useEffect(() => { fetchData() }, [])

  const handleRun = async () => {
    if (!form.name) return
    setRunning(true)
    await fetch('/api/backtests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setCreateOpen(false)
    setRunning(false)
    fetchData()
  }

  const openDetail = (bt: Backtest) => {
    setSelectedBt(bt)
    setDetailOpen(true)
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/backtests/${id}`, { method: 'DELETE' })
    fetchData()
  }

  const fmtMoney = (v: number) => `¥${v.toLocaleString()}`
  const statusBadge = (s: string) => {
    const m: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = { completed: 'success', running: 'warning', failed: 'destructive' }
    return <Badge variant={m[s] || 'secondary'}>{s}</Badge>
  }

  if (loading) return <div className="loading-text"><div className="inline-block w-5 h-5 border-2 border-[#1e2d3d] border-t-primary rounded-full animate-spin mr-2 align-middle" />加载中...</div>

  return (
    <div className="page-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">回测任务</h1>
          <p className="text-sm text-muted mt-1">组合级/信号级/事件级回测，支持日/周/月频率</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>+ 新建回测</Button>
      </div>

      {backtests.length === 0 ? (
        <div className="stat-card text-center py-12">
          <div className="text-3xl mb-3">📊</div>
          <div className="text-lg font-medium mb-1">暂无回测任务</div>
          <div className="text-sm text-muted">点击「新建回测」开始</div>
        </div>
      ) : (
        <div className="section-card">
          <Table>
            <TableHeader><TableRow>
              <TableHead>名称</TableHead><TableHead>类型</TableHead><TableHead>状态</TableHead>
              <TableHead className="text-right">初始资金</TableHead><TableHead className="text-right">最终资金</TableHead>
              <TableHead className="text-right">收益</TableHead><TableHead className="text-right">夏普</TableHead>
              <TableHead>创建时间</TableHead><TableHead>操作</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {backtests.map(bt => (
                <TableRow key={bt.id} className="hover:bg-white/[0.02]">
                  <TableCell className="font-medium">{bt.name}</TableCell>
                  <TableCell><Badge variant="secondary">{bt.backtest_type === 'portfolio' ? '组合' : bt.backtest_type === 'signal' ? '信号' : '事件'}</Badge></TableCell>
                  <TableCell>{statusBadge(bt.status)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{fmtMoney(bt.initial_capital)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{bt.final_capital > 0 ? fmtMoney(bt.final_capital) : '--'}</TableCell>
                  <TableCell className={`text-right font-mono text-xs ${bt.metrics?.total_return > 0 ? 'text-bullish' : bt.metrics?.total_return < 0 ? 'text-bearish' : 'text-muted-foreground'}`}>
                    {bt.metrics?.total_return != null ? `${bt.metrics.total_return > 0 ? '+' : ''}${bt.metrics.total_return}%` : '--'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">{bt.metrics?.sharpe_ratio ?? '--'}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{bt.created_at?.slice(0, 19)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => openDetail(bt)}>详情</Button>
                      <Button variant="ghost" size="sm" className="h-6 text-xs text-red-400" onClick={() => handleDelete(bt.id)}>删除</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogHeader><DialogTitle>新建回测</DialogTitle></DialogHeader>
        <DialogContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="text-sm text-muted-foreground">名称</label>
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="mt-1" placeholder="组合级测试" /></div>
            <div><label className="text-sm text-muted-foreground">回测类型</label>
              <select value={form.backtest_type} onChange={e => setForm({...form, backtest_type: e.target.value})}
                className="mt-1 w-full h-10 rounded-md border border-[#1e2d3d] bg-[#0a0e17] px-3 text-sm text-foreground">
                <option value="portfolio">组合级</option><option value="signal">信号级</option><option value="event">事件级</option>
              </select></div>
            <div><label className="text-sm text-muted-foreground">调仓频率</label>
              <select value={form.rebalance_freq} onChange={e => setForm({...form, rebalance_freq: e.target.value})}
                className="mt-1 w-full h-10 rounded-md border border-[#1e2d3d] bg-[#0a0e17] px-3 text-sm text-foreground">
                <option value="daily">每日</option><option value="weekly">每周</option><option value="monthly">每月</option>
              </select></div>
            <div><label className="text-sm text-muted-foreground">起始日期</label>
              <Input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className="mt-1" /></div>
            <div><label className="text-sm text-muted-foreground">结束日期</label>
              <Input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className="mt-1" /></div>
            <div><label className="text-sm text-muted-foreground">持仓数量 (Top N)</label>
              <Input type="number" value={form.top_n} onChange={e => setForm({...form, top_n: parseInt(e.target.value) || 10})} className="mt-1" /></div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
          <Button onClick={handleRun} disabled={running}>
            {running ? <><span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />运行中...</> : '▶ 运行回测'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogHeader><DialogTitle>{selectedBt?.name} — 回测详情</DialogTitle></DialogHeader>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          {selectedBt && (
            <div>
              {/* Metrics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[['最终资金', fmtMoney(selectedBt.final_capital || selectedBt.initial_capital)],
                  ['累计收益', `${selectedBt.metrics?.total_return ?? 0}%`],
                  ['年化收益', `${selectedBt.metrics?.annual_return ?? 0}%`],
                  ['夏普比率', `${selectedBt.metrics?.sharpe_ratio ?? '--'}`],
                  ['最大回撤', `${selectedBt.metrics?.max_drawdown ?? 0}%`],
                  ['胜率', `${selectedBt.metrics?.win_rate ?? 0}%`],
                  ['盈亏比', `${selectedBt.metrics?.profit_factor ?? '--'}`],
                  ['交易次数', `${selectedBt.metrics?.n_trades ?? 0}`]].map(([l, v]) => (
                  <div key={l} className="text-center p-3 bg-[#0a0e17] rounded-lg border border-[#1e2d3d]">
                    <div className="text-sm font-bold text-primary">{v}</div>
                    <div className="text-xs text-muted">{l}</div>
                  </div>
                ))}
              </div>

              {/* Equity Curve (simple bar chart) */}
              {selectedBt.equity_curve && selectedBt.equity_curve.length > 1 && (
                <div className="mb-4 p-3 bg-[#0a0e17] rounded-lg border border-[#1e2d3d]">
                  <div className="text-sm font-medium mb-2">净值曲线</div>
                  <div className="h-32 flex items-end gap-px overflow-hidden">
                    {selectedBt.equity_curve.slice(-120).map((p, i, arr) => {
                      const min = Math.min(...arr.map(e => e.value))
                      const max = Math.max(...arr.map(e => e.value))
                      const h = max !== min ? ((p.value - min) / (max - min)) * 100 : 50
                      return <div key={i} className="flex-1 bg-primary/60 rounded-t" style={{ height: `${h}%` }} />
                    })}
                  </div>
                </div>
              )}

              {/* Drawdown */}
              {selectedBt.drawdown_curve && selectedBt.drawdown_curve.length > 1 && (
                <div className="mb-4 p-3 bg-[#0a0e17] rounded-lg border border-[#1e2d3d]">
                  <div className="text-sm font-medium mb-2">回撤曲线</div>
                  <div className="h-20 flex items-start gap-px overflow-hidden">
                    {selectedBt.drawdown_curve.slice(-120).map((p, i) => (
                      <div key={i} className="flex-1 bg-red-500/40 rounded-b" style={{ height: `${Math.min(p.dd, 50) * 2}%` }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Trades */}
              {selectedBt.trades && selectedBt.trades.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">交易明细 (最近20笔)</div>
                  <div className="max-h-40 overflow-auto">
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>日期</TableHead><TableHead>代码</TableHead><TableHead>方向</TableHead>
                        <TableHead className="text-right">价格</TableHead><TableHead className="text-right">数量</TableHead>
                        <TableHead className="text-right">盈亏</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {selectedBt.trades.slice(-20).reverse().map((t, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-xs font-mono">{t.date}</TableCell>
                            <TableCell className="text-xs">{t.symbol}</TableCell>
                            <TableCell><Badge variant={t.action === 'buy' ? 'default' : 'secondary'}>{t.action === 'buy' ? '买入' : '卖出'}</Badge></TableCell>
                            <TableCell className="text-right font-mono text-xs">{t.price?.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-mono text-xs">{t.shares}</TableCell>
                            <TableCell className={`text-right font-mono text-xs ${t.pnl > 0 ? 'text-bullish' : t.pnl < 0 ? 'text-bearish' : 'text-muted-foreground'}`}>
                              {t.pnl ? `${t.pnl > 0 ? '+' : ''}${t.pnl.toFixed(2)}` : '--'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {selectedBt.error_message && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  ⚠️ {selectedBt.error_message}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Backtests
