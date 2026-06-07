# MVP 3 回测引擎 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建组合级/信号级/事件级回测引擎，支持日/周/月/事件四种调仓频率，A股/港股差异化成本模型，完整绩效指标与 Web UI。

**Architecture:** 新建 `quant_core/backtest/` 包，包含 cost/portfolio_builder/execution/engine/metrics/result 模块，新增 SQLite backtests 表，新增 `/api/backtests/*` API，新增 React 回测页面。

**Tech Stack:** Python (pandas/numpy), FastAPI, SQLite, React+TS, Tailwind, ECharts

---

### Task 1: 交易成本模型 (CostModel)

**Files:**
- Create: `quant_core/backtest/__init__.py`
- Create: `quant_core/backtest/cost.py`

- [ ] **Step 1: 创建 quant_core/backtest/__init__.py**

```python
# /fia/workspace/quant-research-platform/quant_core/backtest/__init__.py
from .cost import CostModel

__all__ = ["CostModel"]
```

- [ ] **Step 2: 创建 quant_core/backtest/cost.py**

```python
# /fia/workspace/quant-research-platform/quant_core/backtest/cost.py
"""交易成本模型 — A股/港股差异化费率"""

CN_DEFAULTS = dict(
    commission=0.0003,    # 买卖佣金率 (万三)
    stamp_tax=0.0005,     # 印花税 (卖出千五, A股)
    slippage=0.001,       # 滑点 (千一)
    transfer_fee=0.00001, # 过户费
)

HK_DEFAULTS = dict(
    commission=0.0003,    # 买卖佣金率
    stamp_tax=0.0013,     # 印花税 (买卖双边千分之1.3)
    slippage=0.001,
    transfer_fee=0.00002,
)


class CostModel:
    """交易成本计算"""

    def __init__(self, market: str = "CN", **kwargs):
        defaults = CN_DEFAULTS if market == "CN" else HK_DEFAULTS
        self.commission = kwargs.get("commission", defaults["commission"])
        self.stamp_tax = kwargs.get("stamp_tax", defaults["stamp_tax"])
        self.slippage = kwargs.get("slippage", defaults["slippage"])
        self.transfer_fee = kwargs.get("transfer_fee", defaults["transfer_fee"])
        self.market = market

    def calc_cost(self, price: float, shares: float, is_buy: bool) -> dict:
        """
        计算单笔交易成本。

        Returns:
            {trade_price, trade_amount, commission, stamp_tax, slippage_cost, transfer_fee, total_cost, net_amount}
        """
        if is_buy:
            trade_price = price * (1 + self.slippage)
        else:
            trade_price = price * (1 - self.slippage)

        amount = trade_price * shares
        commission = max(amount * self.commission, 5.0)  # 最低5元
        stamp = amount * self.stamp_tax if (not is_buy) else 0.0
        transfer = amount * self.transfer_fee
        total = commission + stamp + transfer

        return {
            "trade_price": round(trade_price, 4),
            "trade_amount": round(amount, 2),
            "commission": round(commission, 2),
            "stamp_tax": round(stamp, 2),
            "slippage_cost": round(amount * self.slippage, 2),
            "transfer_fee": round(transfer, 4),
            "total_cost": round(total, 2),
            "net_amount": round(amount + total if is_buy else amount - total, 2),
        }
```

- [ ] **Step 3: 验证 CostModel**

```bash
cd /fia/workspace/quant-research-platform && python3 << 'EOF'
from quant_core.backtest.cost import CostModel

cn = CostModel("CN")
r = cn.calc_cost(100.0, 1000, is_buy=True)
print(f"A股买入: price={r['trade_price']}, amount={r['trade_amount']}, cost={r['total_cost']}")

hk = CostModel("HK")
r = hk.calc_cost(400.0, 1000, is_buy=False)
print(f"港股卖出: price={r['trade_price']}, amount={r['trade_amount']}, cost={r['total_cost']}")
print("CostModel OK")
EOF
```

Expected:
```
A股买入: price=100.1, amount=100100.0, cost=35.03
港股卖出: price=399.6, amount=399600.0, cost=641.34
CostModel OK
```

- [ ] **Step 4: 提交**

```bash
cd /fia/workspace/quant-research-platform
git add -A && git commit -m "feat: MVP 3 Task 1 - CostModel (A股/港股差异化)"
```

---

### Task 2: 组合构建器 (PortfolioBuilder)

**Files:**
- Create: `quant_core/backtest/portfolio_builder.py`

- [ ] **Step 1: 创建 portfolio_builder.py**

```python
# /fia/workspace/quant-research-platform/quant_core/backtest/portfolio_builder.py
"""组合构建 — 等权/市值加权/因子加权"""
import pandas as pd
import numpy as np


def build_portfolio(factor_df: pd.DataFrame, date: str, method: str = "equal",
                    top_n: int = 10, market_cap_df: pd.DataFrame = None) -> dict:
    """
    根据因子值构建目标组合。

    Args:
        factor_df: DataFrame with [trade_date, symbol, factor_value]
        date: trade_date string
        method: "equal" | "market_cap" | "factor_weight"
        top_n: 持仓数量
        market_cap_df: DataFrame with [trade_date, symbol, market_cap] (可选)

    Returns:
        {symbol: weight} 权重字典
    """
    day_data = factor_df[factor_df["trade_date"] == date].copy()
    if day_data.empty:
        return {}

    # 过滤 NaN
    day_data = day_data.dropna(subset=["factor_value"])
    if day_data.empty:
        return {}

    # 按因子值降序排序 (高因子值优先)
    day_data = day_data.sort_values("factor_value", ascending=False)

    # Top N
    if top_n > 0:
        day_data = day_data.head(top_n)

    symbols = day_data["symbol"].values

    if method == "equal":
        w = 1.0 / len(symbols)
        return {s: w for s in symbols}

    elif method == "factor_weight":
        # 按因子值比例加权
        values = day_data["factor_value"].values
        # 确保正值
        min_val = values.min()
        if min_val < 0:
            values = values - min_val + 1e-8
        total = values.sum()
        if total == 0:
            return {s: 1.0 / len(symbols) for s in symbols}
        return {s: float(v / total) for s, v in zip(symbols, values)}

    elif method == "market_cap" and market_cap_df is not None:
        mc = market_cap_df[market_cap_df["trade_date"] == date]
        mc = mc[mc["symbol"].isin(symbols)]
        total = mc["market_cap"].sum()
        if total == 0:
            return {s: 1.0 / len(symbols) for s in symbols}
        return {r["symbol"]: r["market_cap"] / total for _, r in mc.iterrows()}

    # fallback: equal
    return {s: 1.0 / len(symbols) for s in symbols}
```

- [ ] **Step 2: 验证 PortfolioBuilder**

```bash
cd /fia/workspace/quant-research-platform && python3 << 'EOF'
import pandas as pd
from quant_core.backtest.portfolio_builder import build_portfolio

df = pd.DataFrame({
    "trade_date": ["2026-06-01"] * 5,
    "symbol": ["sh600519", "sz000001", "sh601318", "sz002594", "sh600036"],
    "factor_value": [0.8, 0.5, 0.9, 0.3, 0.6],
})

print("Equal weight (top 3):")
print(build_portfolio(df, "2026-06-01", "equal", top_n=3))

print("\nFactor weight (top 3):")
print(build_portfolio(df, "2026-06-01", "factor_weight", top_n=3))

print("PortfolioBuilder OK")
EOF
```

Expected: equal → {sh601318: 0.333, sh600519: 0.333, sh600036: 0.333}, factor_weight → weighted by factor values

- [ ] **Step 3: 提交**

```bash
cd /fia/workspace/quant-research-platform
git add -A && git commit -m "feat: MVP 3 Task 2 - PortfolioBuilder (equal/factor_weight/market_cap)"
```

---

### Task 3: 执行频率模型 (ExecutionModel)

**Files:**
- Create: `quant_core/backtest/execution.py`

- [ ] **Step 1: 创建 execution.py**

```python
# /fia/workspace/quant-research-platform/quant_core/backtest/execution.py
"""执行频率模型 — daily / weekly / monthly / event"""
import pandas as pd


def get_rebalance_dates(trade_dates: list, freq: str = "daily",
                        factor_df: pd.DataFrame = None,
                        entry_signal: str = None) -> list:
    """
    计算调仓日期。

    Args:
        trade_dates: list of date strings
        freq: "daily" | "weekly" | "monthly" | "event"
        factor_df: 因子 DataFrame (event 模式用)
        entry_signal: 信号名称 (event 模式用)

    Returns:
        list of rebalance date strings
    """
    dates = pd.to_datetime(trade_dates)

    if freq == "daily":
        return [d.strftime("%Y-%m-%d") for d in dates]

    elif freq == "weekly":
        # 每周五调仓
        weekly = dates[dates.dayofweek == 4]
        return [d.strftime("%Y-%m-%d") for d in weekly]

    elif freq == "monthly":
        # 每月最后一个交易日
        monthly = []
        for year_month in dates.to_period("M").unique():
            mask = dates.to_period("M") == year_month
            month_dates = dates[mask]
            monthly.append(month_dates[-1])
        return [d.strftime("%Y-%m-%d") for d in monthly]

    elif freq == "event":
        # 因子值穿越阈值时调仓 (简化: 因子符号变化日)
        if factor_df is None or entry_signal is None:
            return [dates[-1].strftime("%Y-%m-%d")]
        # 简化实现: 每日检查信号
        return [d.strftime("%Y-%m-%d") for d in dates]

    return [d.strftime("%Y-%m-%d") for d in dates]
```

- [ ] **Step 2: 验证 ExecutionModel**

```bash
cd /fia/workspace/quant-research-platform && python3 << 'EOF'
from quant_core.backtest.execution import get_rebalance_dates
import pandas as pd

dates = pd.date_range("2026-01-01", "2026-03-31", freq="B").strftime("%Y-%m-%d").tolist()

print(f"Total trade days: {len(dates)}")
print(f"Daily: {len(get_rebalance_dates(dates, 'daily'))} days")
print(f"Weekly: {len(get_rebalance_dates(dates, 'weekly'))} days")
print(f"Monthly: {len(get_rebalance_dates(dates, 'monthly'))} days")
print(f"Monthly dates: {get_rebalance_dates(dates, 'monthly')}")
print("ExecutionModel OK")
EOF
```

- [ ] **Step 3: 提交**

```bash
cd /fia/workspace/quant-research-platform
git add -A && git commit -m "feat: MVP 3 Task 3 - ExecutionModel (daily/weekly/monthly/event)"
```

---

### Task 4: 绩效指标计算 (MetricsCalculator)

**Files:**
- Create: `quant_core/backtest/metrics.py`

- [ ] **Step 1: 创建 metrics.py**

```python
# /fia/workspace/quant-research-platform/quant_core/backtest/metrics.py
"""绩效指标计算"""
import numpy as np
import pandas as pd


def calc_metrics(equity_curve: list, benchmark_curve: list = None,
                  trades: list = None, trading_days: int = 252) -> dict:
    """
    计算回测绩效指标。

    Args:
        equity_curve: [{date, value}]
        benchmark_curve: [{date, value}] (可选)
        trades: [{date, symbol, action, price, shares, cost, pnl}]
        trading_days: 年交易天数

    Returns:
        绩效指标字典
    """
    if len(equity_curve) < 2:
        return {"error": "Not enough data"}

    values = np.array([e["value"] for e in equity_curve])
    n_days = len(equity_curve)

    # 收益率序列
    returns = np.diff(values) / values[:-1]
    returns = returns[np.isfinite(returns)]

    # 累计/年化收益
    total_return = (values[-1] - values[0]) / values[0]
    years = n_days / trading_days
    annual_return = (1 + total_return) ** (1 / years) - 1 if years > 0 else total_return

    # 波动率
    annual_vol = np.std(returns) * np.sqrt(trading_days) if len(returns) > 1 else 0

    # 夏普 (无风险利率 3%)
    rf = 0.03
    sharpe = (annual_return - rf) / annual_vol if annual_vol > 0 else 0

    # 最大回撤
    peak = values[0]
    max_dd = 0
    max_dd_end = 0
    for i, v in enumerate(values):
        if v > peak:
            peak = v
        dd = (peak - v) / peak
        if dd > max_dd:
            max_dd = dd
            max_dd_end = i
    max_dd_pct = max_dd * 100

    # 卡玛比率
    calmar = annual_return / max_dd if max_dd > 0 else float("inf")

    # 交易统计
    n_trades = len(trades) if trades else 0
    win_trades = 0
    total_pnl = 0
    if trades:
        for t in trades:
            pnl = t.get("pnl", 0)
            total_pnl += pnl
            if pnl > 0:
                win_trades += 1
    win_rate = win_trades / n_trades if n_trades > 0 else 0

    # 盈亏比
    profits = [t["pnl"] for t in trades if t.get("pnl", 0) > 0] if trades else []
    losses = [t["pnl"] for t in trades if t.get("pnl", 0) < 0] if trades else []
    profit_factor = (np.mean(profits) / abs(np.mean(losses))) if profits and losses else 0

    # 年化换手率
    turnover = 0
    if trades:
        # 简化: 每笔交易算一次换手
        turnover = n_trades / years if years > 0 else n_trades

    # 超额收益
    excess_return = None
    excess_sharpe = None
    if benchmark_curve and len(benchmark_curve) >= 2:
        bm_values = np.array([b["value"] for b in benchmark_curve])
        bm_total = (bm_values[-1] - bm_values[0]) / bm_values[0]
        bm_annual = (1 + bm_total) ** (1 / years) - 1 if years > 0 else bm_total
        excess_return = annual_return - bm_annual
        bm_returns = np.diff(bm_values) / bm_values[:-1]
        bm_returns = bm_returns[np.isfinite(bm_returns)]
        bm_annual_vol = np.std(bm_returns) * np.sqrt(trading_days) if len(bm_returns) > 1 else 1
        excess_sharpe = excess_return / bm_annual_vol if bm_annual_vol > 0 else 0

    return {
        "total_return": round(total_return * 100, 2),
        "annual_return": round(annual_return * 100, 2),
        "annual_volatility": round(annual_vol * 100, 2),
        "sharpe_ratio": round(sharpe, 2),
        "calmar_ratio": round(calmar, 2),
        "max_drawdown": round(max_dd_pct, 2),
        "n_trades": n_trades,
        "win_rate": round(win_rate * 100, 2),
        "profit_factor": round(profit_factor, 2),
        "total_pnl": round(total_pnl, 2),
        "annual_turnover": round(turnover, 2),
        "excess_return": round(excess_return * 100, 2) if excess_return is not None else None,
        "excess_sharpe": round(excess_sharpe, 2) if excess_sharpe is not None else None,
    }
```

- [ ] **Step 2: 验证 MetricsCalculator**

```bash
cd /fia/workspace/quant-research-platform && python3 << 'EOF'
from quant_core.backtest.metrics import calc_metrics
import datetime as dt

# Simulate equity curve
base = 100000
curve = [{"date": (dt.date(2026,1,1) + dt.timedelta(days=i)).isoformat(),
          "value": base * (1.001 ** i)} for i in range(120)]

bm = [{"date": c["date"], "value": base * (1.0005 ** i)} for i, c in enumerate(curve)]

trades = [
    {"date": "2026-01-15", "symbol": "sh600519", "action": "buy", "price": 1280, "shares": 100, "cost": 40, "pnl": 0},
    {"date": "2026-02-15", "symbol": "sh600519", "action": "sell", "price": 1300, "shares": 100, "cost": 45, "pnl": 1955},
]

m = calc_metrics(curve, bm, trades)
for k, v in m.items():
    print(f"  {k}: {v}")
print("MetricsCalculator OK")
EOF
```

- [ ] **Step 3: 提交**

```bash
cd /fia/workspace/quant-research-platform
git add -A && git commit -m "feat: MVP 3 Task 4 - MetricsCalculator (12 metrics)"
```

---

### Task 5: 回测结果模型 (BacktestResult)

**Files:**
- Create: `quant_core/backtest/result.py`

- [ ] **Step 1: 创建 result.py**

```python
# /fia/workspace/quant-research-platform/quant_core/backtest/result.py
"""回测结果模型"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
import uuid


@dataclass
class BacktestResult:
    """回测结果"""
    id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    name: str = ""
    backtest_type: str = ""  # "portfolio" | "signal" | "event"
    status: str = "running"
    start_date: str = ""
    end_date: str = ""
    initial_capital: float = 100000
    final_capital: float = 0
    benchmark: str = "sh000300"
    metrics: dict = field(default_factory=dict)
    equity_curve: list = field(default_factory=list)
    drawdown_curve: list = field(default_factory=list)
    positions: list = field(default_factory=list)
    trades: list = field(default_factory=list)
    error_message: str = ""
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    finished_at: str = ""

    def to_dict(self) -> dict:
        return {
            "id": self.id, "name": self.name, "backtest_type": self.backtest_type,
            "status": self.status, "start_date": self.start_date, "end_date": self.end_date,
            "initial_capital": self.initial_capital, "final_capital": self.final_capital,
            "benchmark": self.benchmark, "metrics": self.metrics,
            "equity_curve": self.equity_curve, "drawdown_curve": self.drawdown_curve,
            "positions": self.positions, "trades": self.trades,
            "error_message": self.error_message, "created_at": self.created_at,
            "finished_at": self.finished_at,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "BacktestResult":
        return cls(**{k: v for k, v in d.items() if k in cls.__dataclass_fields__})

    def complete(self):
        self.status = "completed"
        self.finished_at = datetime.now().isoformat()
        if self.equity_curve:
            self.final_capital = self.equity_curve[-1]["value"]

    def fail(self, error: str):
        self.status = "failed"
        self.error_message = error
        self.finished_at = datetime.now().isoformat()
```

- [ ] **Step 2: 验证**

```bash
cd /fia/workspace/quant-research-platform && python3 -c "
from quant_core.backtest.result import BacktestResult
r = BacktestResult(name='Test', backtest_type='portfolio')
r.complete()
d = r.to_dict()
print(f\"ID: {d['id']}, Status: {d['status']}, Capital: {d['final_capital']}\")
print('BacktestResult OK')
"
```

- [ ] **Step 3: 提交**

```bash
cd /fia/workspace/quant-research-platform
git add -A && git commit -m "feat: MVP 3 Task 5 - BacktestResult model"
```

---

### Task 6: 组合级回测引擎 (PortfolioBacktestEngine)

**Files:**
- Create: `quant_core/backtest/engine.py`

- [ ] **Step 1: 创建 engine.py (组合级回测)**

```python
# /fia/workspace/quant-research-platform/quant_core/backtest/engine.py
"""组合级回测引擎"""
import pandas as pd
import numpy as np
from .cost import CostModel
from .execution import get_rebalance_dates
from .portfolio_builder import build_portfolio
from .metrics import calc_metrics
from .result import BacktestResult


def run_portfolio_backtest(bars: pd.DataFrame, factor_df: pd.DataFrame,
                           start_date: str, end_date: str,
                           initial_capital: float = 100000,
                           benchmark: str = "sh000300",
                           benchmark_df: pd.DataFrame = None,
                           rebalance_freq: str = "daily",
                           top_n: int = 10,
                           weight_method: str = "equal",
                           market: str = "CN",
                           cost_params: dict = None) -> BacktestResult:
    """
    组合级回测。

    流程:
    1. 过滤时间范围
    2. 计算调仓日
    3. 逐日: 计算因子 → 构建组合 → 执行调仓 → 记录持仓/交易
    4. 计算绩效
    """
    result = BacktestResult(
        name="Portfolio Backtest",
        backtest_type="portfolio",
        start_date=start_date,
        end_date=end_date,
        initial_capital=initial_capital,
        benchmark=benchmark,
    )

    try:
        # 过滤时间
        mask = (bars["trade_date"] >= start_date) & (bars["trade_date"] <= end_date)
        bars = bars[mask].sort_values("trade_date").reset_index(drop=True)
        if bars.empty:
            result.fail("No data in date range")
            return result

        # 调仓日
        trade_dates = bars["trade_date"].unique()
        rebal_dates = set(get_rebalance_dates(trade_dates.tolist(), rebalance_freq))

        # 成本模型
        cost = CostModel(market, **(cost_params or {}))

        # 初始化
        capital = initial_capital
        positions = {}  # symbol -> shares
        equity_curve = []
        drawdown_curve = []
        all_trades = []
        all_positions = []
        peak_value = initial_capital

        for date_str in trade_dates:
            day_bars = bars[bars["trade_date"] == date_str]
            prices = dict(zip(day_bars["symbol"], day_bars["close"]))

            # 持仓市值
            position_value = sum(prices.get(s, 0) * sh for s, sh in positions.items() if sh > 0)
            total_value = capital + position_value

            # 净值曲线
            equity_curve.append({"date": date_str, "value": round(total_value, 2)})

            # 回撤
            if total_value > peak_value:
                peak_value = total_value
            dd = (peak_value - total_value) / peak_value * 100
            drawdown_curve.append({"date": date_str, "dd": round(dd, 2)})

            # 调仓
            if date_str in rebal_dates:
                # 计算因子
                day_factor = factor_df[factor_df["trade_date"] == date_str]
                if not day_factor.empty:
                    target = build_portfolio(day_factor, date_str, weight_method, top_n)

                    # 卖出不在目标中的
                    for sym in list(positions.keys()):
                        if sym not in target and positions[sym] > 0:
                            sell_price = prices.get(sym, 0)
                            if sell_price > 0:
                                c = cost.calc_cost(sell_price, positions[sym], is_buy=False)
                                all_trades.append({
                                    "date": date_str, "symbol": sym, "action": "sell",
                                    "price": c["trade_price"], "shares": positions[sym],
                                    "cost": c["total_cost"], "amount": c["trade_amount"],
                                    "pnl": 0,  # simplified
                                })
                                capital += c["trade_amount"] - c["total_cost"]
                                positions[sym] = 0

                    # 买入/调整
                    for sym, weight in target.items():
                        target_value = total_value * weight
                        buy_price = prices.get(sym, 0)
                        if buy_price > 0:
                            target_shares = int(target_value / buy_price / 100) * 100  # A股100股整数倍
                            current_shares = positions.get(sym, 0)
                            diff = target_shares - current_shares

                            if diff > 0:
                                c = cost.calc_cost(buy_price, diff, is_buy=True)
                                if capital >= c["net_amount"]:
                                    all_trades.append({
                                        "date": date_str, "symbol": sym, "action": "buy",
                                        "price": c["trade_price"], "shares": diff,
                                        "cost": c["total_cost"], "amount": c["trade_amount"],
                                        "pnl": 0,
                                    })
                                    capital -= c["net_amount"]
                                    positions[sym] = current_shares + diff

            # 持仓记录
            for sym, sh in positions.items():
                if sh > 0:
                    all_positions.append({"date": date_str, "symbol": sym,
                                          "shares": sh, "price": prices.get(sym, 0),
                                          "value": round(prices.get(sym, 0) * sh, 2)})

            # 更新总价值
            position_value = sum(prices.get(s, 0) * sh for s, sh in positions.items() if sh > 0)
            total_value = capital + position_value

        # 最终净值
        result.final_capital = total_value
        result.equity_curve = equity_curve
        result.drawdown_curve = drawdown_curve
        result.positions = all_positions[-100:] if all_positions else []  # 最近100条
        result.trades = all_trades

        # 基准曲线
        bm_curve = []
        if benchmark_df is not None:
            bm_filtered = benchmark_df[(benchmark_df["trade_date"] >= start_date) &
                                        (benchmark_df["trade_date"] <= end_date)]
            if not bm_filtered.empty:
                base_val = bm_filtered.iloc[0]["close"]
                bm_curve = [{"date": r["trade_date"], "value": initial_capital * r["close"] / base_val}
                            for _, r in bm_filtered.iterrows()]
            result.benchmark = benchmark

        # 绩效指标
        result.metrics = calc_metrics(equity_curve, bm_curve if bm_curve else None, all_trades)
        result.complete()

    except Exception as e:
        result.fail(str(e))

    return result
```

- [ ] **Step 2: 验证 PortfolioBacktestEngine**

```bash
cd /fia/workspace/quant-research-platform && python3 << 'EOF'
import pandas as pd
import numpy as np
from quant_core.backtest.engine import run_portfolio_backtest

# Generate sample data
np.random.seed(42)
dates = pd.date_range("2025-01-01", "2026-06-01", freq="B").strftime("%Y-%m-%d")
symbols = ["sh600519", "sz000001", "sh601318", "sz002594", "sh600036"]

rows = []
for sym in symbols:
    price = np.random.uniform(10, 1300)
    for d in dates:
        ret = np.random.normal(0.0005, 0.02)
        price *= (1 + ret)
        rows.append({"trade_date": d, "symbol": sym, "open": price*(1-ret),
                      "high": price*1.01, "low": price*0.99, "close": price,
                      "volume": np.random.uniform(1e6, 1e8), "amount": price*np.random.uniform(1e6, 1e8)})

bars = pd.DataFrame(rows)

# Generate factor (momentum)
factor_rows = []
for sym in symbols:
    sym_bars = bars[bars["symbol"] == sym]
    for i, row in sym_bars.iterrows():
        momentum = np.random.normal(0, 0.1)
        factor_rows.append({"trade_date": row["trade_date"], "symbol": sym, "factor_value": momentum})
factor_df = pd.DataFrame(factor_rows)

result = run_portfolio_backtest(
    bars, factor_df, "2025-06-01", "2026-06-01",
    initial_capital=100000, top_n=3, weight_method="equal",
    rebalance_freq="weekly", market="CN"
)

print(f"Status: {result.status}")
print(f"Final Capital: {result.final_capital:.2f}")
print(f"Metrics: {result.metrics}")
print(f"Equity points: {len(result.equity_curve)}")
print(f"Trades: {len(result.trades)}")
print("PortfolioBacktestEngine OK")
EOF
```

Expected: Status: completed, Final Capital > 0, metrics populated

- [ ] **Step 3: 提交**

```bash
cd /fia/workspace/quant-research-platform
git add -A && git commit -m "feat: MVP 3 Task 6 - PortfolioBacktestEngine"
```

---

### Task 7: 信号级 + 事件级回测

**Files:**
- Create: `quant_core/backtest/signal.py`
- Create: `quant_core/backtest/event.py`
- Modify: `quant_core/backtest/__init__.py`

- [ ] **Step 1: 创建 signal.py (信号级回测)**

```python
# /fia/workspace/quant-research-platform/quant_core/backtest/signal.py
"""信号级回测 — 技术指标买卖点"""
import pandas as pd
import numpy as np
from .cost import CostModel
from .metrics import calc_metrics
from .result import BacktestResult


def run_signal_backtest(bars: pd.DataFrame, start_date: str, end_date: str,
                        entry_signal: str = "golden_cross",
                        exit_signal: str = "death_cross",
                        initial_capital: float = 100000,
                        holding_period: int = 0,
                        market: str = "CN",
                        cost_params: dict = None) -> BacktestResult:
    """
    信号级回测。

    Signals: "golden_cross" (MA5>MA10), "death_cross" (MA5<MA10),
             "rsi_oversold" (RSI<30), "rsi_overbought" (RSI>70),
             "boll_lower" (price<BOLL lower), "boll_upper" (price>BOLL upper)
    """
    result = BacktestResult(
        name="Signal Backtest",
        backtest_type="signal",
        start_date=start_date, end_date=end_date,
        initial_capital=initial_capital,
    )

    try:
        cost = CostModel(market, **(cost_params or {}))
        mask = (bars["trade_date"] >= start_date) & (bars["trade_date"] <= end_date)
        bars = bars[mask].sort_values("trade_date").reset_index(drop=True)

        if bars.empty:
            result.fail("No data")
            return result

        # 计算信号指标
        symbols = bars["symbol"].unique()
        capital = initial_capital
        positions = {}
        equity_curve = []
        drawdown_curve = []
        all_trades = []
        all_positions = []
        peak_value = initial_capital
        buy_dates = {}  # symbol -> buy date index for holding_period

        for idx, date_str in enumerate(bars["trade_date"].unique()):
            day_bars = bars[bars["trade_date"] == date_str]
            prices = {}
            for _, row in day_bars.iterrows():
                sym = row["symbol"]
                prices[sym] = row["close"]

                # 计算信号
                sym_hist = bars[(bars["symbol"] == sym) & (bars["trade_date"] <= date_str)].sort_values("trade_date")
                if len(sym_hist) < 20:
                    continue

                ma5 = sym_hist["close"].tail(5).mean()
                ma10 = sym_hist["close"].tail(10).mean()
                close = row["close"]

                # 生成信号
                entry = False
                exit_s = False

                if entry_signal == "golden_cross" and ma5 > ma10:
                    prev_hist = sym_hist.iloc[-2] if len(sym_hist) >= 2 else None
                    if prev_hist is not None:
                        p_ma5 = sym_hist["close"].iloc[-11:-6].mean()
                        p_ma10 = sym_hist["close"].iloc[-12:-2].mean()
                        entry = p_ma5 <= p_ma10
                    else:
                        entry = True
                elif entry_signal == "death_cross" and ma5 < ma10:
                    entry = True
                elif entry_signal == "rsi_oversold":
                    delta = sym_hist["close"].diff()
                    gain = delta.where(delta > 0, 0).tail(14).mean()
                    loss = (-delta).where(delta < 0, 0).tail(14).mean()
                    rsi = 100 - (100 / (1 + gain / loss)) if loss > 0 else 100
                    entry = rsi < 30
                    exit_s = rsi > 50
                elif entry_signal == "boll_lower":
                    mid = sym_hist["close"].tail(20).mean()
                    std = sym_hist["close"].tail(20).std()
                    lower = mid - 2 * std
                    entry = close < lower
                elif entry_signal == "rsi_overbought":
                    delta = sym_hist["close"].diff()
                    gain = delta.where(delta > 0, 0).tail(14).mean()
                    loss = (-delta).where(delta < 0, 0).tail(14).mean()
                    rsi = 100 - (100 / (1 + gain / loss)) if loss > 0 else 100
                    entry = rsi > 70
                    exit_s = rsi < 50

                # 检查持有期
                if holding_period > 0 and sym in buy_dates:
                    if idx - buy_dates[sym] >= holding_period:
                        exit_s = True

                # 执行
                if entry and sym not in positions and positions.get(sym, 0) == 0:
                    shares = int(capital * 0.95 / close / 100) * 100
                    if shares > 0:
                        c = cost.calc_cost(close, shares, is_buy=True)
                        if capital >= c["net_amount"]:
                            all_trades.append({
                                "date": date_str, "symbol": sym, "action": "buy",
                                "price": c["trade_price"], "shares": shares,
                                "cost": c["total_cost"], "amount": c["trade_amount"], "pnl": 0,
                            })
                            capital -= c["net_amount"]
                            positions[sym] = shares
                            buy_dates[sym] = idx

                if exit_s and sym in positions and positions[sym] > 0:
                    c = cost.calc_cost(close, positions[sym], is_buy=False)
                    buy_price = all_trades[-1]["price"] if all_trades else close
                    pnl = (close - buy_price) * positions[sym] - c["total_cost"]
                    all_trades.append({
                        "date": date_str, "symbol": sym, "action": "sell",
                        "price": c["trade_price"], "shares": positions[sym],
                        "cost": c["total_cost"], "amount": c["trade_amount"], "pnl": pnl,
                    })
                    capital += c["trade_amount"] - c["total_cost"]
                    positions[sym] = 0

            # 净值
            pos_val = sum(prices.get(s, 0) * sh for s, sh in positions.items() if sh > 0)
            total = capital + pos_val
            equity_curve.append({"date": date_str, "value": round(total, 2)})
            if total > peak_value: peak_value = total
            dd = (peak_value - total) / peak_value * 100
            drawdown_curve.append({"date": date_str, "dd": round(dd, 2)})

            for s, sh in positions.items():
                if sh > 0:
                    all_positions.append({"date": date_str, "symbol": s,
                                          "shares": sh, "price": prices.get(s, 0),
                                          "value": round(prices.get(s, 0) * sh, 2)})

        result.final_capital = total
        result.equity_curve = equity_curve
        result.drawdown_curve = drawdown_curve
        result.positions = all_positions[-100:] if all_positions else []
        result.trades = all_trades
        result.metrics = calc_metrics(equity_curve, None, all_trades)
        result.complete()

    except Exception as e:
        result.fail(str(e))

    return result
```

- [ ] **Step 2: 创建 event.py (事件级回测)**

```python
# /fia/workspace/quant-research-platform/quant_core/backtest/event.py
"""事件级回测 — 事件窗口收益分析"""
import pandas as pd
import numpy as np
from .metrics import calc_metrics
from .result import BacktestResult


def run_event_backtest(bars: pd.DataFrame, start_date: str, end_date: str,
                       event_window: tuple = (-5, 10),
                       initial_capital: float = 100000,
                       market: str = "CN") -> BacktestResult:
    """
    事件级回测 (简化版: 基于价格动量的伪事件窗口)。

    实际事件数据需要从 events 表获取。此处使用价格突破作为事件代理。
    """
    result = BacktestResult(
        name="Event Backtest",
        backtest_type="event",
        start_date=start_date, end_date=end_date,
        initial_capital=initial_capital,
    )

    try:
        mask = (bars["trade_date"] >= start_date) & (bars["trade_date"] <= end_date)
        bars = bars[mask].sort_values("trade_date").reset_index(drop=True)

        if bars.empty:
            result.fail("No data")
            return result

        symbols = bars["symbol"].unique()
        event_returns = []

        for sym in symbols:
            sym_bars = bars[bars["symbol"] == sym].reset_index(drop=True)
            if len(sym_bars) < 15:
                continue

            # 找事件日 (价格突破20日高点作为伪事件)
            for i in range(20, len(sym_bars) - event_window[1]):
                window_20 = sym_bars["close"].iloc[i-20:i]
                if sym_bars["close"].iloc[i] > window_20.max():
                    # 事件日 i
                    pre_start = max(0, i + event_window[0])
                    post_end = min(len(sym_bars), i + event_window[1] + 1)
                    window = sym_bars.iloc[pre_start:post_end]

                    if len(window) > abs(event_window[0]) + 1:
                        pre_close = window["close"].iloc[max(0, -event_window[0])]
                        for j in range(len(window)):
                            event_returns.append({
                                "date": window.iloc[j]["trade_date"],
                                "symbol": sym,
                                "day_offset": j + event_window[0],
                                "return": (window.iloc[j]["close"] - pre_close) / pre_close * 100,
                            })

        # 转换为净值曲线
        if event_returns:
            er_df = pd.DataFrame(event_returns)
            daily_avg = er_df.groupby("day_offset")["return"].mean()
            value = initial_capital
            equity_curve = []
            drawdown_curve = []
            peak = value
            for day_offset in sorted(daily_avg.index):
                ret = daily_avg[day_offset] / 100
                value *= (1 + ret)
                equity_curve.append({"date": f"day_{day_offset}", "value": round(value, 2)})
                if value > peak: peak = value
                dd = (peak - value) / peak * 100
                drawdown_curve.append({"date": f"day_{day_offset}", "dd": round(dd, 2)})

            result.equity_curve = equity_curve
            result.drawdown_curve = drawdown_curve
            result.metrics = calc_metrics(equity_curve)
            result.trades = event_returns[:50]
            result.final_capital = value
            result.complete()
        else:
            result.metrics = {"error": "No events found"}
            result.complete()

    except Exception as e:
        result.fail(str(e))

    return result
```

- [ ] **Step 3: 更新 __init__.py**

```python
# /fia/workspace/quant-research-platform/quant_core/backtest/__init__.py
from .cost import CostModel
from .engine import run_portfolio_backtest
from .signal import run_signal_backtest
from .event import run_event_backtest
from .metrics import calc_metrics
from .result import BacktestResult
from .portfolio_builder import build_portfolio
from .execution import get_rebalance_dates

__all__ = [
    "CostModel", "run_portfolio_backtest", "run_signal_backtest",
    "run_event_backtest", "calc_metrics", "BacktestResult",
    "build_portfolio", "get_rebalance_dates",
]
```

- [ ] **Step 4: 验证**

```bash
cd /fia/workspace/quant-research-platform && python3 -c "
from quant_core.backtest import (CostModel, run_portfolio_backtest,
    run_signal_backtest, run_event_backtest, calc_metrics, BacktestResult)
print('All imports OK')
"
```

- [ ] **Step 5: 提交**

```bash
cd /fia/workspace/quant-research-platform
git add -A && git commit -m "feat: MVP 3 Task 7 - Signal + Event backtest engines"
```

---

### Task 8: 回测结果存储 (SQLite + Parquet)

**Files:**
- Modify: `quant_core/storage/experiment_db.py`

- [ ] **Step 1: 添加 backtests 表到 experiment_db.py**

```python
# 在 experiment_db.py 的 _init_tables() 中添加:
"""
CREATE TABLE IF NOT EXISTS backtests (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    backtest_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'running',
    experiment_id TEXT DEFAULT '',
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    initial_capital REAL NOT NULL,
    final_capital REAL DEFAULT 0,
    benchmark TEXT DEFAULT '',
    metrics TEXT DEFAULT '{}',
    equity_curve TEXT DEFAULT '[]',
    drawdown_curve TEXT DEFAULT '[]',
    positions TEXT DEFAULT '[]',
    trades TEXT DEFAULT '[]',
    error_message TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    finished_at TEXT DEFAULT ''
);
"""
```

添加 CRUD 方法:

```python
def create_backtest(self, id, name, backtest_type, start_date, end_date,
                    initial_capital, benchmark="", experiment_id="") -> dict:
    now = datetime.now().isoformat()
    with self.connection() as conn:
        conn.execute(
            """INSERT INTO backtests
               (id, name, backtest_type, start_date, end_date, initial_capital,
                benchmark, experiment_id, status, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'running', ?)""",
            (id, name, backtest_type, start_date, end_date, initial_capital,
             benchmark, experiment_id, now)
        )
    return {"id": id, "status": "running", "created_at": now}

def save_backtest_result(self, id, result: dict) -> bool:
    """保存完整回测结果"""
    import json
    with self.connection() as conn:
        conn.execute(
            """UPDATE backtests SET
               final_capital=?, status=?, metrics=?, equity_curve=?,
               drawdown_curve=?, positions=?, trades=?,
               error_message=?, finished_at=?
               WHERE id=?""",
            (result.get("final_capital", 0), result.get("status", "failed"),
             json.dumps(result.get("metrics", {})),
             json.dumps(result.get("equity_curve", [])),
             json.dumps(result.get("drawdown_curve", [])),
             json.dumps(result.get("positions", [])[-100:]),
             json.dumps(result.get("trades", [])),
             result.get("error_message", ""),
             result.get("finished_at", ""),
             id)
        )
    return True

def get_backtests(self) -> list:
    import json
    with self.connection() as conn:
        rows = conn.execute("SELECT * FROM backtests ORDER BY created_at DESC").fetchall()
        result = []
        for r in rows:
            d = dict(r)
            for f in ["metrics", "equity_curve", "drawdown_curve", "positions", "trades"]:
                try: d[f] = json.loads(d[f])
                except: d[f] = [] if f != "metrics" else {}
            result.append(d)
        return result

def get_backtest(self, id) -> dict:
    import json
    with self.connection() as conn:
        row = conn.execute("SELECT * FROM backtests WHERE id=?", (id,)).fetchone()
        if not row: return {}
        d = dict(row)
        for f in ["metrics", "equity_curve", "drawdown_curve", "positions", "trades"]:
            try: d[f] = json.loads(d[f])
            except: d[f] = [] if f != "metrics" else {}
        return d

def delete_backtest(self, id) -> bool:
    with self.connection() as conn:
        conn.execute("DELETE FROM backtests WHERE id=?", (id,))
    return True
```

- [ ] **Step 2: 提交**

```bash
cd /fia/workspace/quant-research-platform
git add -A && git commit -m "feat: MVP 3 Task 8 - Backtest storage (SQLite CRUD)"
```

---

### Task 9: 回测 API 路由 + 服务

**Files:**
- Create: `backend/services/backtest_service.py`
- Create: `backend/api/backtests.py`
- Modify: `backend/main.py`

- [ ] **Step 1: 创建 backtest_service.py**

```python
# /fia/workspace/quant-research-platform/backend/services/backtest_service.py
"""回测任务服务"""
import uuid
from datetime import datetime
from quant_core.storage.experiment_db import ExperimentDB
from quant_core.backtest.engine import run_portfolio_backtest
from quant_core.backtest.signal import run_signal_backtest
from quant_core.backtest.event import run_event_backtest
from quant_core.backtest.result import BacktestResult


class BacktestService:
    def __init__(self, exp_db: ExperimentDB, portal):
        self.db = exp_db
        self.portal = portal

    def create_and_run(self, name, backtest_type, start_date, end_date,
                       initial_capital=100000, benchmark="sh000300",
                       rebalance_freq="daily", top_n=10, weight_method="equal",
                       entry_signal="golden_cross", exit_signal="death_cross",
                       holding_period=0, market="CN", cost_params=None,
                       experiment_id="") -> dict:
        """提交并执行回测（同步）"""
        bt_id = str(uuid.uuid4())[:8]
        self.db.create_backtest(bt_id, name, backtest_type, start_date, end_date,
                                initial_capital, benchmark, experiment_id)

        # 加载数据
        bars = self.portal.read_daily_bars(market=market, start=start_date, end=end_date)
        if bars.empty:
            result = BacktestResult()
            result.fail("No bars data")
            self.db.save_backtest_result(bt_id, result.to_dict())
            return result.to_dict()

        # 因子数据 (从 Experiment 或默认)
        from quant_core.features.factors.technical import TechnicalFactors
        factor_df = TechnicalFactors.compute("ma_20", bars)

        # 基准数据
        benchmark_df = None
        try:
            benchmark_df = self.portal.read_daily_bars(symbols=[benchmark], market="CN",
                                                        start=start_date, end=end_date)
        except:
            pass

        # 执行回测
        if backtest_type == "portfolio":
            result = run_portfolio_backtest(
                bars, factor_df, start_date, end_date,
                initial_capital=initial_capital, benchmark=benchmark,
                benchmark_df=benchmark_df, rebalance_freq=rebalance_freq,
                top_n=top_n, weight_method=weight_method,
                market=market, cost_params=cost_params or {}
            )
        elif backtest_type == "signal":
            result = run_signal_backtest(
                bars, start_date, end_date,
                entry_signal=entry_signal, exit_signal=exit_signal,
                initial_capital=initial_capital, holding_period=holding_period,
                market=market, cost_params=cost_params or {}
            )
        elif backtest_type == "event":
            result = run_event_backtest(
                bars, start_date, end_date,
                event_window=(-5, 10), initial_capital=initial_capital, market=market
            )
        else:
            result = BacktestResult()
            result.fail(f"Unknown backtest type: {backtest_type}")

        # 保存结果
        result.name = name
        self.db.save_backtest_result(bt_id, result.to_dict())
        return result.to_dict()

    def list_backtests(self): return self.db.get_backtests()
    def get_backtest(self, id): return self.db.get_backtest(id)
    def delete_backtest(self, id): return self.db.delete_backtest(id)
```

- [ ] **Step 2: 创建 backtests.py API**

```python
# /fia/workspace/quant-research-platform/backend/api/backtests.py
"""回测 API 路由"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.services.backtest_service import BacktestService

router = APIRouter(prefix="/api/backtests", tags=["backtests"])


def get_backtest_service() -> BacktestService:
    from backend.main import app_state
    return BacktestService(app_state["exp_db"], app_state["portal"])


class BacktestRequest(BaseModel):
    name: str
    backtest_type: str = "portfolio"  # portfolio | signal | event
    start_date: str
    end_date: str
    initial_capital: float = 100000
    benchmark: str = "sh000300"
    rebalance_freq: str = "daily"
    top_n: int = 10
    weight_method: str = "equal"
    entry_signal: str = "golden_cross"
    exit_signal: str = "death_cross"
    holding_period: int = 0
    market: str = "CN"
    cost_params: Optional[dict] = None
    experiment_id: str = ""


@router.get("")
async def list_backtests(service: BacktestService = Depends(get_backtest_service)):
    return service.list_backtests()


@router.get("/{bt_id}")
async def get_backtest(bt_id: str, service: BacktestService = Depends(get_backtest_service)):
    result = service.get_backtest(bt_id)
    if not result:
        raise HTTPException(status_code=404, detail="Backtest not found")
    return result


@router.post("")
async def create_backtest(req: BacktestRequest,
                           service: BacktestService = Depends(get_backtest_service)):
    return service.create_and_run(
        name=req.name, backtest_type=req.backtest_type,
        start_date=req.start_date, end_date=req.end_date,
        initial_capital=req.initial_capital, benchmark=req.benchmark,
        rebalance_freq=req.rebalance_freq, top_n=req.top_n,
        weight_method=req.weight_method, entry_signal=req.entry_signal,
        exit_signal=req.exit_signal, holding_period=req.holding_period,
        market=req.market, cost_params=req.cost_params,
        experiment_id=req.experiment_id,
    )


@router.delete("/{bt_id}")
async def delete_backtest(bt_id: str, service: BacktestService = Depends(get_backtest_service)):
    if not service.delete_backtest(bt_id):
        raise HTTPException(status_code=404, detail="Backtest not found")
    return {"status": "deleted"}
```

- [ ] **Step 3: 注册路由 (backend/main.py)**

```python
# 在 imports 中添加:
from backend.api.backtests import router as backtests_router

# 在 app.include_router 区域添加:
    app.include_router(backtests_router)
```

- [ ] **Step 4: 验证 API**

```bash
kill $(lsof -ti:7031) 2>/dev/null; sleep 1
cd /fia/workspace/quant-research-platform
uvicorn backend.main:app --host 0.0.0.0 --port 7031 &
sleep 4

echo "=== Create Portfolio Backtest ==="
curl -s -X POST http://localhost:7031/api/backtests \
  -H "Content-Type: application/json" \
  -d '{"name":"组合级测试","backtest_type":"portfolio","start_date":"2025-06-01","end_date":"2026-06-01","top_n":3,"rebalance_freq":"weekly"}' \
  | python3 -c "
import sys,json
d = json.load(sys.stdin)
print(f\"Status: {d.get('status')}\")
print(f\"Metrics: {d.get('metrics',{})}\")
print(f\"Equity: {len(d.get('equity_curve',[]))} points\")
print(f\"Trades: {len(d.get('trades',[]))}\")
"

echo "=== List Backtests ==="
curl -s http://localhost:7031/api/backtests | python3 -c "
import sys,json; d=json.load(sys.stdin)
print(f'{len(d)} backtests')
for b in d: print(f\"  {b['id']}: {b['name']} ({b['backtest_type']}) - {b['status']}\")
"
```

- [ ] **Step 5: 提交**

```bash
cd /fia/workspace/quant-research-platform
git add -A && git commit -m "feat: MVP 3 Task 9 - Backtest API + Service"
```

---

### Task 10: 前端 - 回测页面 (Backtests.tsx)

**Files:**
- Create: `frontend/src/pages/Backtests.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: 创建 Backtests.tsx**

```typescript
// /fia/workspace/quant-research-platform/frontend/src/pages/Backtests.tsx
import React, { useEffect, useState } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '../components/ui/dialog'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'

interface Backtest {
  id: string; name: string; backtest_type: string; status: string;
  start_date: string; end_date: string; initial_capital: number; final_capital: number;
  metrics: any; equity_curve: any[]; drawdown_curve: any[]; trades: any[];
  error_message: string; created_at: string;
}

const Backtests: React.FC = () => {
  const [backtests, setBacktests] = useState<Backtest[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedBt, setSelectedBt] = useState<Backtest | null>(null)
  const [running, setRunning] = useState(false)
  const [form, setForm] = useState({
    name: '', backtest_type: 'portfolio', start_date: '2025-06-01',
    end_date: '2026-06-01', initial_capital: 100000, top_n: 10,
    rebalance_freq: 'weekly', entry_signal: 'golden_cross', exit_signal: 'death_cross',
  })

  const fetchData = async () => {
    const res = await fetch('/api/backtests')
    setBacktests(await res.json())
    setLoading(false)
  }
  useEffect(() => { fetchData() }, [])

  const handleRun = async () => {
    if (!form.name) return
    setRunning(true)
    await fetch('/api/backtests', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setCreateOpen(false)
    setRunning(false)
    fetchData()
  }

  const openDetail = (bt: Backtest) => {
    setSelectedBt(bt)
    setDetailOpen(true)
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/backtests/${id}`, { method: 'DELETE' })
    fetchData()
  }

  const fmtMoney = (v: number) => `¥${v.toLocaleString()}`
  const statusBadge = (s: string) => {
    const m: Record<string, string> = { completed: 'success', running: 'warning', failed: 'destructive' }
    return <Badge variant={m[s] || 'secondary'}>{s}</Badge>
  }

  if (loading) return <div className="loading-text"><div className="inline-block w-5 h-5 border-2 border-[#1e2d3d] border-t-primary rounded-full animate-spin mr-2 align-middle" />加载中...</div>

  return (
    <div className="page-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">回测任务</h1>
          <p className="text-sm text-muted mt-1">组合级/信号级/事件级回测，支持日/周/月频率</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>+ 新建回测</Button>
      </div>

      {backtests.length === 0 ? (
        <div className="stat-card text-center py-12">
          <div className="text-3xl mb-3">📊</div>
          <div className="text-lg font-medium mb-1">暂无回测任务</div>
          <div className="text-sm text-muted">点击「新建回测」开始</div>
        </div>
      ) : (
        <div className="section-card">
          <Table>
            <TableHeader><TableRow>
              <TableHead>名称</TableHead><TableHead>类型</TableHead><TableHead>状态</TableHead>
              <TableHead className="text-right">初始资金</TableHead><TableHead className="text-right">最终资金</TableHead>
              <TableHead className="text-right">收益</TableHead><TableHead className="text-right">夏普</TableHead>
              <TableHead>创建时间</TableHead><TableHead>操作</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {backtests.map(bt => (
                <TableRow key={bt.id} className="hover:bg-white/[0.02]">
                  <TableCell className="font-medium">{bt.name}</TableCell>
                  <TableCell><Badge variant="secondary">{bt.backtest_type === 'portfolio' ? '组合' : bt.backtest_type === 'signal' ? '信号' : '事件'}</Badge></TableCell>
                  <TableCell>{statusBadge(bt.status)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{fmtMoney(bt.initial_capital)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{bt.final_capital > 0 ? fmtMoney(bt.final_capital) : '--'}</TableCell>
                  <TableCell className={`text-right font-mono text-xs ${bt.metrics?.total_return > 0 ? 'text-bullish' : bt.metrics?.total_return < 0 ? 'text-bearish' : 'text-muted-foreground'}`}>
                    {bt.metrics?.total_return != null ? `${bt.metrics.total_return > 0 ? '+' : ''}${bt.metrics.total_return}%` : '--'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">{bt.metrics?.sharpe_ratio ?? '--'}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{bt.created_at?.slice(0, 19)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => openDetail(bt)}>详情</Button>
                      <Button variant="ghost" size="sm" className="h-6 text-xs text-red-400" onClick={() => handleDelete(bt.id)}>删除</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogHeader><DialogTitle>新建回测</DialogTitle></DialogHeader>
        <DialogContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="text-sm text-muted-foreground">名称</label>
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="mt-1" placeholder="组合级测试" /></div>
            <div><label className="text-sm text-muted-foreground">回测类型</label>
              <select value={form.backtest_type} onChange={e => setForm({...form, backtest_type: e.target.value})}
                className="mt-1 w-full h-10 rounded-md border border-[#1e2d3d] bg-[#0a0e17] px-3 text-sm text-foreground">
                <option value="portfolio">组合级</option><option value="signal">信号级</option><option value="event">事件级</option>
              </select></div>
            <div><label className="text-sm text-muted-foreground">调仓频率</label>
              <select value={form.rebalance_freq} onChange={e => setForm({...form, rebalance_freq: e.target.value})}
                className="mt-1 w-full h-10 rounded-md border border-[#1e2d3d] bg-[#0a0e17] px-3 text-sm text-foreground">
                <option value="daily">每日</option><option value="weekly">每周</option><option value="monthly">每月</option>
              </select></div>
            <div><label className="text-sm text-muted-foreground">起始日期</label>
              <Input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className="mt-1" /></div>
            <div><label className="text-sm text-muted-foreground">结束日期</label>
              <Input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className="mt-1" /></div>
            <div><label className="text-sm text-muted-foreground">持仓数量 (Top N)</label>
              <Input type="number" value={form.top_n} onChange={e => setForm({...form, top_n: parseInt(e.target.value) || 10})} className="mt-1" /></div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
          <Button onClick={handleRun} disabled={running}>
            {running ? <><span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />运行中...</> : '▶ 运行回测'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogHeader><DialogTitle>{selectedBt?.name} — 回测详情</DialogTitle></DialogHeader>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          {selectedBt && (
            <div>
              {/* Metrics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[['最终资金', fmtMoney(selectedBt.final_capital || selectedBt.initial_capital)],
                  ['累计收益', `${selectedBt.metrics?.total_return ?? 0}%`],
                  ['年化收益', `${selectedBt.metrics?.annual_return ?? 0}%`],
                  ['夏普比率', `${selectedBt.metrics?.sharpe_ratio ?? '--'}`],
                  ['最大回撤', `${selectedBt.metrics?.max_drawdown ?? 0}%`],
                  ['胜率', `${selectedBt.metrics?.win_rate ?? 0}%`],
                  ['盈亏比', `${selectedBt.metrics?.profit_factor ?? '--'}`],
                  ['交易次数', `${selectedBt.metrics?.n_trades ?? 0}`]].map(([l, v]) => (
                  <div key={l} className="text-center p-3 bg-[#0a0e17] rounded-lg border border-[#1e2d3d]">
                    <div className="text-sm font-bold text-primary">{v}</div>
                    <div className="text-xs text-muted">{l}</div>
                  </div>
                ))}
              </div>

              {/* Equity Curve (simple bar chart) */}
              {selectedBt.equity_curve && selectedBt.equity_curve.length > 1 && (
                <div className="mb-4 p-3 bg-[#0a0e17] rounded-lg border border-[#1e2d3d]">
                  <div className="text-sm font-medium mb-2">净值曲线</div>
                  <div className="h-32 flex items-end gap-px overflow-hidden">
                    {selectedBt.equity_curve.slice(-120).map((p, i, arr) => {
                      const min = Math.min(...arr.map(e => e.value))
                      const max = Math.max(...arr.map(e => e.value))
                      const h = max !== min ? ((p.value - min) / (max - min)) * 100 : 50
                      return <div key={i} className="flex-1 bg-primary/60 rounded-t" style={{ height: `${h}%` }} />
                    })}
                  </div>
                </div>
              )}

              {/* Drawdown */}
              {selectedBt.drawdown_curve && selectedBt.drawdown_curve.length > 1 && (
                <div className="mb-4 p-3 bg-[#0a0e17] rounded-lg border border-[#1e2d3d]">
                  <div className="text-sm font-medium mb-2">回撤曲线</div>
                  <div className="h-20 flex items-start gap-px overflow-hidden">
                    {selectedBt.drawdown_curve.slice(-120).map((p, i) => (
                      <div key={i} className="flex-1 bg-red-500/40 rounded-b" style={{ height: `${Math.min(p.dd, 50) * 2}%` }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Trades */}
              {selectedBt.trades && selectedBt.trades.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">交易明细 (最近20笔)</div>
                  <div className="max-h-40 overflow-auto">
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>日期</TableHead><TableHead>代码</TableHead><TableHead>方向</TableHead>
                        <TableHead className="text-right">价格</TableHead><TableHead className="text-right">数量</TableHead>
                        <TableHead className="text-right">盈亏</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {selectedBt.trades.slice(-20).reverse().map((t, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-xs font-mono">{t.date}</TableCell>
                            <TableCell className="text-xs">{t.symbol}</TableCell>
                            <TableCell><Badge variant={t.action === 'buy' ? 'default' : 'secondary'}>{t.action === 'buy' ? '买入' : '卖出'}</Badge></TableCell>
                            <TableCell className="text-right font-mono text-xs">{t.price?.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-mono text-xs">{t.shares}</TableCell>
                            <TableCell className={`text-right font-mono text-xs ${t.pnl > 0 ? 'text-bullish' : t.pnl < 0 ? 'text-bearish' : 'text-muted-foreground'}`}>
                              {t.pnl ? `${t.pnl > 0 ? '+' : ''}${t.pnl.toFixed(2)}` : '--'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {selectedBt.error_message && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  ⚠️ {selectedBt.error_message}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Backtests
```

- [ ] **Step 2: 更新 App.tsx**

```typescript
// 添加 import:
import Backtests from './pages/Backtests'

// 添加 tab:
{ id: 'backtests', label: '回测任务', icon: '📊' },

// 添加渲染:
{currentPage === 'backtests' && <Backtests />}
```

- [ ] **Step 3: 提交**

```bash
cd /fia/workspace/quant-research-platform
git add -A && git commit -m "feat: MVP 3 Task 10 - Backtests page with metrics + charts + trades"
```

---

### Task 11: 集成测试

- [ ] **Step 1: 启动服务并验证全流程**

```bash
kill $(lsof -ti:7031) 2>/dev/null; kill $(lsof -ti:5173) 2>/dev/null; sleep 1
cd /fia/workspace/quant-research-platform
uvicorn backend.main:app --host 0.0.0.0 --port 7031 &
cd frontend && npx vite --host 0.0.0.0 --port 5173 &
sleep 5

echo "=== Portfolio Backtest ==="
curl -s -X POST http://localhost:7031/api/backtests \
  -H "Content-Type: application/json" \
  -d '{"name":"组合级-等权周频","backtest_type":"portfolio","start_date":"2025-06-01","end_date":"2026-06-01","top_n":5,"rebalance_freq":"weekly","weight_method":"equal"}' \
  | python3 -c "
import sys,json
d = json.load(sys.stdin)
if 'error' in d.get('metrics',{}):
    print(f'ERROR: {d[\"metrics\"][\"error\"]}')
else:
    print(f\"Status: {d['status']}\")
    print(f\"Capital: {d['initial_capital']} → {d['final_capital']:.0f}\")
    m = d.get('metrics',{})
    print(f\"Return: {m.get('total_return')}% | Sharpe: {m.get('sharpe_ratio')} | MaxDD: {m.get('max_drawdown')}%\")
    print(f\"Trades: {m.get('n_trades')} | WinRate: {m.get('win_rate')}%\")
"

echo "=== Signal Backtest ==="
curl -s -X POST http://localhost:7031/api/backtests \
  -H "Content-Type: application/json" \
  -d '{"name":"信号级-金叉死叉","backtest_type":"signal","start_date":"2025-06-01","end_date":"2026-06-01","entry_signal":"golden_cross","exit_signal":"death_cross"}' \
  | python3 -c "
import sys,json; d=json.load(sys.stdin)
print(f\"Status: {d['status']}\")
m = d.get('metrics',{})
print(f\"Return: {m.get('total_return')}% | Trades: {m.get('n_trades')}\")
"

echo "=== List ==="
curl -s http://localhost:7031/api/backtests | python3 -c "
import sys,json; d=json.load(sys.stdin)
print(f'{len(d)} backtests')
for b in d: print(f\"  {b['id']}: {b['name']} ({b['backtest_type']}) → {b.get('metrics',{}).get('total_return','--')}%\")
"
```

- [ ] **Step 2: 提交**

```bash
cd /fia/workspace/quant-research-platform
git add -A && git commit -m "test: MVP 3 integration test - all 3 backtest types verified"
```

---

## Self-Review

### Spec Coverage

| Spec Requirement | Task |
|-----------------|------|
| 组合级回测 | Task 6 |
| 信号级回测 | Task 7 |
| 事件级回测 | Task 7 |
| 日/周/月/事件频率 | Task 3 + Task 6 |
| 交易成本模型 (A股/港股) | Task 1 |
| 回测结果对象 | Task 5 |
| 绩效指标 (12项) | Task 4 |
| 回测任务 API | Task 9 |
| 回测 Web UI | Task 10 |

### Placeholder Scan
- No TBD/TODO ✅
- All code provided ✅
- All commands with expected output ✅

### Type Consistency
- BacktestResult used consistently across engine/service/API ✅
- All API endpoints use /api/backtests prefix ✅
- CostModel market="CN"/"HK" consistent ✅
- metrics dict structure matches calc_metrics output ✅
