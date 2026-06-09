import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '../components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
const Backtests = () => {
    const [backtests, setBacktests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedBt, setSelectedBt] = useState(null);
    const [running, setRunning] = useState(false);
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
    });
    const fetchData = async () => {
        const res = await fetch('/api/backtests');
        setBacktests(await res.json());
        setLoading(false);
    };
    useEffect(() => { fetchData(); }, []);
    const handleRun = async () => {
        if (!form.name)
            return;
        setRunning(true);
        await fetch('/api/backtests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        });
        setCreateOpen(false);
        setRunning(false);
        fetchData();
    };
    const openDetail = (bt) => {
        setSelectedBt(bt);
        setDetailOpen(true);
    };
    const handleDelete = async (id) => {
        await fetch(`/api/backtests/${id}`, { method: 'DELETE' });
        fetchData();
    };
    const fmtMoney = (v) => `¥${v.toLocaleString()}`;
    const statusBadge = (s) => {
        const m = { completed: 'success', running: 'warning', failed: 'destructive' };
        return _jsx(Badge, { variant: m[s] || 'secondary', children: s });
    };
    if (loading)
        return _jsxs("div", { className: "loading-text", children: [_jsx("div", { className: "inline-block w-5 h-5 border-2 border-[#1e2d3d] border-t-primary rounded-full animate-spin mr-2 align-middle" }), "\u52A0\u8F7D\u4E2D..."] });
    return (_jsxs("div", { className: "page-enter", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-semibold", children: "\u56DE\u6D4B\u4EFB\u52A1" }), _jsx("p", { className: "text-sm text-muted mt-1", children: "\u7EC4\u5408\u7EA7/\u4FE1\u53F7\u7EA7/\u4E8B\u4EF6\u7EA7\u56DE\u6D4B\uFF0C\u652F\u6301\u65E5/\u5468/\u6708\u9891\u7387" })] }), _jsx(Button, { onClick: () => setCreateOpen(true), children: "+ \u65B0\u5EFA\u56DE\u6D4B" })] }), backtests.length === 0 ? (_jsxs("div", { className: "stat-card text-center py-12", children: [_jsx("div", { className: "text-3xl mb-3", children: "\uD83D\uDCCA" }), _jsx("div", { className: "text-lg font-medium mb-1", children: "\u6682\u65E0\u56DE\u6D4B\u4EFB\u52A1" }), _jsx("div", { className: "text-sm text-muted", children: "\u70B9\u51FB\u300C\u65B0\u5EFA\u56DE\u6D4B\u300D\u5F00\u59CB" })] })) : (_jsx("div", { className: "section-card", children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "\u540D\u79F0" }), _jsx(TableHead, { children: "\u7C7B\u578B" }), _jsx(TableHead, { children: "\u72B6\u6001" }), _jsx(TableHead, { className: "text-right", children: "\u521D\u59CB\u8D44\u91D1" }), _jsx(TableHead, { className: "text-right", children: "\u6700\u7EC8\u8D44\u91D1" }), _jsx(TableHead, { className: "text-right", children: "\u6536\u76CA" }), _jsx(TableHead, { className: "text-right", children: "\u590F\u666E" }), _jsx(TableHead, { children: "\u521B\u5EFA\u65F6\u95F4" }), _jsx(TableHead, { children: "\u64CD\u4F5C" })] }) }), _jsx(TableBody, { children: backtests.map(bt => (_jsxs(TableRow, { className: "hover:bg-white/[0.02]", children: [_jsx(TableCell, { className: "font-medium", children: bt.name }), _jsx(TableCell, { children: _jsx(Badge, { variant: "secondary", children: bt.backtest_type === 'portfolio' ? '组合' : bt.backtest_type === 'signal' ? '信号' : '事件' }) }), _jsx(TableCell, { children: statusBadge(bt.status) }), _jsx(TableCell, { className: "text-right font-mono text-xs", children: fmtMoney(bt.initial_capital) }), _jsx(TableCell, { className: "text-right font-mono text-xs", children: bt.final_capital > 0 ? fmtMoney(bt.final_capital) : '--' }), _jsx(TableCell, { className: `text-right font-mono text-xs ${bt.metrics?.total_return > 0 ? 'text-bullish' : bt.metrics?.total_return < 0 ? 'text-bearish' : 'text-muted-foreground'}`, children: bt.metrics?.total_return != null ? `${bt.metrics.total_return > 0 ? '+' : ''}${bt.metrics.total_return}%` : '--' }), _jsx(TableCell, { className: "text-right font-mono text-xs", children: bt.metrics?.sharpe_ratio ?? '--' }), _jsx(TableCell, { className: "text-muted-foreground text-xs", children: bt.created_at?.slice(0, 19) }), _jsx(TableCell, { children: _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "ghost", size: "sm", className: "h-6 text-xs", onClick: () => openDetail(bt), children: "\u8BE6\u60C5" }), _jsx(Button, { variant: "ghost", size: "sm", className: "h-6 text-xs text-red-400", onClick: () => handleDelete(bt.id), children: "\u5220\u9664" })] }) })] }, bt.id))) })] }) })), _jsxs(Dialog, { open: createOpen, onOpenChange: setCreateOpen, children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "\u65B0\u5EFA\u56DE\u6D4B" }) }), _jsx(DialogContent, { children: _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "col-span-2", children: [_jsx("label", { className: "text-sm text-muted-foreground", children: "\u540D\u79F0" }), _jsx(Input, { value: form.name, onChange: e => setForm({ ...form, name: e.target.value }), className: "mt-1", placeholder: "\u7EC4\u5408\u7EA7\u6D4B\u8BD5" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-muted-foreground", children: "\u56DE\u6D4B\u7C7B\u578B" }), _jsxs("select", { value: form.backtest_type, onChange: e => setForm({ ...form, backtest_type: e.target.value }), className: "mt-1 w-full h-10 rounded-md border border-[#1e2d3d] bg-[#0a0e17] px-3 text-sm text-foreground", children: [_jsx("option", { value: "portfolio", children: "\u7EC4\u5408\u7EA7" }), _jsx("option", { value: "signal", children: "\u4FE1\u53F7\u7EA7" }), _jsx("option", { value: "event", children: "\u4E8B\u4EF6\u7EA7" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-muted-foreground", children: "\u8C03\u4ED3\u9891\u7387" }), _jsxs("select", { value: form.rebalance_freq, onChange: e => setForm({ ...form, rebalance_freq: e.target.value }), className: "mt-1 w-full h-10 rounded-md border border-[#1e2d3d] bg-[#0a0e17] px-3 text-sm text-foreground", children: [_jsx("option", { value: "daily", children: "\u6BCF\u65E5" }), _jsx("option", { value: "weekly", children: "\u6BCF\u5468" }), _jsx("option", { value: "monthly", children: "\u6BCF\u6708" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-muted-foreground", children: "\u8D77\u59CB\u65E5\u671F" }), _jsx(Input, { type: "date", value: form.start_date, onChange: e => setForm({ ...form, start_date: e.target.value }), className: "mt-1" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-muted-foreground", children: "\u7ED3\u675F\u65E5\u671F" }), _jsx(Input, { type: "date", value: form.end_date, onChange: e => setForm({ ...form, end_date: e.target.value }), className: "mt-1" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-muted-foreground", children: "\u6301\u4ED3\u6570\u91CF (Top N)" }), _jsx(Input, { type: "number", value: form.top_n, onChange: e => setForm({ ...form, top_n: parseInt(e.target.value) || 10 }), className: "mt-1" })] })] }) }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setCreateOpen(false), children: "\u53D6\u6D88" }), _jsx(Button, { onClick: handleRun, disabled: running, children: running ? _jsxs(_Fragment, { children: [_jsx("span", { className: "inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" }), "\u8FD0\u884C\u4E2D..."] }) : '▶ 运行回测' })] })] }), _jsxs(Dialog, { open: detailOpen, onOpenChange: setDetailOpen, children: [_jsx(DialogHeader, { children: _jsxs(DialogTitle, { children: [selectedBt?.name, " \u2014 \u56DE\u6D4B\u8BE6\u60C5"] }) }), _jsx(DialogContent, { className: "max-w-4xl max-h-[80vh]", children: selectedBt && (_jsxs("div", { children: [_jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3 mb-4", children: [['最终资金', fmtMoney(selectedBt.final_capital || selectedBt.initial_capital)],
                                        ['累计收益', `${selectedBt.metrics?.total_return ?? 0}%`],
                                        ['年化收益', `${selectedBt.metrics?.annual_return ?? 0}%`],
                                        ['夏普比率', `${selectedBt.metrics?.sharpe_ratio ?? '--'}`],
                                        ['最大回撤', `${selectedBt.metrics?.max_drawdown ?? 0}%`],
                                        ['胜率', `${selectedBt.metrics?.win_rate ?? 0}%`],
                                        ['盈亏比', `${selectedBt.metrics?.profit_factor ?? '--'}`],
                                        ['交易次数', `${selectedBt.metrics?.n_trades ?? 0}`]].map(([l, v]) => (_jsxs("div", { className: "text-center p-3 bg-[#0a0e17] rounded-lg border border-[#1e2d3d]", children: [_jsx("div", { className: "text-sm font-bold text-primary", children: v }), _jsx("div", { className: "text-xs text-muted", children: l })] }, l))) }), selectedBt.equity_curve && selectedBt.equity_curve.length > 1 && (_jsxs("div", { className: "mb-4 p-3 bg-[#0a0e17] rounded-lg border border-[#1e2d3d]", children: [_jsx("div", { className: "text-sm font-medium mb-2", children: "\u51C0\u503C\u66F2\u7EBF" }), _jsx("div", { className: "h-32 flex items-end gap-px overflow-hidden", children: selectedBt.equity_curve.slice(-120).map((p, i, arr) => {
                                                const min = Math.min(...arr.map(e => e.value));
                                                const max = Math.max(...arr.map(e => e.value));
                                                const h = max !== min ? ((p.value - min) / (max - min)) * 100 : 50;
                                                return _jsx("div", { className: "flex-1 bg-primary/60 rounded-t", style: { height: `${h}%` } }, i);
                                            }) })] })), selectedBt.drawdown_curve && selectedBt.drawdown_curve.length > 1 && (_jsxs("div", { className: "mb-4 p-3 bg-[#0a0e17] rounded-lg border border-[#1e2d3d]", children: [_jsx("div", { className: "text-sm font-medium mb-2", children: "\u56DE\u64A4\u66F2\u7EBF" }), _jsx("div", { className: "h-20 flex items-start gap-px overflow-hidden", children: selectedBt.drawdown_curve.slice(-120).map((p, i) => (_jsx("div", { className: "flex-1 bg-red-500/40 rounded-b", style: { height: `${Math.min(p.dd, 50) * 2}%` } }, i))) })] })), selectedBt.trades && selectedBt.trades.length > 0 && (_jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium mb-2", children: "\u4EA4\u6613\u660E\u7EC6 (\u6700\u8FD120\u7B14)" }), _jsx("div", { className: "max-h-40 overflow-auto", children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "\u65E5\u671F" }), _jsx(TableHead, { children: "\u4EE3\u7801" }), _jsx(TableHead, { children: "\u65B9\u5411" }), _jsx(TableHead, { className: "text-right", children: "\u4EF7\u683C" }), _jsx(TableHead, { className: "text-right", children: "\u6570\u91CF" }), _jsx(TableHead, { className: "text-right", children: "\u76C8\u4E8F" })] }) }), _jsx(TableBody, { children: selectedBt.trades.slice(-20).reverse().map((t, i) => (_jsxs(TableRow, { children: [_jsx(TableCell, { className: "text-xs font-mono", children: t.date }), _jsx(TableCell, { className: "text-xs", children: t.symbol }), _jsx(TableCell, { children: _jsx(Badge, { variant: t.action === 'buy' ? 'default' : 'secondary', children: t.action === 'buy' ? '买入' : '卖出' }) }), _jsx(TableCell, { className: "text-right font-mono text-xs", children: t.price?.toFixed(2) }), _jsx(TableCell, { className: "text-right font-mono text-xs", children: t.shares }), _jsx(TableCell, { className: `text-right font-mono text-xs ${t.pnl > 0 ? 'text-bullish' : t.pnl < 0 ? 'text-bearish' : 'text-muted-foreground'}`, children: t.pnl ? `${t.pnl > 0 ? '+' : ''}${t.pnl.toFixed(2)}` : '--' })] }, i))) })] }) })] })), selectedBt.error_message && (_jsxs("div", { className: "mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm", children: ["\u26A0\uFE0F ", selectedBt.error_message] }))] })) })] })] }));
};
export default Backtests;
