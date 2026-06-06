"""DataPortal - 统一数据入口"""
import os
import yaml
import pandas as pd
from typing import Optional

from .adapter import MarketDataAdapter
from .akshare_adapter import AkShareAdapter
from .calendar import TradeCalendar
from ..storage.parquet_store import ParquetStore
from ..storage.meta_db import MetaDB


class DataPortal:
    """统一数据入口，协调数据适配器、存储和质量检查"""

    @classmethod
    def from_config(cls, config_path: str) -> "DataPortal":
        with open(config_path, "r") as f:
            config = yaml.safe_load(f)

        storage_cfg = config.get("storage", {})
        base_dir = os.path.dirname(os.path.abspath(config_path))

        def resolve_path(p):
            if not os.path.isabs(p):
                return os.path.join(base_dir, "..", p)
            return p

        data_dir = resolve_path(storage_cfg.get("raw_dir", "data").rsplit("/", 1)[0] if "/" in storage_cfg.get("raw_dir", "data") else "data")

        store = ParquetStore(data_dir)
        meta_db = MetaDB(storage_cfg.get("meta_db", os.path.join(data_dir, "meta.db")))

        adapters = {}
        default_source = config.get("default_source", "akshare")
        if default_source == "akshare":
            adapters["akshare"] = AkShareAdapter()

        return cls(store, meta_db, adapters, default_source)

    def __init__(self, store: ParquetStore, meta_db: MetaDB,
                 adapters: dict, default_source: str = "akshare"):
        self.store = store
        self.meta_db = meta_db
        self.adapters = adapters
        self.default_source = default_source

    def get_adapter(self, source: str = None) -> MarketDataAdapter:
        source = source or self.default_source
        if source not in self.adapters:
            raise ValueError(f"Unknown data source: {source}")
        return self.adapters[source]

    def fetch_and_store_daily_bars(self, symbols: list, market: str,
                                    start: str, end: str,
                                    adjust: str = "qfq",
                                    job_id: str = None) -> int:
        adapter = self.get_adapter()
        bars = adapter.get_daily_bars(symbols, market, start, end, adjust)
        if bars.empty:
            return 0
        self.store.write(bars, "raw", market, "daily_bars")
        self.store.write(bars, "clean", market, "daily_bars")
        return len(bars)

    def fetch_and_store_symbols(self, market: str, job_id: str = None) -> int:
        adapter = self.get_adapter()
        symbols = adapter.list_symbols(market)
        if symbols.empty:
            return 0
        self.store.write(symbols, "raw", market, "symbols")
        self.store.write(symbols, "clean", market, "symbols")
        return len(symbols)

    def fetch_and_store_calendar(self, market: str, start: str, end: str,
                                  job_id: str = None) -> int:
        adapter = self.get_adapter()
        calendar = adapter.get_trade_calendar(market, start, end)
        if calendar.empty:
            return 0
        self.store.write(calendar, "raw", market, "trade_calendar")
        self.store.write(calendar, "clean", market, "trade_calendar")
        return len(calendar)

    def fetch_and_store_index_bars(self, index_codes: list,
                                    start: str, end: str,
                                    job_id: str = None) -> int:
        adapter = self.get_adapter()
        all_bars = []
        for code in index_codes:
            bars = adapter.get_index_bars(code, start, end)
            if not bars.empty:
                all_bars.append(bars)
        if not all_bars:
            return 0
        combined = pd.concat(all_bars, ignore_index=True)
        self.store.write(combined, "raw", "CN", "index_daily_bars")
        self.store.write(combined, "clean", "CN", "index_daily_bars")
        return len(combined)

    def read_daily_bars(self, symbols: list = None, market: str = "CN",
                        start: str = None, end: str = None) -> pd.DataFrame:
        return self.store.read("clean", market, "daily_bars", start, end)

    def get_calendar(self, market: str = "CN") -> TradeCalendar:
        df = self.store.read("clean", market, "trade_calendar")
        return TradeCalendar(df)
