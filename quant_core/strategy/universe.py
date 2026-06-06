"""股票池管理 - 静态列表 + 简单过滤"""
from dataclasses import dataclass, field
from datetime import date
from typing import Optional
import pandas as pd


@dataclass
class Universe:
    """股票池"""
    id: str
    name: str
    description: str = ""
    symbols: list = field(default_factory=list)
    filters: list = field(default_factory=list)

    def get_symbols(self, store=None, calendar_df: pd.DataFrame = None) -> list:
        symbols = self.symbols.copy()
        if "exclude_st" in self.filters and store:
            symbols_df = store.read("clean", "CN", "symbols")
            if not symbols_df.empty:
                st_mask = symbols_df["name"].str.contains("ST", case=True, na=False)
                st_symbols = set(symbols_df.loc[st_mask, "symbol"])
                symbols = [s for s in symbols if s not in st_symbols]
        return symbols

    def to_dict(self) -> dict:
        return {"id": self.id, "name": self.name, "description": self.description,
                "symbols": self.symbols, "filters": self.filters}

    @classmethod
    def from_dict(cls, d: dict) -> "Universe":
        return cls(id=d["id"], name=d["name"], description=d.get("description", ""),
                   symbols=d.get("symbols", []), filters=d.get("filters", []))
