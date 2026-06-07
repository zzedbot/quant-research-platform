"""组合构建 — 等权/市值加权/因子加权"""
import pandas as pd


def build_portfolio(factor_df: pd.DataFrame, date: str, method: str = "equal",
                    top_n: int = 10, market_cap_df: pd.DataFrame = None) -> dict:
    # Convert date to match column type
    if hasattr(factor_df["trade_date"].iloc[0], 'strftime'):
        from datetime import datetime
        date_obj = datetime.strptime(date, "%Y-%m-%d").date()
        day_data = factor_df[factor_df["trade_date"] == date_obj].copy()
    else:
        day_data = factor_df[factor_df["trade_date"] == date].copy()
    if day_data.empty:
        return {}
    day_data = day_data.dropna(subset=["factor_value"])
    if day_data.empty:
        return {}
    day_data = day_data.sort_values("factor_value", ascending=False)
    if top_n > 0:
        day_data = day_data.head(top_n)
    symbols = day_data["symbol"].values
    if method == "equal":
        w = 1.0 / len(symbols)
        return {s: w for s in symbols}
    elif method == "factor_weight":
        values = day_data["factor_value"].values
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
    return {s: 1.0 / len(symbols) for s in symbols}
