# MVP 2 研究闭环 — 设计文档

日期：2026-06-06
状态：用户已批准

## 1. 项目定位

在 MVP 1 数据闭环基础上，构建研究闭环能力：股票池管理 → 因子计算 → 因子分析 → Experiment 实验记录 → 后续回测。

## 2. 范围

### 2.1 包含

- **Universe 股票池**
  - 静态股票代码列表 + 名称
  - 简单过滤：排除 ST、排除停牌（基于 trade_calendar）
  - CRUD：创建/查看成分/编辑/删除
  - Web UI：股票池列表 + 成分管理页面

- **Features 因子与指标**
  - 完整因子体系（7 类）：
    - 技术指标因子：MA/EMA/MACD/RSI/BOLL/ATR/OBV/量比/换手率
    - 估值因子：PE/PB/PS/PCF
    - 质量因子：ROE/ROA/毛利率/净利率/资产负债率
    - 成长因子：营收增长率/净利润增长率/ROE 变化率
    - 动量因子：N 日价格动量/行业相对动量
    - 波动率因子：历史波动率/ATR 波动率/最大回撤
    - 流动性因子：成交额/换手率/Amihud 非流动性
  - 技术指标计算框架（复用现有 indicators.py）
  - 因子分析能力：
    - IC / Rank IC 计算
    - 因子分层收益（5 分位/10 分位）
    - 因子覆盖率/缺失率
    - 因子分布统计
  - Web UI：因子列表 + 运行计算 + 分析结果页面

- **Events 事件库**
  - 事件标签结构（财报/公告/分红/停复牌）
  - 事件窗口统计
  - 按类型/市场/日期过滤
  - Web UI：事件列表页面

- **Experiment 实验体系**
  - 表单式创建实验：
    - 选择股票池
    - 选择因子/技术指标
    - 配置组合构建（等权/市值加权/Top N/个股权重上限）
    - 配置执行参数（调仓频率/成交价/交易成本/滑点/停牌处理）
  - 实验记录模型（ID/名称/描述/配置/状态/结果路径/指标/创建时间）
  - Web UI：实验列表 + 创建表单 + 详情页

### 2.2 排除

- 实盘交易（设计文档明确排除）
- 自动下单
- 回测执行（MVP 3）
- 行业中性/风格中性约束（后续版本）
- Barra 风险模型（后续版本）
- NLP 新闻分析（后续版本）
- 自定义 Python 因子脚本（MVP 2 仅内置因子）
- 多因子组合优化

## 3. 技术栈

| 层 | 技术 |
|----|------|
| Python 内核 | pandas + numpy + scipy (IC 计算) |
| 财务数据 | AkShare stock_financial_* / stock_a_indicator_lg |
| 存储 | Parquet (因子值) + SQLite (experiment/universe 元数据) |
| 后端 | FastAPI + Pydantic |
| 前端 | React + TypeScript + Vite + Tailwind CSS + shadcn/ui |
| 图表 | ECharts (因子分层/IC 曲线/分布) |

## 4. 目录结构变更

```
quant-research-platform/
├── quant_core/
│   ├── data/                    ← 已有
│   │   └── financial.py         # 新增：财务数据获取
│   ├── features/                # 新增：因子与技术指标
│   │   ├── __init__.py
│   │   ├── factors/
│   │   │   ├── base.py          # 因子抽象基类
│   │   │   ├── technical.py     # 技术指标因子
│   │   │   ├── valuation.py     # 估值因子
│   │   │   ├── quality.py       # 质量因子
│   │   │   ├── growth.py        # 成长因子
│   │   │   ├── momentum.py      # 动量因子
│   │   │   └── volatility.py    # 波动率因子
│   │   ├── liquidity.py         # 流动性因子
│   │   ├── indicators.py        # 技术指标计算框架
│   │   ├── events.py            # 事件标签
│   │   └── analysis/
│   │       ├── ic.py            # IC / Rank IC
│   │       ├── quantile.py      # 分层收益
│   │       └── distribution.py  # 分布/覆盖率
│   ├── strategy/                # 新增：策略表达
│   │   ├── __init__.py
│   │   ├── universe.py          # 股票池
│   │   ├── experiment.py        # 实验模型
│   │   └── portfolio.py         # 组合构建
│   └── storage/                 ← 已有
│       └── experiment_db.py     # 新增：Experiment 表
├── backend/
│   ├── main.py                  # 修改：注册新路由
│   ├── api/
│   │   ├── universes.py         # 新增
│   │   ├── features.py          # 新增
│   │   ├── events.py            # 新增
│   │   └── experiments.py       # 新增
│   └── services/
│       ├── universe_service.py  # 新增
│       ├── feature_service.py   # 新增
│       ├── event_service.py     # 新增
│       └── experiment_service.py # 新增
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # 修改：新增导航
│   │   ├── pages/
│   │   │   ├── DataCenter.tsx   ← 已有
│   │   │   ├── Universes.tsx    # 新增
│   │   │   ├── Features.tsx     # 新增
│   │   │   ├── Events.tsx       # 新增
│   │   │   └── Experiments.tsx  # 新增
│   │   ├── components/
│   │   │   ├── ui/              # shadcn/ui 基础组件
│   │   │   └── StockPicker.tsx  # 股票代码选择器
│   │   └── styles/
│   │       └── globals.css      # Tailwind 全局样式
│   ├── tailwind.config.ts       # 新增
│   ├── postcss.config.js        # 新增
│   └── package.json             # 修改：新增依赖
├── data/
│   ├── feature/                 # 新增：因子值 Parquet 存储
│   └── ...
└── pyproject.toml               # 修改：新增依赖
```

## 5. 核心模型

### 5.1 Universe 股票池

```python
@dataclass
class Universe:
    id: str                    # UUID
    name: str                  # "沪深300成分股"
    description: str           # 可选
    symbols: list[str]         # ["sh600519", "sz000001", ...]
    filters: list[str]         # ["exclude_st", "exclude_suspended"]
    created_at: str
    updated_at: str
```

### 5.2 Experiment 实验

```python
@dataclass
class Experiment:
    id: str                    # UUID
    name: str                  # "cn_momentum_20d_top50"
    description: str           # 可选
    universe_id: str           # 关联股票池
    factors: list[dict]        # [{"name": "momentum_20d", "params": {...}}]
    portfolio: dict            # {"method": "equal_weight", "top_n": 50}
    execution: dict            # {"rebalance": "monthly", "cost_rate": 0.001, "slippage": 0.001}
    data_version: str          # 数据版本追溯
    status: str                # "draft" | "running" | "completed" | "failed"
    result_path: str           # 回测结果路径 (MVP 3 填充)
    metrics: dict              # 摘要指标
    created_at: str
    updated_at: str
```

### 5.3 因子抽象接口

```python
class Factor(ABC):
    @abstractmethod
    def name(self) -> str: ...

    @abstractmethod
    def description(self) -> str: ...

    @abstractmethod
    def compute(self, bars: pd.DataFrame, params: dict = None) -> pd.DataFrame:
        """
        输入: 日线行情 DataFrame
        输出: 因子值 DataFrame (index=trade_date, columns=symbol, values=factor)
        """
        ...
```

### 5.4 事件标签

```python
@dataclass
class Event:
    event_id: str
    symbol: str
    market: str
    event_type: str            # "earnings" | "notice" | "dividend" | "suspension"
    event_date: str            # YYYY-MM-DD
    publish_time: str          # 发布时间
    title: str                 # 标题
    summary: str               # 摘要
    source: str                # 数据源
    metadata: dict             # 额外信息
```

## 6. API 设计

### 6.1 股票池 API

```
GET    /api/universes              # 股票池列表
POST   /api/universes              # 创建股票池
GET    /api/universes/{id}         # 股票池详情
PUT    /api/universes/{id}         # 更新股票池
DELETE /api/universes/{id}         # 删除股票池
GET    /api/universes/{id}/preview # 预览成分（应用过滤后）
```

### 6.2 因子 API

```
GET  /api/features/factors            # 内置因子列表
GET  /api/features/factors/{name}     # 因子详情
POST /api/features/calculate          # 运行因子计算
GET  /api/features/results/{calc_id}  # 计算结果
GET  /api/features/ic/{calc_id}       # IC 分析结果
GET  /api/features/quantile/{calc_id} # 分层收益
```

### 6.3 事件 API

```
GET  /api/events                   # 事件列表（支持过滤）
GET  /api/events/types             # 事件类型列表
GET  /api/events/{type}/stats      # 事件窗口统计
```

### 6.4 实验 API

```
GET    /api/experiments            # 实验列表
POST   /api/experiments            # 创建实验
GET    /api/experiments/{id}       # 实验详情
PUT    /api/experiments/{id}       # 更新实验
POST   /api/experiments/{id}/clone # 复制实验
POST   /api/experiments/{id}/run   # 运行实验
```

## 7. 数据流

```
用户创建股票池 (Web UI)
  │
  ▼
POST /api/universes → 存储到 SQLite
  │
  ▼
用户选择股票池 + 因子 + 时间范围
  │
  ▼
POST /api/features/calculate
  │
  ├── 从 Clean Zone 读取日线行情
  ├── 从 AkShare 拉取财务数据 (如需)
  ├── 执行因子计算
  ├── 因子值写入 Feature Zone (Parquet)
  ├── 计算 IC / 分层收益
  └── 返回分析结果
  │
  ▼
用户创建 Experiment
  │
  ▼
POST /api/experiments → 存储到 SQLite
  │
  ▼
关联股票池 + 因子 + 组合配置
  │
  ▼
后续回测 (MVP 3)
```

## 8. 前端页面设计

### 8.1 导航结构

```
FIA QUANT RESEARCH
├── 数据中心        (已有)
├── 股票池          (新增)
├── 因子与指标      (新增)
├── 事件库          (新增)
├── 实验管理        (新增)
├── 回测任务        (MVP 3)
└── 报表中心        (MVP 4)
```

### 8.2 股票池页面

- **列表模式**：卡片展示所有股票池（名称/股票数/创建时间/操作）
- **详情模式**：股票代码表格 + 过滤状态 + 编辑按钮
- **创建弹窗**：名称输入 → 搜索/选择股票代码 → 勾选过滤规则 → 保存

### 8.3 因子与指标页面

- **左侧**：因子分类树（技术/估值/质量/成长/动量/波动率/流动性）
- **右侧**：
  - 因子列表（名称/描述/计算状态）
  - 运行计算表单（选因子 + 选股票池 + 选时间范围 + 执行）
  - 分析结果面板（IC 曲线/分层收益表/分布图）

### 8.4 事件库页面

- 事件表格（日期/类型/股票/标题/摘要）
- 顶部过滤器（类型下拉框 + 日期范围 + 市场）
- 点击事件行展开详情

### 8.5 实验管理页面

- **列表**：表格展示实验（名称/股票池/因子/状态/创建时间/操作）
- **创建表单**：
  - Step 1: 基本信息（名称/描述）
  - Step 2: 选择股票池（下拉选择）
  - Step 3: 选择因子（多选，带参数配置）
  - Step 4: 组合构建（等权/市值加权/Top N）
  - Step 5: 执行参数（调仓频率/成本/滑点）
- **详情页**：展示完整配置 + 状态 + 结果链接（MVP 3 填充）

## 9. 前端技术实现

### 9.1 Tailwind CSS + shadcn/ui

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
# shadcn/ui 组件按需初始化
npx shadcn@latest add button dialog table select input tabs card badge
```

### 9.2 Tailwind 配置

```typescript
// tailwind.config.ts
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#0F766E', foreground: '#FFFFFF' },
        bullish: '#26A69A',
        bearish: '#EF5350',
      },
    },
  },
  plugins: [],
}
```

### 9.3 导航更新

```typescript
// App.tsx 更新导航
const tabs = [
  { id: 'datacenter', label: '数据中心' },
  { id: 'universes', label: '股票池' },
  { id: 'features', label: '因子与指标' },
  { id: 'events', label: '事件库' },
  { id: 'experiments', label: '实验管理' },
]
```

## 10. 新增依赖

### Python

```toml
dependencies = [
    # ... 已有
    "scipy>=1.10",       # IC 计算 (spearmanr)
]
```

### Node.js

```json
"devDependencies": {
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    // shadcn/ui 依赖
    "@radix-ui/react-dialog": "^1.0.0",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-tabs": "^1.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "lucide-react": "^0.300.0"
},
"dependencies": {
    "echarts": "^5.4.3",
    "echarts-for-react": "^3.0.2"
}
```

## 11. 数据库变更

### experiment 表

```sql
CREATE TABLE experiments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    universe_id TEXT NOT NULL,
    factors TEXT NOT NULL,        -- JSON
    portfolio TEXT NOT NULL,      -- JSON
    execution TEXT NOT NULL,      -- JSON
    data_version TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    result_path TEXT,
    metrics TEXT,                 -- JSON
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (universe_id) REFERENCES universes(id)
);
```

### universes 表

```sql
CREATE TABLE universes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    symbols TEXT NOT NULL,        -- JSON
    filters TEXT NOT NULL DEFAULT '[]',  -- JSON
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
```

### events 表

```sql
CREATE TABLE events (
    event_id TEXT PRIMARY KEY,
    symbol TEXT NOT NULL,
    market TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_date TEXT NOT NULL,
    publish_time TEXT,
    title TEXT,
    summary TEXT,
    source TEXT,
    metadata TEXT,               -- JSON
    created_at TEXT NOT NULL
);
```

## 12. 验收标准

MVP 2 完成时，用户应能完成以下流程：

```
创建股票池 (手动选代码 + 过滤ST/停牌)
  │
  运行因子计算 (选择因子 + 股票池 + 时间范围)
  │
  查看因子分析 (IC / 分层收益 / 分布)
  │
  创建 Experiment (表单配置)
  │
  保存实验记录 (可追溯配置和数据版本)
  │
  查看实验列表 (状态/配置摘要)
```
