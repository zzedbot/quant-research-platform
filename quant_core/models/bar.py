"""日线行情模型"""
from pydantic import BaseModel, Field
from datetime import date


class DailyBar(BaseModel):
    """日线行情"""
    trade_date: date
    symbol: str
    market: str
    open: float
    high: float
    low: float
    close: float
    volume: float  # 股数
    amount: float  # 成交额（元）
    pre_close: float = 0.0
    change: float = 0.0
    pct_change: float = 0.0
    source: str = "akshare"
    data_version: str = ""

    class Config:
        frozen = True


class AdjustFactor(BaseModel):
    """复权因子"""
    trade_date: date
    symbol: str
    market: str
    adj_factor: float
    adj_type: str = "qfq"  # qfq=前复权, hfq=后复权

    class Config:
        frozen = True


class IndexBar(BaseModel):
    """指数日线行情"""
    trade_date: date
    symbol: str  # 指数代码，如 sh000001
    market: str = "CN"
    open: float
    high: float
    low: float
    close: float
    volume: float = 0.0
    amount: float = 0.0
    pct_change: float = 0.0
    source: str = "akshare"

    class Config:
        frozen = True
