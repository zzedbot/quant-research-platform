import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
const Events = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('');
    useEffect(() => {
        fetch(`/api/events${filterType ? `?event_type=${filterType}` : ''}`)
            .then(r => r.json()).then(d => { setEvents(d); setLoading(false); });
    }, [filterType]);
    if (loading)
        return _jsxs("div", { className: "loading-text", children: [_jsx("div", { className: "inline-block w-5 h-5 border-2 border-[#1e2d3d] border-t-primary rounded-full animate-spin mr-2 align-middle" }), "\u52A0\u8F7D\u4E2D..."] });
    const typeColors = { earnings: 'success', notice: 'warning', dividend: 'default', suspension: 'destructive' };
    return (_jsxs("div", { className: "page-enter", children: [_jsx("h1", { className: "text-xl font-semibold mb-1", children: "\u4E8B\u4EF6\u5E93" }), _jsx("p", { className: "text-sm text-muted mb-6", children: "\u67E5\u770B\u8D22\u62A5/\u516C\u544A/\u5206\u7EA2/\u505C\u590D\u724C\u7B49\u4E8B\u4EF6\u6570\u636E" }), _jsx("div", { className: "flex gap-4 mb-4", children: _jsx(Input, { placeholder: "\u6309\u7C7B\u578B\u8FC7\u6EE4 (earnings/notice/dividend/suspension)", value: filterType, onChange: e => setFilterType(e.target.value), className: "max-w-xs" }) }), events.length === 0 ? (_jsxs("div", { className: "stat-card text-center py-12", children: [_jsx("div", { className: "text-3xl mb-3", children: "\uD83D\uDCF0" }), _jsx("div", { className: "text-lg font-medium mb-1", children: "\u6682\u65E0\u4E8B\u4EF6\u6570\u636E" }), _jsx("div", { className: "text-sm text-muted", children: "\u4E8B\u4EF6\u6570\u636E\u5C06\u5728\u540E\u7EED\u7248\u672C\u4E2D\u81EA\u52A8\u91C7\u96C6" })] })) : (_jsx("div", { className: "section-card", children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "\u65E5\u671F" }), _jsx(TableHead, { children: "\u7C7B\u578B" }), _jsx(TableHead, { children: "\u4EE3\u7801" }), _jsx(TableHead, { children: "\u6807\u9898" }), _jsx(TableHead, { children: "\u6458\u8981" })] }) }), _jsx(TableBody, { children: events.map(e => (_jsxs(TableRow, { children: [_jsx(TableCell, { className: "font-mono text-xs", children: e.event_date }), _jsx(TableCell, { children: _jsx(Badge, { variant: typeColors[e.event_type] || 'secondary', children: e.event_type }) }), _jsx(TableCell, { className: "font-mono text-xs", children: e.symbol }), _jsx(TableCell, { className: "max-w-[200px] truncate", children: e.title }), _jsx(TableCell, { className: "max-w-[200px] truncate text-muted-foreground", children: e.summary })] }, e.event_id))) })] }) }))] }));
};
export default Events;
