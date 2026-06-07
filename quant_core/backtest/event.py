"""事件级回测 — 事件窗口收益分析"""
import pandas as pd
import numpy as np
from .cost import CostModel
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
        mask = (bars["trade_date"].astype(str) >= start_date) & (bars["trade_date"].astype(str) <= end_date)
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
