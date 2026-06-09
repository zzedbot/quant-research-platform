import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import DataCenter from './pages/DataCenter';
import Universes from './pages/Universes';
import Features from './pages/Features';
import Events from './pages/Events';
import Experiments from './pages/Experiments';
import Backtests from './pages/Backtests';
const App = () => {
    const [currentPage, setCurrentPage] = useState('datacenter');
    const tabs = [
        { id: 'datacenter', label: '数据中心', icon: '📊' },
        { id: 'universes', label: '股票池', icon: '🎯' },
        { id: 'features', label: '因子与指标', icon: '📈' },
        { id: 'events', label: '事件库', icon: '📰' },
        { id: 'experiments', label: '实验管理', icon: '🧪' },
        { id: 'backtests', label: '回测任务', icon: '📊' },
    ];
    return (_jsxs("div", { className: "min-h-screen", children: [_jsxs("nav", { className: "h-[56px] bg-surface border-b border-border flex items-center px-4 sticky top-0 z-50 backdrop-blur-sm", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xl", children: "\uD83D\uDCC8" }), _jsx("span", { className: "font-bold text-base text-primary tracking-wide", children: "FIA QUANT RESEARCH" })] }), _jsx("div", { className: "ml-6 flex gap-1", children: tabs.map(tab => (_jsxs("button", { onClick: () => setCurrentPage(tab.id), className: `px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${currentPage === tab.id
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted hover:text-foreground hover:bg-white/5'}`, children: [_jsx("span", { className: "mr-1.5", children: tab.icon }), tab.label] }, tab.id))) })] }), _jsxs("main", { className: "pt-[72px] px-4 pb-8 max-w-7xl mx-auto page-enter", children: [currentPage === 'datacenter' && _jsx(DataCenter, {}), currentPage === 'universes' && _jsx(Universes, {}), currentPage === 'features' && _jsx(Features, {}), currentPage === 'events' && _jsx(Events, {}), currentPage === 'experiments' && _jsx(Experiments, {}), currentPage === 'backtests' && _jsx(Backtests, {})] })] }));
};
export default App;
