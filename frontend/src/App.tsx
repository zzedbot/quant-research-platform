import React, { useState } from 'react'
import DataCenter from './pages/DataCenter'
import Universes from './pages/Universes'
import Features from './pages/Features'
import Events from './pages/Events'
import Experiments from './pages/Experiments'

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('datacenter')
  const tabs = [
    { id: 'datacenter', label: '数据中心' },
    { id: 'universes', label: '股票池' },
    { id: 'features', label: '因子与指标' },
    { id: 'events', label: '事件库' },
    { id: 'experiments', label: '实验管理' },
  ]

  return (
    <div className="min-h-screen">
      <nav className="h-[52px] bg-[#111827] border-b border-[#1e2d3d] flex items-center px-5 sticky top-0 z-50">
        <div className="font-bold text-[15px] text-primary tracking-wide">FIA QUANT RESEARCH</div>
        <div className="ml-6 flex gap-1">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setCurrentPage(tab.id)}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-all ${currentPage === tab.id ? 'bg-primary/10 text-primary' : 'text-[#64748b] hover:text-[#e2e8f0]'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>
      <div className="pt-[68px] px-5 pb-6 max-w-7xl mx-auto">
        {currentPage === 'datacenter' && <DataCenter />}
        {currentPage === 'universes' && <Universes />}
        {currentPage === 'features' && <Features />}
        {currentPage === 'events' && <Events />}
        {currentPage === 'experiments' && <Experiments />}
      </div>
    </div>
  )
}

export default App
