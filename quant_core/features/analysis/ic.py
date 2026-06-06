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
        ic = ic_df["ic"].dropna()
        ric = ic_df["rank_ic"].dropna()
        return {
            "ic_mean": float(ic.mean()) if len(ic) > 0 else 0,
            "ic_std": float(ic.std()) if len(ic) > 0 else 0,
            "icir": float(ic.mean() / ic.std()) if ic.std() > 0 else 0,
            "ic_positive_pct": float((ic > 0).mean()) if len(ic) > 0 else 0,
            "rank_ic_mean": float(ric.mean()) if len(ric) > 0 else 0,
            "rank_ic_std": float(ric.std()) if len(ric) > 0 else 0,
            "rank_icir": float(ric.mean() / ric.std()) if ric.std() > 0 else 0,
            "rank_ic_positive_pct": float((ric > 0).mean()) if len(ric) > 0 else 0,
        }
