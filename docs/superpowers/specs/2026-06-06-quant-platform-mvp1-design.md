# Dashboard → 量化研究平台 MVP 1 设计文档

日期：2026-06-06
状态：用户已批准，等待实施

## 1. 项目定位

将现有 FIA Quant Dashboard 改造为符合设计文档的量化研究平台第一版。
全新项目，目录位于 `/fia/workspace/quant-research-platform/`。

## 2. 范围：MVP 1 — 数据闭环

**目标**：完成基础数据从数据源到 Clean Zone 的闭环，并能在 Web UI 中查看数据状态。

### 2.1 包含

- 项目骨架（backend / quant_core / frontend / data / configs）
- AkShare 基础适配器（统一 `MarketDataAdapter` 接口）
- A 股/港股股票基础信息
- 交易日历
- 日线行情
- 指数行情
- Parquet 存储（Raw Zone + Clean Zone）
- SQLite 元数据库（数据源状态、更新任务、质量检查）
- 数据更新任务（手动触发）
- 数据质量检查（主键重复、OHLC 逻辑、停牌日成交量、复权因子连续性）
- 数据中心 FastAPI API
- 数据中心 Web UI 页面

### 2.2 排除

- 实时行情（设计文档明确排除）
- 财务指标、估值指标（MVP 2）
- 行业分类、事件数据（MVP 2）
- 因子、Experiment、回测（MVP 2-4）
- Tushare/CSV 适配器（后续扩展）
- 多租户、权限系统

## 3. 技术栈

| 层 | 技术 |
|----|------|
| 数据源 | AkShare |
| 存储 | Parquet (行情/基础数据) + DuckDB (查询) + SQLite (元数据) |
| 后端 | Python + FastAPI + Pydantic |
| 前端 | React + TypeScript + Vite + ECharts |
| 任务调度 | 同步执行（MVP 1 无异步任务队列） |

## 4. 目录结构

```
/fia/workspace/quant-research-platform/
├── quant_core/
│   ├── __init__.py
│   ├── data/
│   │   ├── __init__.py
│   │   ├── adapter.py          # MarketDataAdapter 统一接口
│   │   ├── akshare_adapter.py  # AkShare 适配器实现
│   │   ├── portal.py           # DataPortal 统一数据入口
│   │   ├── calendar.py         # 交易日历
│   │   └── quality.py          # 数据质量检查
│   ├── storage/
│   │   ├── __init__.py
│   │   ├── parquet_store.py    # Raw/Clean/Feature Parquet 存储
│   │   └── meta_db.py          # SQLite 元数据库
│   └── models/
│       ├── __init__.py
│       ├── symbol.py           # 股票基础信息模型
│       └── bar.py              # 日线行情模型
├── backend/
│   ├── __init__.py
│   ├── main.py                 # FastAPI 应用入口
│   ├── api/
│   │   ├── data.py             # /api/data/* 路由
│   │   └── schemas.py          # Pydantic 请求/响应模型
│   └── services/
│       ├── data_service.py     # 数据更新/查询服务
│       └── quality_service.py  # 质量检查服务
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   └── DataCenter.tsx  # 数据中心页面
│   │   ├── api/
│   │   │   └── client.ts       # API 客户端
│   │   └── components/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── data/
│   ├── raw/                    # Raw Zone
│   ├── clean/                  # Clean Zone
│   └── feature/                # Feature Zone（预留）
├── configs/
│   ├── data_sources.yaml       # 数据源配置
│   └── storage.yaml            # 存储路径配置
├── notebooks/                  # 预留
├── tests/                      # 预留
└── pyproject.toml
```

## 5. 核心接口

### 5.1 MarketDataAdapter

```python
class MarketDataAdapter(ABC):
    @abstractmethod
    def list_symbols(self, market: str) -> pd.DataFrame: ...

    @abstractmethod
    def get_trade_calendar(self, market: str, start: str, end: str) -> pd.DataFrame: ...

    @abstractmethod
    def get_daily_bars(self, symbols: list[str], start: str, end: str) -> pd.DataFrame: ...

    @abstractmethod
    def get_adjust_factors(self, symbols: list[str], start: str, end: str) -> pd.DataFrame: ...

    @abstractmethod
    def get_index_bars(self, index_code: str, start: str, end: str) -> pd.DataFrame: ...
```

### 5.2 AkShareAdapter 能力声明

```
source_capabilities:
  market: ["CN", "HK"]
  frequencies: ["1d"]
  supports_financials: false    # MVP 2
  supports_event: false         # MVP 2
  supports_adjust_factor: true
  rate_limit: ~1 req/s
```

### 5.3 标准字段

#### daily_bars (Clean Zone)
```
trade_date, symbol, market, open, high, low, close, volume, amount,
pre_close, change, pct_change, source, data_version
```

#### symbols (Clean Zone)
```
symbol, market, exchange, name, list_date, delist_date,
security_type, currency, is_active
```

#### trade_calendar (Clean Zone)
```
trade_date, market, is_open
```

### 5.4 数据质量检查

| 检查项 | 说明 |
|--------|------|
| 主键重复 | (trade_date, symbol) 不重复 |
| OHLC 逻辑 | high >= low, high >= open, high >= close, low <= open, low <= close |
| 价格异常 | pct_change 超出 ±20%（A 股）/ 无限制（港股） |
| 停牌日成交量 | 停牌日成交量应为 0 |
| 复权因子连续性 | adj_factor 不应有异常跳变 |

## 6. 数据流

```
触发数据更新 (Web UI / API)
  |
  v
AkShareAdapter 拉取数据
  |
  v
写入 Raw Zone (Parquet)
  |
  v
清洗和标准化
  |
  v
执行质量检查
  |
  v
写入 Clean Zone (Parquet)
  |
  v
更新 SQLite 元数据（任务状态、质量结果）
  |
  v
返回更新结果给 Web UI
```

## 7. API 设计

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/data/status` | GET | 数据覆盖状态（各数据集最新日期） |
| `/api/data/update` | POST | 手动触发数据更新 |
| `/api/data/jobs` | GET | 数据更新任务历史 |
| `/api/data/quality` | GET | 数据质量检查结果 |
| `/api/symbols` | GET | 股票列表（过滤/搜索） |
| `/api/calendars` | GET | 交易日历 |

### POST /api/data/update

请求体：
```json
{
  "markets": ["CN", "HK"],
  "datasets": ["daily_bars", "symbols", "trade_calendar"],
  "start_date": "2024-01-01",
  "end_date": "2026-06-06"
}
```

响应：
```json
{
  "job_id": "uuid",
  "status": "running",
  "started_at": "2026-06-06T20:00:00"
}
```

## 8. Web UI — 数据中心页面

页面结构：

```
┌─────────────────────────────────────────────────────────┐
│  数据状态总览                                             │
│  [A股 日线: 2026-06-06] [港股 日线: 2026-06-06]           │
│  [股票信息: 2026-06-06] [交易日历: 2026-06-06]            │
├─────────────────────────────────────────────────────────┤
│  [🔄 更新数据] 按钮                                      │
│  更新弹窗：选择市场/数据集/时间范围                        │
├─────────────────────────────────────────────────────────┤
│  数据质量检查                                             │
│  ✅ 通过: 142 | ⚠️ 警告: 3 | ❌ 错误: 0                  │
│  [展开查看详细信息]                                       │
├─────────────────────────────────────────────────────────┤
│  更新历史                                                 │
│  时间 | 数据源 | 市场 | 数据集 | 状态 | 耗时 | 行数       │
│  ...                                                     │
└─────────────────────────────────────────────────────────┘
```

## 9. SQLite 元数据表

### data_update_jobs
```
job_id (PK), data_source, markets, datasets, start_date, end_date,
started_at, finished_at, status, row_count, error_message
```

### data_quality_checks
```
check_id (PK), job_id, dataset, market, check_type,
status, details, checked_at
```

### data_status
```
dataset (PK), market, latest_date, row_count, last_updated
```

## 10. 验收标准

- [ ] 能拉取并存储指定时间范围的 A 股/港股日频数据
- [ ] 能查看每个数据集的最新日期
- [ ] 能看到数据更新成功/失败状态
- [ ] 能看到基础质量检查结果
- [ ] Web UI 数据中心页面可正常使用
