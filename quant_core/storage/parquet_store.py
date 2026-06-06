"""Parquet 存储引擎 - Raw/Clean/Feature 分区"""
import os
from datetime import date
from pathlib import Path
from typing import Optional
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq


class ParquetStore:
    """
    Parquet 存储引擎。

    路径规范:
      data/{zone}/{market}/{dataset}/
    其中 zone = raw | clean | feature
    """

    def __init__(self, base_dir: str):
        self.base_dir = Path(base_dir)
        self.zones = {
            "raw": self.base_dir / "raw",
            "clean": self.base_dir / "clean",
            "feature": self.base_dir / "feature",
        }
        for zone_path in self.zones.values():
            zone_path.mkdir(parents=True, exist_ok=True)

    def _dataset_path(self, zone: str, market: str, dataset: str) -> Path:
        """获取数据集的 Parquet 文件路径"""
        path = self.zones[zone] / market / dataset
        path.mkdir(parents=True, exist_ok=True)
        return path / f"{dataset}.parquet"

    def write(self, df: pd.DataFrame, zone: str, market: str, dataset: str) -> str:
        """
        写入 DataFrame 到 Parquet 文件（追加模式）。

        Args:
            df: 数据
            zone: raw | clean | feature
            market: CN | HK
            dataset: daily_bars | symbols | trade_calendar | ...

        Returns:
            文件路径字符串
        """
        path = self._dataset_path(zone, market, dataset)
        table = pa.Table.from_pandas(df)
        if path.exists():
            existing = pq.read_table(path)
            combined = pa.concat_tables([existing, table])
            pq.write_table(combined, path)
        else:
            pq.write_table(table, path)
        return str(path)

    def read(self, zone: str, market: str, dataset: str,
             start_date: Optional[str] = None,
             end_date: Optional[str] = None) -> pd.DataFrame:
        """
        读取 Parquet 文件，支持日期过滤。

        Args:
            zone: raw | clean | feature
            market: CN | HK
            dataset: 数据集名
            start_date: 起始日期 YYYY-MM-DD
            end_date: 结束日期 YYYY-MM-DD

        Returns:
            DataFrame
        """
        path = self._dataset_path(zone, market, dataset)
        if not path.exists():
            return pd.DataFrame()

        df = pq.read_pandas(path).to_pandas()

        if "trade_date" in df.columns:
            df["trade_date"] = pd.to_datetime(df["trade_date"]).dt.date
            if start_date:
                df = df[df["trade_date"] >= date.fromisoformat(start_date)]
            if end_date:
                df = df[df["trade_date"] <= date.fromisoformat(end_date)]

        return df

    def exists(self, zone: str, market: str, dataset: str) -> bool:
        """检查数据集是否存在"""
        path = self._dataset_path(zone, market, dataset)
        return path.exists()

    def latest_date(self, zone: str, market: str, dataset: str) -> Optional[str]:
        """获取数据集中最新日期"""
        df = self.read(zone, market, dataset)
        if df.empty or "trade_date" not in df.columns:
            return None
        return str(df["trade_date"].max())

    def row_count(self, zone: str, market: str, dataset: str) -> int:
        """获取数据集行数"""
        df = self.read(zone, market, dataset)
        return len(df)
