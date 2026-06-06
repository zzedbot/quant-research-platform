import pandas as pd
class MomentumFactors:
    @classmethod
    def list_all(cls):
        return [
            {"name": "momentum_20d", "description": "20日价格动量", "category": "momentum"},
            {"name": "momentum_60d", "description": "60日价格动量", "category": "momentum"},
            {"name": "momentum_120d", "description": "120日价格动量", "category": "momentum"},
        ]
    @classmethod
    def compute(cls, name, bars, params=None):
        period = {"momentum_20d": 20, "momentum_60d": 60, "momentum_120d": 120}.get(name, 20)
        df = bars.copy()
        df["prev_close"] = df.groupby("symbol")["close"].shift(period)
        df["factor_value"] = (df["close"] - df["prev_close"]) / df["prev_close"]
        return df[["trade_date", "symbol", "factor_value"]]
