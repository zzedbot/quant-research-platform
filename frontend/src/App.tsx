import React, { useState } from 'react'
import DataCenter from './pages/DataCenter'
import Universes from './pages/Universes'
import Features from './pages/Features'
import Events from './pages/Events'
import Experiments from './pages/Experiments'
import Backtests from './pages/Backtests'

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('datacenter')
  const tabs = [
    { id: 'datacenter', label: '数据中心', icon: '📊' },
    { id: 'universes', label: '股票池', icon: '🎯' },
    { id: 'features', label: '因子与指标', icon: '📈' },
    { id: 'events', label: '事件库', icon: '📰' },
    { id: 'experiments', label: '实验管理', icon: '🧪' },
    { id: 'backtests', label: '回测任务', icon: '📊' },
  ]

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="h-[56px] bg-surface border-b border-border flex items-center px-4 sticky top-0 z-50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl">📈</span>
          <span className="font-bold text-base text-primary tracking-wide">FIA QUANT RESEARCH</span>
        </div>
        <div className="ml-6 flex gap-1">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setCurrentPage(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentPage === tab.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted hover:text-foreground hover:bg-white/5'
              }`}>
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-[72px] px-4 pb-8 max-w-7xl mx-auto page-enter">
        {currentPage === 'datacenter' && <DataCenter />}
        {currentPage === 'universes' && <Universes />}
        {currentPage === 'features' && <Features />}
        {currentPage === 'events' && <Events />}
        {currentPage === 'experiments' && <Experiments />}
        {currentPage === 'backtests' && <Backtests />}
      </main>
    </div>
  )
}

export default App
