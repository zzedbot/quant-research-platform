# 量化研究平台 (Quant Research Platform)

> A股/港股量化研究平台 — 第一版聚焦研究闭环：数据接入 → 数据清洗 → 因子研究 → 回测 → 报表

[![Python](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/react-18-blue.svg)](https://react.dev/)
[![License](https://img.shields.io/badge/license-MIT-lightgrey.svg)](LICENSE)

## 架构

```
外部数据源 (AkShare / Sina / 腾讯)
        │
        ▼
数据源适配层 (MarketDataAdapter)
  统一拉取、字段映射、分页、限频、错误重试
        │
        ▼
数据处理与质量检查
  缺失检查、重复检查、OHLC逻辑、异常值检查
        │
        ▼
数据存储层
  Raw Zone / Clean Zone / Feature Zone
  Parquet + SQLite
        │
        ▼
Python 研究内核 (quant_core)
  股票池、因子、技术指标、事件标签、Experiment
        │
        ▼
回测引擎 (后续版本)
        │
        ▼
本地 Web UI (React + TypeScript)
```

## 当前进度

| MVP | 状态 | 说明 |
|-----|------|------|
| **MVP 1: 数据闭环** | ✅ 完成 | 数据源接入 → Parquet存储 → 质量检查 → Web UI |
| **MVP 2: 研究闭环** | 📋 计划中 | 股票池、因子研究、Experiment 体系 |
| **MVP 3: 组合回测** | 📋 计划中 | 组合级日频回测完整闭环 |
| **MVP 4: 报表工作台** | 📋 计划中 | 单策略报告 + 多实验对比 |
| **MVP 5: 扩展基础版** | 📋 计划中 | 信号级/事件级回测 + 导出 |

## 快速开始

### 环境要求

- Python 3.10+
- Node.js 18+

### 安装

```bash
# 克隆仓库
git clone git@github.com:zzedbot/quant-research-platform.git
cd quant-research-platform

# 安装 Python 依赖
pip install -e ".[dev]"

# 安装前端依赖
cd frontend && npm install && cd ..
```

### 启动后端

```bash
cd quant-research-platform
uvicorn backend.main:app --host 0.0.0.0 --port 7031
```

### 启动前端

```bash
cd quant-research-platform/frontend
npm run dev
```

### 验证安装

```bash
# 健康检查
curl http://localhost:7031/health
# {"status":"ok","version":"0.1.0"}

# 数据状态
curl http://localhost:7031/api/data/status

# 触发数据更新
curl -X POST http://localhost:7031/api/data/update \
  -H "Content-Type: application/json" \
  -d '{"markets":["CN"],"datasets":["daily_bars","symbols","trade_calendar"],"start_date":"2026-01-01"}'
```

## 项目结构

```
quant-research-platform/
├── quant_core/              # Python 研究内核
│   ├── data/                # 数据适配层
│   │   ├── adapter.py       # MarketDataAdapter 统一接口
│   │   ├── akshare_adapter.py # AkShare 适配器实现 (Sina/腾讯源)
│   │   ├── portal.py        # DataPortal 统一数据入口
│   │   ├── calendar.py      # 交易日历管理
│   │   └── quality.py       # 数据质量检查
│   ├── storage/             # 存储引擎
│   │   ├── parquet_store.py # Raw/Clean/Feature Parquet 存储
│   │   └── meta_db.py       # SQLite 元数据库
│   └── models/              # Pydantic 数据模型
│       ├── symbol.py        # 股票基础信息
│       └── bar.py           # 日线行情 / 复权因子 / 指数
├── backend/                 # FastAPI 后端
│   ├── main.py              # 应用入口
│   ├── api/
│   │   ├── data.py          # /api/data/* 路由
│   │   └── schemas.py       # Pydantic 请求/响应模型
│   └── services/
│       ├── data_service.py  # 数据更新/查询服务
│       └── quality_service.py # 质量检查服务
├── frontend/                # React + TypeScript 前端
│   ├── src/
│   │   ├── pages/DataCenter.tsx  # 数据中心页面
│   │   └── api/client.ts         # API 客户端
│   └── vite.config.ts
├── data/                    # 数据存储 (gitignored)
│   ├── raw/                 # Raw Zone (原始数据)
│   ├── clean/               # Clean Zone (清洗后数据)
│   └── feature/             # Feature Zone (研究特征)
├── configs/
│   └── data_sources.yaml    # 数据源和存储配置
├── docs/
│   └── superpowers/
│       ├── specs/           # 设计文档
│       └── plans/           # 实施计划
└── pyproject.toml           # Python 项目配置
```

## API 文档

### 数据 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/data/status` | GET | 数据覆盖状态（各数据集最新日期） |
| `/api/data/update` | POST | 手动触发数据更新 |
| `/api/data/jobs` | GET | 数据更新任务历史 |
| `/api/data/quality` | GET | 数据质量检查结果 |

### POST /api/data/update

**请求体：**

```json
{
  "markets": ["CN", "HK"],
  "datasets": ["daily_bars", "symbols", "trade_calendar", "index_daily_bars"],
  "start_date": "2025-01-01",
  "end_date": "2026-06-06",
  "symbols": ["sh600519", "sz000001"]
}
```

**响应：**

```json
{
  "job_id": "a781eda9",
  "status": "completed",
  "started_at": ""
}
```

## Python API

```python
from quant_core.data.portal import DataPortal
from quant_core.data.akshare_adapter import AkShareAdapter
from quant_core.storage import ParquetStore, MetaDB

# 从配置创建 DataPortal
portal = DataPortal.from_config("configs/data_sources.yaml")

# 拉取并存储日线数据
count = portal.fetch_and_store_daily_bars(
    ["sh600519", "sz000001"], "CN", "2026-01-01", "2026-06-06")

# 读取数据
bars = portal.read_daily_bars(market="CN", start="2026-06-01")

# 获取交易日历
calendar = portal.get_calendar("CN")
print(f"Latest trade day: {calendar.latest_trade_day()}")
```

## 数据流

```
触发数据更新 (Web UI / API)
  │
  ▼
AkShareAdapter 拉取数据 (Sina/腾讯源)
  │
  ▼
写入 Raw Zone (Parquet)
  │
  ▼
清洗和标准化
  │
  ▼
执行质量检查 (主键/OHLC/价格异常)
  │
  ▼
写入 Clean Zone (Parquet)
  │
  ▼
更新 SQLite 元数据（任务状态、质量结果）
  │
  ▼
返回更新结果给 Web UI
```

## 技术栈

| 层 | 技术 |
|----|------|
| 数据源 | AkShare (Sina/腾讯源直连) |
| 存储 | Parquet (行情/基础数据) + SQLite (元数据) |
| 后端 | Python + FastAPI + Pydantic |
| 前端 | React + TypeScript + Vite |

## 数据质量检查

| 检查项 | 说明 |
|--------|------|
| 主键重复 | (trade_date, symbol) 不重复 |
| OHLC 逻辑 | high ≥ low, high ≥ open, high ≥ close |
| 价格异常 | pct_change 超出 ±20%（A 股） |

## 设计文档

- [MVP 1 数据闭环设计文档](docs/superpowers/specs/2026-06-06-quant-platform-mvp1-design.md)
- [Dashboard 原始设计方案](docs/superpowers/specs/2026-06-03-fia-quant-dashboard-design.md)
- [实施计划](docs/superpowers/plans/2026-06-06-quant-platform-mvp1.md)

## License

MIT
