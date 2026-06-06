"""交易日历工具"""
from datetime import date
from typing import Optional
import pandas as pd


class TradeCalendar:
    """交易日历管理器"""

    def __init__(self, df: pd.DataFrame):
        self._data = df.copy()
        self._data["trade_date"] = pd.to_datetime(self._data["trade_date"])

    def is_trade_day(self, d: date, market: str = "CN") -> bool:
        mask = (
            (self._data["trade_date"] == pd.Timestamp(d)) &
            (self._data["market"] == market) &
            (self._data["is_open"] == True)
        )
        return mask.any()

    def get_trade_days(self, start: date, end: date,
                       market: str = "CN") -> list:
        mask = (
            (self._data["trade_date"] >= pd.Timestamp(start)) &
            (self._data["trade_date"] <= pd.Timestamp(end)) &
            (self._data["market"] == market) &
            (self._data["is_open"] == True)
        )
        return sorted(self._data.loc[mask, "trade_date"].dt.date.unique())

    def latest_trade_day(self, market: str = "CN") -> Optional[date]:
        mask = (self._data["market"] == market) & (self._data["is_open"] == True)
        days = self._data.loc[mask, "trade_date"]
        if days.empty:
            return None
        return days.max().date()
