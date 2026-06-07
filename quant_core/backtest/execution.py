"""执行频率模型 — daily / weekly / monthly / event"""
import pandas as pd


def get_rebalance_dates(trade_dates: list, freq: str = "daily",
                        factor_df: pd.DataFrame = None,
                        entry_signal: str = None) -> list:
    dates = pd.to_datetime(trade_dates)
    if freq == "daily":
        return [d.strftime("%Y-%m-%d") for d in dates]
    elif freq == "weekly":
        weekly = dates[dates.dayofweek == 4]
        return [d.strftime("%Y-%m-%d") for d in weekly]
    elif freq == "monthly":
        monthly = []
        for year_month in dates.to_period("M").unique():
            mask = dates.to_period("M") == year_month
            month_dates = dates[mask]
            monthly.append(month_dates[-1])
        return [d.strftime("%Y-%m-%d") for d in monthly]
    elif freq == "event":
        return [d.strftime("%Y-%m-%d") for d in dates]
    return [d.strftime("%Y-%m-%d") for d in dates]
