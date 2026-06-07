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
        mask = (bars["trade_date"].astype(str) >= start_date) & (bars["trade_date"].astype(str) <= end_date)
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
