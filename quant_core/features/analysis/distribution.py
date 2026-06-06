import pandas as pd

class DistributionAnalyzer:
    @staticmethod
    def compute_distribution(factor_df):
        values = factor_df["factor_value"].dropna()
        total = len(factor_df)
        return {
            "count": len(values),
            "total": total,
            "coverage": float(len(values) / total) if total > 0 else 0,
            "missing_rate": float(1 - len(values) / total) if total > 0 else 0,
            "mean": float(values.mean()),
            "std": float(values.std()),
            "min": float(values.min()),
            "max": float(values.max()),
            "median": float(values.median()),
            "skew": float(values.skew()),
            "kurtosis": float(values.kurtosis()),
        }
