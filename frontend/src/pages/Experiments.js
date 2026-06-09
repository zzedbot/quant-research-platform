import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '../components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
const Experiments = () => {
    const [experiments, setExperiments] = useState([]);
    const [universes, setUniverses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);
    const [form, setForm] = useState({ name: '', universe_id: '', factors: 'ma_20,rsi_14', portfolio: 'equal_weight' });
    const fetchData = async () => {
        const [el, ul] = await Promise.all([
            fetch('/api/experiments').then(r => r.json()),
            fetch('/api/universes').then(r => r.json()),
        ]);
        setExperiments(el);
        setUniverses(ul);
        setLoading(false);
    };
    useEffect(() => { fetchData(); }, []);
    const handleCreate = async () => {
        if (!form.name || !form.universe_id)
            return;
        await fetch('/api/experiments', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: form.name, universe_id: form.universe_id,
                factors: form.factors.split(',').map(f => ({ name: f.trim() })),
                portfolio: { method: form.portfolio },
                execution: { rebalance: 'monthly', cost_rate: 0.001, slippage: 0.001 },
            }),
        });
        setCreateOpen(false);
        setForm({ name: '', universe_id: '', factors: 'ma_20,rsi_14', portfolio: 'equal_weight' });
        fetchData();
    };
    const statusColors = { draft: 'secondary', running: 'warning', completed: 'success', failed: 'destructive' };
    if (loading)
        return _jsxs("div", { className: "loading-text", children: [_jsx("div", { className: "inline-block w-5 h-5 border-2 border-[#1e2d3d] border-t-primary rounded-full animate-spin mr-2 align-middle" }), "\u52A0\u8F7D\u4E2D..."] });
    return (_jsxs("div", { className: "page-enter", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-semibold", children: "\u5B9E\u9A8C\u7BA1\u7406" }), _jsx("p", { className: "text-sm text-muted mt-1", children: "\u521B\u5EFA\u548C\u7BA1\u7406\u91CF\u5316\u7814\u7A76\u5B9E\u9A8C" })] }), _jsx(Button, { onClick: () => setCreateOpen(true), children: "+ \u521B\u5EFA\u5B9E\u9A8C" })] }), experiments.length === 0 ? (_jsxs("div", { className: "stat-card text-center py-12", children: [_jsx("div", { className: "text-3xl mb-3", children: "\uD83E\uDDEA" }), _jsx("div", { className: "text-lg font-medium mb-1", children: "\u6682\u65E0\u5B9E\u9A8C" }), _jsx("div", { className: "text-sm text-muted", children: "\u70B9\u51FB\u300C\u521B\u5EFA\u5B9E\u9A8C\u300D\u5F00\u59CB\u7814\u7A76" })] })) : (_jsx("div", { className: "section-card", children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "\u540D\u79F0" }), _jsx(TableHead, { children: "\u80A1\u7968\u6C60" }), _jsx(TableHead, { children: "\u56E0\u5B50" }), _jsx(TableHead, { children: "\u7EC4\u5408" }), _jsx(TableHead, { children: "\u72B6\u6001" }), _jsx(TableHead, { children: "\u521B\u5EFA\u65F6\u95F4" })] }) }), _jsx(TableBody, { children: experiments.map(e => {
                                const u = universes.find(x => x.id === e.universe_id);
                                return (_jsxs(TableRow, { className: "hover:bg-white/[0.02]", children: [_jsx(TableCell, { className: "font-medium", children: e.name }), _jsx(TableCell, { className: "text-muted-foreground", children: u?.name || e.universe_id }), _jsx(TableCell, { children: _jsx("div", { className: "flex flex-wrap gap-1", children: e.factors?.map((f, i) => (_jsx(Badge, { variant: "secondary", className: "text-xs", children: f.name }, i))) }) }), _jsx(TableCell, { className: "text-muted-foreground", children: e.portfolio?.method || '--' }), _jsx(TableCell, { children: _jsx(Badge, { variant: statusColors[e.status] || 'secondary', children: e.status }) }), _jsx(TableCell, { className: "text-muted-foreground font-mono text-xs", children: e.created_at?.slice(0, 19) })] }, e.id));
                            }) })] }) })), _jsxs(Dialog, { open: createOpen, onOpenChange: setCreateOpen, children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "\u521B\u5EFA\u5B9E\u9A8C" }) }), _jsxs(DialogContent, { children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm text-muted-foreground", children: "\u540D\u79F0" }), _jsx(Input, { value: form.name, onChange: e => setForm({ ...form, name: e.target.value }), className: "mt-1", placeholder: "cn_momentum_top50" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-muted-foreground", children: "\u9009\u62E9\u80A1\u7968\u6C60" }), _jsxs("select", { value: form.universe_id, onChange: e => setForm({ ...form, universe_id: e.target.value }), className: "mt-1 w-full h-10 rounded-md border border-[#1e2d3d] bg-[#0a0e17] px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary", children: [_jsx("option", { value: "", children: "-- \u9009\u62E9 --" }), universes.map(u => _jsxs("option", { value: u.id, children: [u.name, " (", u.symbols?.length || 0, "\u53EA)"] }, u.id))] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-muted-foreground", children: "\u56E0\u5B50 (\u9017\u53F7\u5206\u9694)" }), _jsx(Input, { value: form.factors, onChange: e => setForm({ ...form, factors: e.target.value }), className: "mt-1", placeholder: "ma_20,rsi_14,macd_12_26_9" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-muted-foreground", children: "\u7EC4\u5408\u65B9\u6CD5" }), _jsxs("select", { value: form.portfolio, onChange: e => setForm({ ...form, portfolio: e.target.value }), className: "mt-1 w-full h-10 rounded-md border border-[#1e2d3d] bg-[#0a0e17] px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary", children: [_jsx("option", { value: "equal_weight", children: "\u7B49\u6743" }), _jsx("option", { value: "market_cap", children: "\u5E02\u503C\u52A0\u6743" }), _jsx("option", { value: "top_n", children: "Top N" })] })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setCreateOpen(false), children: "\u53D6\u6D88" }), _jsx(Button, { onClick: handleCreate, children: "\u521B\u5EFA" })] })] })] }));
};
export default Experiments;
