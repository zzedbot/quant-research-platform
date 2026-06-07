import React, { useEffect, useState } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'

interface Factor { name: string; description: string; category: string }

const Features: React.FC = () => {
  const [factors, setFactors] = useState<Factor[]>([])
  const [loading, setLoading] = useState(true)
  const [computing, setComputing] = useState(false)
  const [selectedFactor, setSelectedFactor] = useState('')
  const [symbols, setSymbols] = useState('sh600519,sz000001,sh601318,sz002594,sh600036,sz000858')
  const [startDate, setStartDate] = useState('2026-01-01')
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    fetch('/api/features/factors').then(r => r.json()).then(d => { setFactors(d); setLoading(false) })
  }, [])

  const handleCompute = async () => {
    if (!selectedFactor || !symbols) return
    setComputing(true)
    const res = await fetch('/api/features/calculate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ factor_name: selectedFactor, symbols: symbols.split(/[,，\s]+/).filter((s: string) => s), market: 'CN', start_date: startDate }),
    })
    setResult(await res.json())
    setComputing(false)
  }

  if (loading) return <div className="loading-text"><div className="inline-block w-5 h-5 border-2 border-[#1e2d3d] border-t-primary rounded-full animate-spin mr-2 align-middle" />加载中...</div>
  const categories = [...new Set(factors.map(f => f.category))]

  return (
    <div className="page-enter">
      <h1 className="text-xl font-semibold mb-1">因子与指标库</h1>
      <p className="text-sm text-muted mb-6">29个内置因子，涵盖技术/估值/质量/成长/动量/波动率/流动性</p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Factor List */}
        <div>
          <Tabs defaultValue={categories[0]}>
            <TabsList className="w-full flex-wrap mb-3">
              {categories.map(c => <TabsTrigger key={c} value={c} className="text-xs">{c}</TabsTrigger>)}
            </TabsList>
            {categories.map(c => (
              <TabsContent key={c} value={c}>
                <div className="space-y-1.5">
                  {factors.filter(f => f.category === c).map(f => (
                    <div key={f.name}
                      className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                        selectedFactor === f.name
                          ? 'border-primary bg-primary/10 shadow-sm'
                          : 'border-border hover:bg-white/[0.02]'
                      }`}
                      onClick={() => setSelectedFactor(f.name)}>
                      <div className="font-medium text-sm">{f.name}</div>
                      <div className="text-xs text-muted">{f.description}</div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Compute Form + Results */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>🧮 运行因子计算</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm text-muted-foreground">因子</label>
                  <div className="mt-1 h-10 rounded-md border border-[#1e2d3d] bg-[#0a0e17] px-3 flex items-center text-sm text-primary">
                    {selectedFactor || <span className="text-muted">未选择</span>}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">股票代码</label>
                  <Input value={symbols} onChange={e => setSymbols(e.target.value)} className="mt-1" placeholder="sh600519,sz000001" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">起始日期</label>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1" />
                </div>
              </div>
              <Button onClick={handleCompute} disabled={computing || !selectedFactor}>
                {computing ? <><span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />计算中...</> : '▶ 运行计算'}
              </Button>
            </CardContent>
          </Card>

          {result && !result.error && (
            <Card className="mt-4">
              <CardHeader><CardTitle>📊 分析结果</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {[['IC 均值', result.ic_statistics?.ic_mean?.toFixed(4)],
                    ['ICIR', result.ic_statistics?.icir?.toFixed(4)],
                    ['IC正比例', `${(result.ic_statistics?.ic_positive_pct || 0) * 100 | 0}%`],
                    ['覆盖率', `${(result.distribution?.coverage || 0) * 100 | 0}%`]].map(([l, v]) => (
                    <div key={l} className="text-center p-3 bg-[#0a0e17] rounded-lg border border-[#1e2d3d]">
                      <div className="text-lg font-bold text-primary">{v}</div>
                      <div className="text-xs text-muted">{l}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-[#0a0e17] rounded-lg border border-[#1e2d3d]">
                    <div className="text-sm font-medium mb-2">分布统计</div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex justify-between"><span>均值</span><span className="font-mono">{result.distribution?.mean?.toFixed(4)}</span></div>
                      <div className="flex justify-between"><span>标准差</span><span className="font-mono">{result.distribution?.std?.toFixed(4)}</span></div>
                      <div className="flex justify-between"><span>偏度</span><span className="font-mono">{result.distribution?.skew?.toFixed(4)}</span></div>
                      <div className="flex justify-between"><span>缺失率</span><span className="font-mono">{(result.distribution?.missing_rate || 0) * 100 | 0}%</span></div>
                    </div>
                  </div>
                  <div className="p-3 bg-[#0a0e17] rounded-lg border border-[#1e2d3d]">
                    <div className="text-sm font-medium mb-2">分位价差</div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex justify-between"><span>日度价差</span><span className="font-mono">{result.quantile_spread?.spread?.toFixed(6)}</span></div>
                      <div className="flex justify-between"><span>年化价差</span><span className="font-mono">{result.quantile_spread?.annualized_spread?.toFixed(4)}</span></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {result?.error && <Card className="mt-4 border-red-500/30"><CardContent className="pt-4 text-red-400 text-sm">⚠️ {result.error}</CardContent></Card>}
        </div>
      </div>
    </div>
  )
}

export default Features
