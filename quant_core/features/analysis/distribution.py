import pandas as pd

class DistributionAnalyzer:
    @staticmethod
    def compute_distribution(factor_df):
        values = factor_df["factor_value"].replace([float('inf'), float('-inf')], float('nan')).dropna()
        total = len(factor_df)
        result = {
            "count": len(values), "total": total,
            "coverage": round(len(values) / total, 6) if total > 0 else 0,
            "missing_rate": round(1 - len(values) / total, 6) if total > 0 else 0,
        }
        if len(values) > 0:
            result.update({
                "mean": round(float(values.mean()), 6), "std": round(float(values.std()), 6),
                "min": round(float(values.min()), 6), "max": round(float(values.max()), 6),
                "median": round(float(values.median()), 6), "skew": round(float(values.skew()), 6),
                "kurtosis": round(float(values.kurtosis()), 6),
            })
        return result
