import pandas as pd
import numpy as np
from .base import Factor

class TechnicalFactor(Factor):
    pass

class MAFactor(TechnicalFactor):
    def __init__(self, period=20):
        self.period = period
    def name(self): return f"ma_{self.period}"
    def description(self): return f"{self.period}日移动平均线"
    def category(self): return "technical"
    def compute(self, bars, params=None):
        df = bars.copy()
        df["factor_value"] = df.groupby("symbol")["close"].transform(lambda x: x.rolling(self.period).mean())
        return df[["trade_date", "symbol", "factor_value"]]

class MACDFactor(TechnicalFactor):
    def __init__(self, fast=12, slow=26, signal=9):
        self.fast, self.slow, self.signal = fast, slow, signal
    def name(self): return f"macd_{self.fast}_{self.slow}_{self.signal}"
    def description(self): return "MACD指数平滑异同移动平均线"
    def category(self): return "technical"
    def compute(self, bars, params=None):
        df = bars.copy()
        def calc(group):
            ef = group["close"].ewm(span=self.fast, adjust=False).mean()
            es = group["close"].ewm(span=self.slow, adjust=False).mean()
            dif = ef - es
            dea = dif.ewm(span=self.signal, adjust=False).mean()
            return (dif - dea) * 2
        df["factor_value"] = df.groupby("symbol").apply(calc, include_groups=False).reset_index(level=0, drop=True)
        return df[["trade_date", "symbol", "factor_value"]]

class RSIFactor(TechnicalFactor):
    def __init__(self, period=14):
        self.period = period
    def name(self): return f"rsi_{self.period}"
    def description(self): return f"{self.period}日相对强弱指标"
    def category(self): return "technical"
    def compute(self, bars, params=None):
        df = bars.copy()
        def calc(group):
            delta = group["close"].diff()
            gain = delta.where(delta > 0, 0.0)
            loss = (-delta).where(delta < 0, 0.0)
            ag = gain.rolling(self.period).mean()
            al = loss.rolling(self.period).mean()
            rs = ag / al
            return 100 - (100 / (1 + rs))
        df["factor_value"] = df.groupby("symbol").apply(calc, include_groups=False).reset_index(level=0, drop=True)
        return df[["trade_date", "symbol", "factor_value"]]

class BollFactor(TechnicalFactor):
    def __init__(self, period=20, num_std=2.0):
        self.period, self.num_std = period, num_std
    def name(self): return f"boll_{self.period}"
    def description(self): return "布林带相对位置"
    def category(self): return "technical"
    def compute(self, bars, params=None):
        df = bars.copy()
        def calc(group):
            mid = group["close"].rolling(self.period).mean()
            std = group["close"].rolling(self.period).std()
            upper = mid + self.num_std * std
            lower = mid - self.num_std * std
            w = upper - lower
            return ((group["close"] - lower) / w).replace([np.inf, -np.inf], np.nan)
        df["factor_value"] = df.groupby("symbol").apply(calc, include_groups=False).reset_index(level=0, drop=True)
        return df[["trade_date", "symbol", "factor_value"]]

class ATRFactor(TechnicalFactor):
    def __init__(self, period=14):
        self.period = period
    def name(self): return f"atr_{self.period}"
    def description(self): return "归一化真实波动幅度"
    def category(self): return "technical"
    def compute(self, bars, params=None):
        df = bars.copy()
        def calc(group):
            h, l, c = group["high"], group["low"], group["close"]
            pc = c.shift(1)
            tr = pd.concat([h-l, (h-pc).abs(), (l-pc).abs()], axis=1).max(axis=1)
            atr = tr.rolling(self.period).mean()
            return atr / c
        df["factor_value"] = df.groupby("symbol").apply(calc, include_groups=False).reset_index(level=0, drop=True)
        return df[["trade_date", "symbol", "factor_value"]]

class VolumeRatioFactor(TechnicalFactor):
    def __init__(self, period=5):
        self.period = period
    def name(self): return f"vol_ratio_{self.period}"
    def description(self): return f"成交量/{self.period}日均量"
    def category(self): return "technical"
    def compute(self, bars, params=None):
        df = bars.copy()
        vm = df.groupby("symbol")["volume"].transform(lambda x: x.rolling(self.period).mean())
        df["factor_value"] = df["volume"] / vm
        return df[["trade_date", "symbol", "factor_value"]]

class TechnicalFactors:
    _factors = {}
    @classmethod
    def register_all(cls):
        cls._factors = {
            "ma_5": MAFactor(5), "ma_10": MAFactor(10), "ma_20": MAFactor(20), "ma_60": MAFactor(60),
            "macd_12_26_9": MACDFactor(12, 26, 9),
            "rsi_6": RSIFactor(6), "rsi_14": RSIFactor(14), "rsi_24": RSIFactor(24),
            "boll_20": BollFactor(20), "atr_14": ATRFactor(14), "vol_ratio_5": VolumeRatioFactor(5),
        }
    @classmethod
    def get(cls, name):
        if not cls._factors: cls.register_all()
        return cls._factors.get(name)
    @classmethod
    def list_all(cls):
        if not cls._factors: cls.register_all()
        return [{"name": f.name(), "description": f.description(), "category": f.category()} for f in cls._factors.values()]
    @classmethod
    def compute(cls, name, bars, params=None):
        factor = cls.get(name)
        if not factor: raise ValueError(f"Unknown factor: {name}")
        return factor.compute(bars, params)
