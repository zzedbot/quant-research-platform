"""股票基础信息模型"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date


class Symbol(BaseModel):
    """股票基础信息"""
    symbol: str = Field(..., description="平台内部证券代码")
    market: str = Field(..., description="CN 或 HK")
    exchange: str = Field(..., description="交易所，如 SSE, SZSE, HKEX")
    name: str = Field(..., description="证券名称")
    list_date: Optional[date] = Field(None, description="上市日期")
    delist_date: Optional[date] = Field(None, description="退市日期")
    security_type: str = Field("stock", description="stock / etf / index")
    currency: str = Field("CNY", description="CNY / HKD")
    is_active: bool = Field(True, description="是否仍在交易")

    class Config:
        frozen = True
