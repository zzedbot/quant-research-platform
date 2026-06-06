import pandas as pd
import numpy as np
from scipy.stats import spearmanr

class ICAnalyzer:
    @staticmethod
    def compute_ic(factor_df, returns_df):
        merged = factor_df.merge(returns_df, on=["trade_date", "symbol"], how="inner")
        results = []
        for date, group in merged.groupby("trade_date"):
            if len(group) < 5: continue
            fv = group["factor_value"].values
            ret = group["next_return"].values
            ic = np.corrcoef(fv, ret)[0, 1] if len(fv) > 1 else np.nan
            rank_ic, _ = spearmanr(fv, ret)
            results.append({"trade_date": date, "ic": ic, "rank_ic": rank_ic})
        return pd.DataFrame(results)

    @staticmethod
    def ic_statistics(ic_df):
        ic = ic_df["ic"].dropna().replace([float('inf'), float('-inf')], float('nan')).dropna()
        ric = ic_df["rank_ic"].dropna().replace([float('inf'), float('-inf')], float('nan')).dropna()
        return {
            "ic_mean": round(float(ic.mean()), 6) if len(ic) > 0 else 0,
            "ic_std": round(float(ic.std()), 6) if len(ic) > 0 else 0,
            "icir": round(float(ic.mean() / ic.std()), 6) if len(ic) > 0 and ic.std() > 0 else 0,
            "ic_positive_pct": round(float((ic > 0).mean()), 6) if len(ic) > 0 else 0,
            "rank_ic_mean": round(float(ric.mean()), 6) if len(ric) > 0 else 0,
            "rank_ic_std": round(float(ric.std()), 6) if len(ric) > 0 else 0,
            "rank_icir": round(float(ric.mean() / ric.std()), 6) if len(ric) > 0 and ric.std() > 0 else 0,
            "rank_ic_positive_pct": round(float((ric > 0).mean()), 6) if len(ric) > 0 else 0,
        }
