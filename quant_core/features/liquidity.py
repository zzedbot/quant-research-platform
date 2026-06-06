import pandas as pd
import numpy as np
class LiquidityFactors:
    @classmethod
    def list_all(cls):
        return [
            {"name": "amount", "description": "日均成交额(对数)", "category": "liquidity"},
            {"name": "turnover", "description": "换手率", "category": "liquidity"},
            {"name": "amihud", "description": "Amihud非流动性指标", "category": "liquidity"},
        ]
    @classmethod
    def compute(cls, name, bars, params=None):
        df = bars.copy()
        if name == "amount":
            df["factor_value"] = df["amount"].apply(lambda x: np.log(x + 1))
        elif name == "turnover":
            df["factor_value"] = df.groupby("symbol")["volume"].transform(lambda x: x / x.rolling(20).mean())
        elif name == "amihud":
            df["abs_return"] = df.groupby("symbol")["close"].pct_change().abs()
            df["factor_value"] = df["abs_return"] / (df["amount"] + 1)
        return df[["trade_date", "symbol", "factor_value"]]
