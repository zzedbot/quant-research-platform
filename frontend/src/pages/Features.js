import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
const Features = () => {
    const [factors, setFactors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [computing, setComputing] = useState(false);
    const [selectedFactor, setSelectedFactor] = useState('');
    const [symbols, setSymbols] = useState('sh600519,sz000001,sh601318,sz002594,sh600036,sz000858');
    const [startDate, setStartDate] = useState('2026-01-01');
    const [result, setResult] = useState(null);
    useEffect(() => {
        fetch('/api/features/factors').then(r => r.json()).then(d => { setFactors(d); setLoading(false); });
    }, []);
    const handleCompute = async () => {
        if (!selectedFactor || !symbols)
            return;
        setComputing(true);
        const res = await fetch('/api/features/calculate', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ factor_name: selectedFactor, symbols: symbols.split(/[,，\s]+/).filter((s) => s), market: 'CN', start_date: startDate }),
        });
        setResult(await res.json());
        setComputing(false);
    };
    if (loading)
        return _jsxs("div", { className: "loading-text", children: [_jsx("div", { className: "inline-block w-5 h-5 border-2 border-[#1e2d3d] border-t-primary rounded-full animate-spin mr-2 align-middle" }), "\u52A0\u8F7D\u4E2D..."] });
    const categories = [...new Set(factors.map(f => f.category))];
    return (_jsxs("div", { className: "page-enter", children: [_jsx("h1", { className: "text-xl font-semibold mb-1", children: "\u56E0\u5B50\u4E0E\u6307\u6807\u5E93" }), _jsx("p", { className: "text-sm text-muted mb-6", children: "29\u4E2A\u5185\u7F6E\u56E0\u5B50\uFF0C\u6DB5\u76D6\u6280\u672F/\u4F30\u503C/\u8D28\u91CF/\u6210\u957F/\u52A8\u91CF/\u6CE2\u52A8\u7387/\u6D41\u52A8\u6027" }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsx("div", { children: _jsxs(Tabs, { defaultValue: categories[0], children: [_jsx(TabsList, { className: "w-full flex-wrap mb-3", children: categories.map(c => _jsx(TabsTrigger, { value: c, className: "text-xs", children: c }, c)) }), categories.map(c => (_jsx(TabsContent, { value: c, children: _jsx("div", { className: "space-y-1.5", children: factors.filter(f => f.category === c).map(f => (_jsxs("div", { className: `p-2.5 rounded-lg border cursor-pointer transition-all ${selectedFactor === f.name
                                                ? 'border-primary bg-primary/10 shadow-sm'
                                                : 'border-border hover:bg-white/[0.02]'}`, onClick: () => setSelectedFactor(f.name), children: [_jsx("div", { className: "font-medium text-sm", children: f.name }), _jsx("div", { className: "text-xs text-muted", children: f.description })] }, f.name))) }) }, c)))] }) }), _jsxs("div", { className: "lg:col-span-2", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "\uD83E\uDDEE \u8FD0\u884C\u56E0\u5B50\u8BA1\u7B97" }) }), _jsxs(CardContent, { children: [_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm text-muted-foreground", children: "\u56E0\u5B50" }), _jsx("div", { className: "mt-1 h-10 rounded-md border border-[#1e2d3d] bg-[#0a0e17] px-3 flex items-center text-sm text-primary", children: selectedFactor || _jsx("span", { className: "text-muted", children: "\u672A\u9009\u62E9" }) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-muted-foreground", children: "\u80A1\u7968\u4EE3\u7801" }), _jsx(Input, { value: symbols, onChange: e => setSymbols(e.target.value), className: "mt-1", placeholder: "sh600519,sz000001" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-muted-foreground", children: "\u8D77\u59CB\u65E5\u671F" }), _jsx(Input, { type: "date", value: startDate, onChange: e => setStartDate(e.target.value), className: "mt-1" })] })] }), _jsx(Button, { onClick: handleCompute, disabled: computing || !selectedFactor, children: computing ? _jsxs(_Fragment, { children: [_jsx("span", { className: "inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" }), "\u8BA1\u7B97\u4E2D..."] }) : '▶ 运行计算' })] })] }), result && !result.error && (_jsxs(Card, { className: "mt-4", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "\uD83D\uDCCA \u5206\u6790\u7ED3\u679C" }) }), _jsxs(CardContent, { children: [_jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3 mb-4", children: [['IC 均值', result.ic_statistics?.ic_mean?.toFixed(4)],
                                                    ['ICIR', result.ic_statistics?.icir?.toFixed(4)],
                                                    ['IC正比例', `${(result.ic_statistics?.ic_positive_pct || 0) * 100 | 0}%`],
                                                    ['覆盖率', `${(result.distribution?.coverage || 0) * 100 | 0}%`]].map(([l, v]) => (_jsxs("div", { className: "text-center p-3 bg-[#0a0e17] rounded-lg border border-[#1e2d3d]", children: [_jsx("div", { className: "text-lg font-bold text-primary", children: v }), _jsx("div", { className: "text-xs text-muted", children: l })] }, l))) }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "p-3 bg-[#0a0e17] rounded-lg border border-[#1e2d3d]", children: [_jsx("div", { className: "text-sm font-medium mb-2", children: "\u5206\u5E03\u7EDF\u8BA1" }), _jsxs("div", { className: "text-xs text-muted-foreground space-y-1", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "\u5747\u503C" }), _jsx("span", { className: "font-mono", children: result.distribution?.mean?.toFixed(4) })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "\u6807\u51C6\u5DEE" }), _jsx("span", { className: "font-mono", children: result.distribution?.std?.toFixed(4) })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "\u504F\u5EA6" }), _jsx("span", { className: "font-mono", children: result.distribution?.skew?.toFixed(4) })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "\u7F3A\u5931\u7387" }), _jsxs("span", { className: "font-mono", children: [(result.distribution?.missing_rate || 0) * 100 | 0, "%"] })] })] })] }), _jsxs("div", { className: "p-3 bg-[#0a0e17] rounded-lg border border-[#1e2d3d]", children: [_jsx("div", { className: "text-sm font-medium mb-2", children: "\u5206\u4F4D\u4EF7\u5DEE" }), _jsxs("div", { className: "text-xs text-muted-foreground space-y-1", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "\u65E5\u5EA6\u4EF7\u5DEE" }), _jsx("span", { className: "font-mono", children: result.quantile_spread?.spread?.toFixed(6) })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "\u5E74\u5316\u4EF7\u5DEE" }), _jsx("span", { className: "font-mono", children: result.quantile_spread?.annualized_spread?.toFixed(4) })] })] })] })] })] })] })), result?.error && _jsx(Card, { className: "mt-4 border-red-500/30", children: _jsxs(CardContent, { className: "pt-4 text-red-400 text-sm", children: ["\u26A0\uFE0F ", result.error] }) })] })] })] }));
};
export default Features;
