# Fia Quant Dashboard - Design Specification

Date: 2026-06-03
Author: fia
Status: Planning

## Architecture

```
┌─────────────────────────────────────────────────────┐
│              Fia Quant Dashboard (Web)               │
│  ┌──────────┐  ┌───────────────┐  ┌───────────────┐│
│  │  Frontend│  │  Backend API  │  │  OpenClaw API ││
│  │  React   │◄─┤  Python/FastAPI│◄─┤  sessions_send││
│  │  +Charts │  │  /api/*       │  │  to fia agent ││
│  └──────────┘  └───────────────┘  └───────────────┘│
└─────────────────────────────────────────────────────┘

Backend connects to fia agent session:
  Session: agent:fia:dashboard:70309fa4-d97b-49c8-8600-fddf808bbb2b
  Method: sessions_send via OpenClaw gateway
```

## Design System (from ui-ux-pro-max)

- **Pattern**: Real-Time / Operations Dashboard
- **Style**: Dark Mode (OLED) — deep black, high contrast, eye-friendly
- **Colors**: Primary teal (#0F766E), Secondary teal (#14B8A6), Accent blue (#0369A1)
  - Bullish: #26A69A, Bearish: #EF5350 (standard TradingView colors)
- **Typography**: Inter (Google Fonts), weights 300-700
- **Effects**: Minimal glow (text-shadow), high readability, visible focus states
- **Anti-patterns to avoid**: Light mode default, slow rendering, emoji as icons

## Layout

```
┌─────────────────────────────────────────────────────────────┐
│  📈 FIA QUANT DASHBOARD          [A股] [港股] [组合] [设置]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ 上证 4084│ │ 深证15705│ │ 创业板4123│ │ 沪深300  │  KPI  │
│  │ +0.22% ▲ │ │ +0.73% ▲ │ │ +1.65% ▲ │ │ 4939 ▲   │  Cards│
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                             │
│  ┌──────────────────────────┐  ┌─────────────────────────┐  │
│  │                          │  │                         │  │
│  │   持仓 K线图表            │  │   信号检测面板           │  │
│  │   Candlestick Chart      │  │   Buy/Sell Signals      │  │
│  │   (TradingView style)    │  │   with technical        │  │
│  │                          │  │   indicators             │  │
│  └──────────────────────────┘  └─────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────┐  ┌─────────────────────────┐  │
│  │                          │  │                         │  │
│  │   自选股列表              │  │   策略回测结果           │  │
│  │   Watchlist + Score      │  │   Backtest Comparison   │  │
│  │                          │  │                         │  │
│  └──────────────────────────┘  └─────────────────────────┘  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  💬 智能对话区 - 与 fia agent 交互 (连接 sessions_send)     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  输入: "帮我分析茅台" / "跑回测" / "明日策略"          │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Pages

### 1. 总览 (Dashboard Home)
- KPI cards: 四大指数实时行情
- 信号检测面板: 实时买卖信号
- 持仓K线图表: 选择个股显示OHLCV蜡烛图
- 自选股列表: 代码、名称、价格、涨跌幅、评分

### 2. 个股分析
- 完整K线图表 (TradingView风格)
- 技术指标面板: MA/MACD/KDJ/RSI/BOLL
- 信号检测结果
- 回测按钮: 一键跑策略

### 3. 组合管理
- 持仓列表 + 盈亏
- 组合饼图: 仓位分布
- 风险指标: 最大回撤、夏普比率

### 4. 智能对话
- 连接 fia agent session
- 支持: "分析某股" / "跑回测" / "筛选股票"
- 结果直接渲染到对应面板

## Tech Stack

- **Frontend**: Single HTML file with React CDN + Babel standalone
- **Charts**: Lightweight Charts (TradingView) for candlestick, Chart.js for others
- **Styling**: Pure CSS with CSS variables (design system tokens)
- **Backend API**: Python FastAPI (or simple HTTP server)
  - `/api/indices` - 指数行情
  - `/api/stock/:code/daily` - 日K线
  - `/api/stock/:code/signals` - 信号检测
  - `/api/watchlist` - 自选股列表 + 评分
  - `/api/backtest/:code/:strategy` - 策略回测
  - `/api/agent/query` - 转发到 fia agent session
- **Backend Framework**: FastAPI with Uvicorn
- **Agent Connection**: Python script uses OpenClaw CLI or direct sessions_send

## Data Flow

```
Frontend ──fetch──► Backend API ──calls──► quant/ Python modules
                                            │
                                            ├── data_fetcher.py → 新浪/腾讯API
                                            ├── indicators.py → 技术指标
                                            ├── backtest.py → 回测引擎
                                            └── sessions_send → fia agent
```

## Responsive

- Desktop (≥1440px): 4-column grid
- Tablet (768-1024px): 2-column grid
- Mobile (375-767px): 1-column, scrollable KPI cards
