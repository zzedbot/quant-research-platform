"""Pydantic 请求/响应模型"""
from pydantic import BaseModel, Field
from typing import Optional


class DataUpdateRequest(BaseModel):
    markets: list[str] = Field(default=["CN"], description="市场: CN, HK")
    datasets: list[str] = Field(
        default=["daily_bars", "symbols", "trade_calendar"],
        description="数据集: daily_bars, symbols, trade_calendar, index_daily_bars"
    )
    start_date: str = Field(default="2025-01-01", description="起始日期")
    end_date: str = Field(default="", description="结束日期，空=今天")
    symbols: Optional[list[str]] = Field(None, description="指定证券代码")


class DataUpdateResponse(BaseModel):
    job_id: str
    status: str
    started_at: str = ""


class DataStatusItem(BaseModel):
    dataset: str
    market: str
    latest_date: Optional[str] = None
    row_count: int = 0
    last_updated: Optional[str] = None


class JobInfo(BaseModel):
    job_id: str
    data_source: str
    markets: str
    datasets: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    started_at: str
    finished_at: Optional[str] = None
    status: str
    row_count: int = 0
    error_message: Optional[str] = None


class QualityCheckInfo(BaseModel):
    check_id: int
    job_id: str
    dataset: str
    market: str
    check_type: str
    status: str
    details: Optional[str] = None
    checked_at: str
