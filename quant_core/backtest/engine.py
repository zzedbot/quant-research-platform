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
    result = BacktestResult(
        name="Portfolio Backtest", backtest_type="portfolio",
        start_date=start_date, end_date=end_date,
        initial_capital=initial_capital, benchmark=benchmark,
    )
    try:
        mask = (bars["trade_date"].astype(str) >= start_date) & (bars["trade_date"].astype(str) <= end_date)
        bars = bars[mask].sort_values("trade_date").reset_index(drop=True)
        if bars.empty:
            result.fail("No data in date range")
            return result

        trade_dates = bars["trade_date"].unique().tolist()
        trade_dates_str = [d.strftime("%Y-%m-%d") if hasattr(d, 'strftime') else str(d) for d in trade_dates]
        rebal_dates = set(get_rebalance_dates(trade_dates_str, rebalance_freq))
        cost = CostModel(market, **(cost_params or {}))

        capital = initial_capital
        positions = {}
        equity_curve = []
        drawdown_curve = []
        all_trades = []
        all_positions = []
        peak_value = initial_capital

        for date_obj in trade_dates:
            date_str = date_obj.strftime("%Y-%m-%d") if hasattr(date_obj, 'strftime') else str(date_obj)
            day_bars = bars[bars["trade_date"] == date_obj]
            prices = dict(zip(day_bars["symbol"], day_bars["close"]))

            # Portfolio value
            pos_val = sum(prices.get(s, 0) * sh for s, sh in positions.items() if sh > 0)
            total_value = capital + pos_val
            equity_curve.append({"date": date_str, "value": round(total_value, 2)})
            if total_value > peak_value:
                peak_value = total_value
            dd = (peak_value - total_value) / peak_value * 100
            drawdown_curve.append({"date": date_str, "dd": round(dd, 2)})

            # Rebalance
            if date_str in rebal_dates:
                # Convert factor dates to string for matching
                factor_df["_date_str"] = factor_df["trade_date"].astype(str)
                day_factor = factor_df[factor_df["_date_str"] == date_str]
                if not day_factor.empty:
                    target = build_portfolio(day_factor, date_str, weight_method, top_n)

                    # Sell removed symbols
                    for sym in list(positions.keys()):
                        if sym not in target and positions[sym] > 0:
                            sell_price = prices.get(sym, 0)
                            if sell_price > 0:
                                c = cost.calc_cost(sell_price, positions[sym], is_buy=False)
                                pnl = (sell_price - (all_trades[-1]["price"] if all_trades and all_trades[-1]["symbol"] == sym else sell_price)) * positions[sym] - c["total_cost"]
                                all_trades.append({
                                    "date": date_str, "symbol": sym, "action": "sell",
                                    "price": c["trade_price"], "shares": positions[sym],
                                    "cost": c["total_cost"], "amount": c["trade_amount"],
                                    "pnl": round(pnl, 2),
                                })
                                capital += c["trade_amount"] - c["total_cost"]
                                positions[sym] = 0

                    # Buy/adjust target
                    for sym, weight in target.items():
                        target_value = total_value * weight
                        buy_price = prices.get(sym, 0)
                        if buy_price > 0:
                            target_shares = int(target_value / buy_price / 100) * 100
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

            # Positions snapshot
            for sym, sh in positions.items():
                if sh > 0:
                    all_positions.append({"date": date_str, "symbol": sym,
                                          "shares": sh, "price": prices.get(sym, 0),
                                          "value": round(prices.get(sym, 0) * sh, 2)})

            # Final value for this day
            pos_val = sum(prices.get(s, 0) * sh for s, sh in positions.items() if sh > 0)
            total_value = capital + pos_val

        result.final_capital = total_value
        result.equity_curve = equity_curve
        result.drawdown_curve = drawdown_curve
        result.positions = all_positions[-200:] if all_positions else []
        result.trades = all_trades

        # Benchmark
        bm_curve = []
        if benchmark_df is not None and not benchmark_df.empty:
            bm_filtered = benchmark_df[(benchmark_df["trade_date"].astype(str) >= start_date) &
                                        (benchmark_df["trade_date"].astype(str) <= end_date)]
            if not bm_filtered.empty and "close" in bm_filtered.columns:
                base_val = bm_filtered.iloc[0]["close"]
                bm_curve = [{"date": str(r["trade_date"]), "value": initial_capital * r["close"] / base_val}
                            for _, r in bm_filtered.iterrows()]

        result.metrics = calc_metrics(equity_curve, bm_curve if bm_curve else None, all_trades)
        result.complete()
    except Exception as e:
        result.fail(str(e))
    return result
