import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '../components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
const API = '/api/universes';
const Universes = () => {
    const [universes, setUniverses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedUniverse, setSelectedUniverse] = useState(null);
    const [stockInfos, setStockInfos] = useState([]);
    const [stocksLoading, setStocksLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [form, setForm] = useState({ name: '', symbols: '', filters: [] });
    const fetchData = async () => {
        const res = await fetch(API);
        setUniverses(await res.json());
        setLoading(false);
    };
    useEffect(() => { fetchData(); }, []);
    const openDetail = async (u) => {
        setSelectedUniverse(u);
        setDetailOpen(true);
        setStocksLoading(true);
        setSearchTerm('');
        try {
            // Fetch real-time data for all stocks in this universe
            const batchSize = 30;
            const allInfos = [];
            const symbols = u.symbols.filter(s => s.match(/^(sh|sz|hk)/));
            for (let i = 0; i < symbols.length; i += batchSize) {
                const batch = symbols.slice(i, i + batchSize);
                const isHK = batch.some(s => s.startsWith('hk'));
                const url = isHK ? `/api/hk-spot?codes=${batch.join(',')}` : `/api/a-spot?symbols=${batch.join(',')}`;
                try {
                    const res = await fetch(url);
                    if (res.ok) {
                        const data = await res.json();
                        allInfos.push(...data);
                    }
                }
                catch {
                    // Fallback: create placeholder
                    batch.forEach(s => allInfos.push({ symbol: s, name: s, price: 0, change_pct: 0, amount: 0 }));
                }
            }
            // For symbols without real-time data
            const noDataSymbols = u.symbols.filter(s => !allInfos.find(i => i.symbol === s));
            noDataSymbols.forEach(s => allInfos.push({ symbol: s, name: s, price: 0, change_pct: 0, amount: 0 }));
            setStockInfos(allInfos);
        }
        catch {
            // Fallback: just show symbol codes
            setStockInfos(u.symbols.map(s => ({ symbol: s, name: s, price: 0, change_pct: 0, amount: 0 })));
        }
        setStocksLoading(false);
    };
    const handleCreate = async () => {
        if (!form.name || !form.symbols)
            return;
        const symbols = form.symbols.split(/[,，\s]+/).filter((s) => s.trim());
        await fetch(API, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: form.name, symbols, filters: form.filters }),
        });
        setCreateOpen(false);
        setForm({ name: '', symbols: '', filters: [] });
        fetchData();
    };
    const handleDelete = async (id) => {
        await fetch(`${API}/${id}`, { method: 'DELETE' });
        fetchData();
    };
    const filteredStocks = stockInfos.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.symbol.toLowerCase().includes(searchTerm.toLowerCase()));
    const pctColor = (v) => v >= 0 ? 'text-bullish' : 'text-bearish';
    const fmtAmount = (v) => {
        if (v >= 1e8)
            return `${(v / 1e8).toFixed(2)}亿`;
        if (v >= 1e4)
            return `${(v / 1e4).toFixed(1)}万`;
        return v.toFixed(0);
    };
    if (loading)
        return _jsxs("div", { className: "loading-text", children: [_jsx("div", { className: "inline-block w-5 h-5 border-2 border-[#1e2d3d] border-t-primary rounded-full animate-spin mr-2 align-middle" }), "\u52A0\u8F7D\u4E2D..."] });
    return (_jsxs("div", { className: "page-enter", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-semibold", children: "\u80A1\u7968\u6C60\u7BA1\u7406" }), _jsx("p", { className: "text-sm text-muted mt-1", children: "\u7BA1\u7406\u81EA\u9009\u80A1\u7968\u7EC4\u5408\uFF0C\u70B9\u51FB\u5361\u7247\u67E5\u770B\u6210\u5206\u80A1\u5B9E\u65F6\u884C\u60C5" })] }), _jsx(Button, { onClick: () => setCreateOpen(true), children: "+ \u521B\u5EFA\u80A1\u7968\u6C60" })] }), universes.length === 0 ? (_jsxs("div", { className: "stat-card text-center py-12", children: [_jsx("div", { className: "text-3xl mb-3", children: "\uD83C\uDFAF" }), _jsx("div", { className: "text-lg font-medium mb-1", children: "\u6682\u65E0\u80A1\u7968\u6C60" }), _jsx("div", { className: "text-sm text-muted", children: "\u70B9\u51FB\u300C\u521B\u5EFA\u80A1\u7968\u6C60\u300D\u5F00\u59CB\u7BA1\u7406" })] })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: universes.map(u => (_jsxs(Card, { className: "hover:border-primary/50 transition-colors group cursor-pointer", onClick: () => openDetail(u), children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "text-sm flex items-center justify-between", children: [_jsx("span", { className: "truncate mr-2", children: u.name }), _jsx(Button, { variant: "ghost", size: "sm", className: "text-muted h-5 opacity-0 group-hover:opacity-100 transition-opacity", onClick: (e) => { e.stopPropagation(); handleDelete(u.id); }, children: "\u5220\u9664" })] }) }), _jsxs(CardContent, { children: [_jsx("p", { className: "text-xs text-muted-foreground mb-2", children: u.description || '无描述' }), _jsxs("div", { className: "flex items-center gap-2 mb-2 flex-wrap", children: [_jsxs(Badge, { variant: "secondary", children: [u.symbols.length, " \u53EA"] }), u.filters.map(f => _jsx(Badge, { variant: "warning", children: f === 'exclude_st' ? '排除ST' : '排除停牌' }, f))] }), _jsxs("div", { className: "text-xs text-muted-foreground truncate", children: [u.symbols.slice(0, 6).join(', '), u.symbols.length > 6 ? '...' : ''] }), _jsx("div", { className: "text-xs text-dim mt-2", children: u.created_at?.slice(0, 10) })] })] }, u.id))) })), _jsxs(Dialog, { open: detailOpen, onOpenChange: setDetailOpen, children: [_jsx(DialogHeader, { children: _jsxs(DialogTitle, { children: [selectedUniverse?.name, " \u2014 \u6210\u5206\u80A1\u884C\u60C5"] }) }), _jsx(DialogContent, { className: "max-w-3xl max-h-[80vh]", children: selectedUniverse && (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsxs(Badge, { variant: "secondary", children: [selectedUniverse.symbols.length, " \u53EA"] }), stocksLoading && _jsx("span", { className: "text-xs text-muted", children: "\u52A0\u8F7D\u4E2D..." }), !stocksLoading && (_jsxs(_Fragment, { children: [_jsxs("span", { className: "text-xs text-muted", children: ["\u6DA8 ", stockInfos.filter(s => s.change_pct > 0).length, " / \u8DCC ", stockInfos.filter(s => s.change_pct < 0).length, " / \u5E73 ", stockInfos.filter(s => s.change_pct === 0).length] }), _jsx(Input, { placeholder: "\u641C\u7D22\u540D\u79F0\u6216\u4EE3\u7801...", value: searchTerm, onChange: e => setSearchTerm(e.target.value), className: "max-w-xs ml-auto" })] }))] }), stocksLoading ? (_jsxs("div", { className: "text-center py-12 text-muted", children: [_jsx("div", { className: "inline-block w-6 h-6 border-2 border-[#1e2d3d] border-t-primary rounded-full animate-spin mr-2 align-middle" }), "\u6B63\u5728\u83B7\u53D6\u5B9E\u65F6\u884C\u60C5..."] })) : (_jsx("div", { className: "max-h-[55vh] overflow-auto", children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { className: "w-12", children: "#" }), _jsx(TableHead, { children: "\u540D\u79F0" }), _jsx(TableHead, { children: "\u4EE3\u7801" }), _jsx(TableHead, { className: "text-right", children: "\u6700\u65B0\u4EF7" }), _jsx(TableHead, { className: "text-right", children: "\u6DA8\u8DCC\u5E45" }), _jsx(TableHead, { className: "text-right", children: "\u6210\u4EA4\u989D" })] }) }), _jsx(TableBody, { children: filteredStocks.length === 0 ? (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: 6, className: "text-center text-muted py-8", children: "\u65E0\u5339\u914D\u7ED3\u679C" }) })) : (filteredStocks.map((s, i) => (_jsxs(TableRow, { className: "hover:bg-white/[0.02]", children: [_jsx(TableCell, { className: "text-muted-foreground text-xs", children: i + 1 }), _jsx(TableCell, { className: "font-medium", children: s.name }), _jsx(TableCell, { className: "font-mono text-xs text-muted-foreground", children: s.symbol }), _jsx(TableCell, { className: "text-right font-mono", children: s.price > 0 ? s.price.toFixed(2) : '--' }), _jsx(TableCell, { className: `text-right font-mono ${pctColor(s.change_pct)}`, children: s.price > 0 ? `${s.change_pct >= 0 ? '+' : ''}${s.change_pct.toFixed(2)}%` : '--' }), _jsx(TableCell, { className: "text-right font-mono text-xs text-muted-foreground", children: s.amount > 0 ? fmtAmount(s.amount) : '--' })] }, s.symbol)))) })] }) }))] })) })] }), _jsxs(Dialog, { open: createOpen, onOpenChange: setCreateOpen, children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "\u521B\u5EFA\u80A1\u7968\u6C60" }) }), _jsxs(DialogContent, { children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm text-muted-foreground", children: "\u540D\u79F0" }), _jsx(Input, { value: form.name, onChange: e => setForm({ ...form, name: e.target.value }), className: "mt-1", placeholder: "\u5982: \u6CAA\u6DF1300\u6210\u5206\u80A1" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-muted-foreground", children: "\u80A1\u7968\u4EE3\u7801 (\u9017\u53F7\u5206\u9694)" }), _jsx(Input, { value: form.symbols, onChange: e => setForm({ ...form, symbols: e.target.value }), className: "mt-1", placeholder: "sh600519,sz000001,sh601318" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-muted-foreground", children: "\u8FC7\u6EE4\u89C4\u5219" }), _jsxs("div", { className: "flex gap-4 mt-1", children: [_jsxs("label", { className: "flex items-center gap-2 text-sm", children: [_jsx("input", { type: "checkbox", checked: form.filters.includes('exclude_st'), onChange: e => setForm({ ...form, filters: e.target.checked ? [...form.filters, 'exclude_st'] : form.filters.filter(f => f !== 'exclude_st') }), className: "w-4 h-4 rounded border-[#1e2d3d] bg-[#0a0e17] text-primary focus:ring-primary" }), "\u6392\u9664ST"] }), _jsxs("label", { className: "flex items-center gap-2 text-sm", children: [_jsx("input", { type: "checkbox", checked: form.filters.includes('exclude_suspended'), onChange: e => setForm({ ...form, filters: e.target.checked ? [...form.filters, 'exclude_suspended'] : form.filters.filter(f => f !== 'exclude_suspended') }), className: "w-4 h-4 rounded border-[#1e2d3d] bg-[#0a0e17] text-primary focus:ring-primary" }), "\u6392\u9664\u505C\u724C"] })] })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setCreateOpen(false), children: "\u53D6\u6D88" }), _jsx(Button, { onClick: handleCreate, children: "\u521B\u5EFA" })] })] })] }));
};
export default Universes;
