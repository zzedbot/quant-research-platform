import pandas as pd

class QuantileAnalyzer:
    @staticmethod
    def compute_quantile_returns(factor_df, returns_df, n_quantiles=5):
        merged = factor_df.merge(returns_df, on=["trade_date", "symbol"], how="inner")
        results = []
        for date, group in merged.groupby("trade_date"):
            if len(group) < n_quantiles: continue
            group = group.copy()
            group["quantile"] = pd.qcut(group["factor_value"], n_quantiles, labels=False, duplicates="drop")
            for q in range(n_quantiles):
                qg = group[group["quantile"] == q]
                if len(qg) > 0:
                    results.append({"trade_date": date, "quantile": q + 1, "avg_return": float(qg["next_return"].mean()), "count": len(qg)})
        return pd.DataFrame(results)

    @staticmethod
    def quantile_spread(quantile_df):
        if quantile_df.empty: return {"spread": 0, "annualized_spread": 0}
        top = quantile_df[quantile_df["quantile"] == quantile_df["quantile"].max()]["avg_return"].mean()
        bottom = quantile_df[quantile_df["quantile"] == quantile_df["quantile"].min()]["avg_return"].mean()
        spread = top - bottom
        return {"spread": float(spread), "annualized_spread": float(spread * 252)}
