"""绩效指标计算"""
import numpy as np


def calc_metrics(equity_curve: list, benchmark_curve: list = None,
                  trades: list = None, trading_days: int = 252) -> dict:
    if len(equity_curve) < 2:
        return {"error": "Not enough data"}

    values = np.array([e["value"] for e in equity_curve])
    n_days = len(equity_curve)
    returns = np.diff(values) / values[:-1]
    returns = returns[np.isfinite(returns)]

    total_return = (values[-1] - values[0]) / values[0]
    years = n_days / trading_days
    annual_return = (1 + total_return) ** (1 / years) - 1 if years > 0 else total_return
    annual_vol = np.std(returns) * np.sqrt(trading_days) if len(returns) > 1 else 0
    rf = 0.03
    if annual_vol < 1e-8:
        sharpe = annual_return / 0.15 if annual_vol < 1e-8 else 0  # fallback: assume 15% vol
    else:
        sharpe = (annual_return - rf) / annual_vol

    peak = values[0]
    max_dd = 0
    for v in values:
        if v > peak:
            peak = v
        dd = (peak - v) / peak
        if dd > max_dd:
            max_dd = dd
    max_dd_pct = max_dd * 100
    calmar = annual_return / max_dd if max_dd > 0 else 999

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

    profits = [t["pnl"] for t in trades if t.get("pnl", 0) > 0] if trades else []
    losses = [t["pnl"] for t in trades if t.get("pnl", 0) < 0] if trades else []
    profit_factor = (np.mean(profits) / abs(np.mean(losses))) if profits and losses else 0
    turnover = n_trades / years if years > 0 else n_trades

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
