# MVP 3 回测引擎 — 设计文档

日期：2026-06-07
状态：用户已批准

## 1. 项目定位

在 MVP 2 研究闭环基础上，构建完整回测能力：组合级 + 信号级 + 事件级回测，支持日/周/月/事件触发四种调仓频率，A股/港股差异化交易成本模型，完整绩效指标与可视化。

## 2. 范围

### 2.1 包含

- **组合级回测** — 因子选股、指数增强、行业轮动（Top N / 等权 / 市值加权）
- **信号级回测** — 技术指标买卖点验证（金叉/死叉/突破/超买超卖）
- **事件级回测** — 事件窗口收益分析（财报/分红/停复牌）
- **执行频率模型** — daily / weekly / monthly / event
- **交易成本模型** — A股/港股差异化费率（佣金/印花税/滑点/过户费）
- **回测结果对象** — 净值曲线/基准曲线/回撤曲线/持仓/交易/绩效指标
- **绩效指标** — 累计/年化收益/夏普/卡玛/最大回撤/胜率/盈亏比/换手率/超额收益
- **回测任务 API** — 提交/查询/删除 + 结果查询（净值/持仓/交易/指标）
- **回测 Web UI** — 列表/创建/详情页

### 2.2 排除

- 实盘交易（设计文档明确排除）
- 自动下单
- 分钟级回测
- 多资产跨市场组合
- 行业/风格中性约束
- Barra 风险模型
- 动态调仓优化

## 3. 技术栈

| 层 | 技术 |
|----|------|
| Python | pandas + numpy (向量化计算) |
| 存储 | Parquet (回测结果) + SQLite (任务元数据) |
| 后端 | FastAPI + Pydantic |
| 前端 | React + TS + Tailwind + ECharts (净值/回撤曲线) |

## 4. 目录结构

```
quant_core/
├── backtest/
│   ├── __init__.py
│   ├── engine.py              # BacktestEngine 基类
│   ├── portfolio.py           # 组合级回测
│   ├── signal.py              # 信号级回测
│   ├── event.py               # 事件级回测
│   ├── cost.py                # 交易成本模型
│   ├── execution.py           # 执行频率模型
│   ├── result.py              # 回测结果模型
│   ├── metrics.py             # 绩效指标
│   └── portfolio_builder.py   # 组合构建
├── storage/
│   └── experiment_db.py       # 新增 backtests 表
backend/
├── api/
│   └── backtests.py           # /api/backtests/*
└── services/
    └── backtest_service.py    # 回测任务管理
frontend/
└── src/pages/
    └── Backtests.tsx          # 回测页面
```

## 5. 核心模型

### 5.1 回测请求

```python
class BacktestRequest:
    name: str
    experiment_id: str          # 从 Experiment 继承配置
    backtest_type: str          # "portfolio" | "signal" | "event"
    start_date: str             # "YYYY-MM-DD"
    end_date: str
    initial_capital: float      # 100000
    benchmark: str              # "sh000300"
    rebalance_freq: str         # "daily" | "weekly" | "monthly" | "event"
    cost_model: dict            # {commission, stamp_tax, slippage, transfer_fee}
    # 组合级参数
    top_n: int                  # Top N 持仓
    weight_method: str          # "equal" | "market_cap" | "factor_weight"
    # 信号级参数
    entry_signal: str           # "golden_cross" | "boll_lower" | "rsi_oversold"
    exit_signal: str            # "death_cross" | "boll_upper" | "rsi_overbought"
    holding_period: int         # 固定持有天数 (0=按信号)
    # 事件级参数
    event_type: str             # "earnings" | "dividend" | "suspension"
    event_window: tuple         # (-5, 10)
```

### 5.2 回测结果

```python
class BacktestResult:
    id: str
    name: str
    backtest_type: str
    status: str                 # "running" | "completed" | "failed"
    start_date: str
    end_date: str
    initial_capital: float
    final_capital: float
    benchmark: str
    metrics: dict               # 所有绩效指标
    equity_curve: list[dict]    # [{date, value, benchmark}]
    drawdown_curve: list[dict]  # [{date, dd}]
    positions: list[dict]       # [{date, symbol, weight, shares}]
    trades: list[dict]          # [{date, symbol, action, price, shares, cost}]
    created_at: str
    finished_at: str
```

### 5.3 交易成本模型

```python
class CostModel:
    CN = {commission_buy=0.0003, commission_sell=0.0003, stamp_tax=0.0005, slippage=0.001, transfer_fee=0.00001}
    HK = {commission_buy=0.0003, commission_sell=0.0003, stamp_tax=0.0013, slippage=0.001, transfer_fee=0.00002}
```

## 6. 数据流

```
Experiment 配置 (MVP 2)
  │
  ▼
提交回测请求 → 创建任务 (running)
  │
  ▼
BacktestEngine 执行
  ├── 加载日线数据 (Clean Zone)
  ├── 计算因子/信号
  ├── 按频率调仓
  ├── 应用成本模型
  ├── 记录持仓/交易
  └── 计算绩效指标
  │
  ▼
保存结果 → SQLite (元数据) + Parquet (曲线/持仓/交易)
  │
  ▼
状态更新 (completed)
```

## 7. 验收标准

```
选择实验 → 选择回测类型 → 设置参数 → 运行
  │
  ▼
等待完成 → 查看净值曲线 (策略 vs 基准)
  │
  ▼
查看绩效指标 (夏普/最大回撤/胜率等)
  │
  ▼
查看交易明细 + 持仓变化
```
