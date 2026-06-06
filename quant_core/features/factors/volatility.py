import pandas as pd
import numpy as np
class VolatilityFactors:
    @classmethod
    def list_all(cls):
        return [
            {"name": "volatility_20d", "description": "20日历史波动率", "category": "volatility"},
            {"name": "volatility_60d", "description": "60日历史波动率", "category": "volatility"},
            {"name": "max_drawdown_60d", "description": "60日最大回撤", "category": "volatility"},
        ]
    @classmethod
    def compute(cls, name, bars, params=None):
        df = bars.copy()
        if name in ("volatility_20d", "volatility_60d"):
            p = 20 if name == "volatility_20d" else 60
            df["returns"] = df.groupby("symbol")["close"].pct_change()
            df["factor_value"] = df.groupby("symbol")["returns"].transform(lambda x: x.rolling(p).std() * np.sqrt(252))
        elif name == "max_drawdown_60d":
            def calc_dd(g):
                rm = g.rolling(60).max()
                dd = (g - rm) / rm
                return dd.rolling(60).min()
            df["factor_value"] = df.groupby("symbol")["close"].transform(calc_dd)
        return df[["trade_date", "symbol", "factor_value"]]
