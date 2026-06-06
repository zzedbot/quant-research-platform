"""数据源适配器统一接口"""
from abc import ABC, abstractmethod
import pandas as pd


class MarketDataAdapter(ABC):
    """
    数据源适配器抽象基类。

    所有数据源（AkShare, Tushare, CSV 等）必须实现此接口，
    确保上层代码不依赖特定数据源。
    """

    @property
    @abstractmethod
    def source_name(self) -> str:
        """数据源名称，如 'akshare'"""
        ...

    @abstractmethod
    def get_source_capabilities(self) -> dict:
        """
        返回数据源能力声明。

        示例:
        {
            "market": ["CN", "HK"],
            "frequencies": ["1d"],
            "supports_financials": false,
            "supports_adjust_factor": true,
            "rate_limit": 1.0
        }
        """
        ...

    @abstractmethod
    def list_symbols(self, market: str) -> pd.DataFrame:
        """
        获取市场所有证券基础信息。

        Args:
            market: "CN" (A股) 或 "HK" (港股)

        Returns:
            DataFrame with columns: symbol, name, list_date, security_type, exchange, currency, is_active
        """
        ...

    @abstractmethod
    def get_trade_calendar(self, market: str, start: str, end: str) -> pd.DataFrame:
        """
        获取交易日历。

        Args:
            market: "CN" 或 "HK"
            start: "YYYY-MM-DD"
            end: "YYYY-MM-DD"

        Returns:
            DataFrame with columns: trade_date, market, is_open
        """
        ...

    @abstractmethod
    def get_daily_bars(self, symbols: list, market: str,
                       start: str, end: str, adjust: str = "qfq") -> pd.DataFrame:
        """
        获取日线行情。

        Args:
            symbols: 证券代码列表
            market: "CN" 或 "HK"
            start: "YYYY-MM-DD"
            end: "YYYY-MM-DD"
            adjust: "qfq" (前复权) / "hfq" (后复权) / "" (不复权)

        Returns:
            DataFrame with columns: trade_date, symbol, market, open, high, low, close,
            volume, amount, pre_close, change, pct_change
        """
        ...

    @abstractmethod
    def get_adjust_factors(self, symbols: list, market: str,
                           start: str, end: str) -> pd.DataFrame:
        """
        获取复权因子。

        Args:
            symbols: 证券代码列表
            market: "CN" 或 "HK"
            start: "YYYY-MM-DD"
            end: "YYYY-MM-DD"

        Returns:
            DataFrame with columns: trade_date, symbol, market, adj_factor, adj_type
        """
        ...

    @abstractmethod
    def get_index_bars(self, index_code: str, start: str, end: str) -> pd.DataFrame:
        """
        获取指数日线行情。

        Args:
            index_code: 指数代码，如 "sh000001" (上证指数)
            start: "YYYY-MM-DD"
            end: "YYYY-MM-DD"

        Returns:
            DataFrame with columns: trade_date, symbol, market, open, high, low, close,
            volume, amount, pct_change
        """
        ...
