import React, { useState } from 'react'
import DataCenter from './pages/DataCenter'

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('datacenter')

  return (
    <div style={{ minHeight: '100vh' }}>
      <nav style={{
        height: '52px', background: '#111827', borderBottom: '1px solid #1e2d3d',
        display: 'flex', alignItems: 'center', padding: '0 20px', position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ fontWeight: 700, fontSize: '15px', color: '#14B8A6' }}>
          FIA QUANT RESEARCH
        </div>
        <div style={{ marginLeft: '24px', display: 'flex', gap: '4px' }}>
          {[
            { id: 'datacenter', label: '数据中心' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setCurrentPage(tab.id)}
              style={{
                padding: '6px 14px', borderRadius: '6px', cursor: 'pointer',
                fontSize: '12px', fontWeight: 500, border: 'none',
                background: currentPage === tab.id ? 'rgba(20,184,166,0.1)' : 'transparent',
                color: currentPage === tab.id ? '#14B8A6' : '#64748b',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <div style={{ paddingTop: '68px', padding: '68px 20px 24px', maxWidth: '1400px', margin: '0 auto' }}>
        {currentPage === 'datacenter' && <DataCenter />}
      </div>
    </div>
  )
}

export default App
