import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import * as api from '../api/client';
const DataCenter = () => {
    const [dataStatus, setDataStatus] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [quality, setQuality] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState(null);
    const fetchData = async () => {
        try {
            const [status, jobList, qcList] = await Promise.all([
                api.getDataStatus(),
                api.getJobs(20),
                api.getQualityChecks(20),
            ]);
            setDataStatus(status);
            setJobs(jobList);
            setQuality(qcList);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Unknown error');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { fetchData(); }, []);
    const handleUpdate = async () => {
        setUpdating(true);
        try {
            await api.updateData({
                markets: ['CN'],
                datasets: ['symbols', 'trade_calendar', 'daily_bars'],
                start_date: '2026-06-01',
                end_date: '',
            });
            setTimeout(fetchData, 3000);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Update failed');
        }
        finally {
            setUpdating(false);
        }
    };
    const statusColor = (status) => {
        if (status === 'pass' || status === 'completed')
            return 'text-green-400';
        if (status === 'warning')
            return 'text-yellow-400';
        return 'text-red-400';
    };
    const dotColor = (status) => {
        if (status === 'pass' || status === 'completed')
            return 'bg-green-400';
        if (status === 'warning')
            return 'bg-yellow-400';
        return 'bg-red-400';
    };
    if (loading)
        return _jsxs("div", { className: "loading-text", children: [_jsx("div", { className: "inline-block w-5 h-5 border-2 border-[#1e2d3d] border-t-primary rounded-full animate-spin mr-2 align-middle" }), "\u52A0\u8F7D\u4E2D..."] });
    return (_jsxs("div", { className: "page-enter", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h1", { className: "text-xl font-semibold", children: "\u6570\u636E\u4E2D\u5FC3" }), _jsxs("button", { onClick: handleUpdate, disabled: updating, className: `inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${updating ? 'bg-dim cursor-not-allowed' : 'bg-primary hover:bg-primary/90'} text-white`, children: [_jsx("span", { className: `inline-block w-4 h-4 ${updating ? 'animate-spin' : ''}`, children: updating ? '⏳' : '🔄' }), updating ? '更新中...' : '更新数据'] })] }), error && (_jsxs("div", { className: "mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm", children: ["\u26A0\uFE0F ", error] })), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6", children: [dataStatus.map((s, i) => (_jsxs("div", { className: "stat-card", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx("div", { className: "w-2 h-2 rounded-full bg-primary" }), _jsxs("span", { className: "text-xs text-muted uppercase tracking-wide", children: [s.market, " ", s.dataset] })] }), _jsx("div", { className: "text-lg font-bold text-foreground", children: s.latest_date || '--' }), _jsxs("div", { className: "text-xs text-muted mt-1", children: [s.row_count.toLocaleString(), " \u6761\u8BB0\u5F55"] })] }, i))), dataStatus.length === 0 && (_jsxs("div", { className: "col-span-full stat-card text-center py-8", children: [_jsx("div", { className: "text-2xl mb-2", children: "\uD83D\uDCC2" }), _jsx("div", { className: "text-muted text-sm", children: "\u6682\u65E0\u6570\u636E\uFF0C\u70B9\u51FB\u300C\u66F4\u65B0\u6570\u636E\u300D\u62C9\u53D6" })] }))] }), quality.length > 0 && (_jsxs("div", { className: "section-card mb-6", children: [_jsxs("div", { className: "px-4 py-3 border-b border-border flex items-center gap-2", children: [_jsx("span", { children: "\uD83D\uDD0D" }), _jsx("span", { className: "font-semibold text-sm", children: "\u6570\u636E\u8D28\u91CF\u68C0\u67E5" }), _jsxs("span", { className: "ml-auto text-xs text-muted", children: [quality.filter(q => q.status === 'pass').length, "/", quality.length, " \u901A\u8FC7"] })] }), _jsx("div", { className: "p-4 space-y-2", children: quality.map(q => (_jsxs("div", { className: "flex items-center gap-3 py-2 text-sm", children: [_jsx("span", { className: `w-2 h-2 rounded-full flex-shrink-0 ${dotColor(q.status)}` }), _jsx("span", { className: "text-muted-foreground w-16", children: q.dataset }), _jsx("span", { className: "text-muted w-20", children: q.check_type }), _jsx("span", { className: `font-medium ${statusColor(q.status)}`, children: q.status }), q.details && (_jsx("span", { className: "text-dim text-xs ml-auto truncate max-w-[300px]", children: q.details }))] }, q.check_id))) })] })), _jsxs("div", { className: "section-card", children: [_jsx("div", { className: "px-4 py-3 border-b border-border", children: _jsx("span", { className: "font-semibold text-sm", children: "\uD83D\uDCDC \u66F4\u65B0\u5386\u53F2" }) }), jobs.length === 0 ? (_jsx("div", { className: "loading-text", children: "\u6682\u65E0\u66F4\u65B0\u8BB0\u5F55" })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsx("tr", { className: "border-b border-border", children: ['时间', '数据源', '市场', '数据集', '状态', '行数'].map(h => (_jsx("th", { className: "px-4 py-2.5 text-left text-xs font-medium text-muted uppercase tracking-wider", children: h }, h))) }) }), _jsx("tbody", { children: jobs.map(j => (_jsxs("tr", { className: "border-b border-border/50 hover:bg-white/[0.02] transition-colors", children: [_jsx("td", { className: "px-4 py-2.5 font-mono text-xs", children: j.started_at?.slice(0, 19) }), _jsx("td", { className: "px-4 py-2.5 text-muted-foreground", children: j.data_source }), _jsx("td", { className: "px-4 py-2.5 text-muted-foreground", children: j.markets }), _jsx("td", { className: "px-4 py-2.5 text-muted-foreground", children: j.datasets }), _jsx("td", { className: "px-4 py-2.5", children: _jsxs("span", { className: `inline-flex items-center gap-1.5 font-medium ${statusColor(j.status)}`, children: [_jsx("span", { className: `w-1.5 h-1.5 rounded-full ${dotColor(j.status)}` }), j.status] }) }), _jsx("td", { className: "px-4 py-2.5 text-muted-foreground font-mono", children: j.row_count.toLocaleString() })] }, j.job_id))) })] }) }))] })] }));
};
export default DataCenter;
