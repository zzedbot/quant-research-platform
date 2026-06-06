"""数据质量检查"""
from dataclasses import dataclass
from datetime import datetime
import pandas as pd


@dataclass
class QualityCheckResult:
    check_type: str
    dataset: str
    market: str
    status: str  # "pass" | "warning" | "error"
    details: str
    row_count: int = 0
    checked_at: str = ""

    def __post_init__(self):
        if not self.checked_at:
            self.checked_at = datetime.now().isoformat()


class DataQualityChecker:
    def check_duplicate_primary_keys(self, df: pd.DataFrame,
                                      dataset: str, market: str) -> QualityCheckResult:
        if "trade_date" not in df.columns or "symbol" not in df.columns:
            return QualityCheckResult(
                check_type="duplicate_pk", dataset=dataset, market=market,
                status="error", details="Missing trade_date or symbol columns"
            )
        duplicates = df.duplicated(subset=["trade_date", "symbol"], keep=False)
        dup_count = duplicates.sum()
        if dup_count > 0:
            return QualityCheckResult(
                check_type="duplicate_pk", dataset=dataset, market=market,
                status="warning", details=f"Found {dup_count} rows with duplicate (trade_date, symbol)",
                row_count=len(df)
            )
        return QualityCheckResult(
            check_type="duplicate_pk", dataset=dataset, market=market,
            status="pass", details="No duplicate primary keys", row_count=len(df)
        )

    def check_ohlc_logic(self, df: pd.DataFrame,
                          dataset: str, market: str) -> QualityCheckResult:
        required = ["high", "low", "open", "close"]
        missing = [c for c in required if c not in df.columns]
        if missing:
            return QualityCheckResult(
                check_type="ohlc_logic", dataset=dataset, market=market,
                status="error", details=f"Missing columns: {missing}"
            )
        issues = []
        if (df["high"] < df["low"]).any():
            issues.append("high < low")
        if (df["high"] < df["open"]).any():
            issues.append("high < open")
        if (df["high"] < df["close"]).any():
            issues.append("high < close")
        if (df["low"] > df["open"]).any():
            issues.append("low > open")
        if (df["low"] > df["close"]).any():
            issues.append("low > close")
        if issues:
            return QualityCheckResult(
                check_type="ohlc_logic", dataset=dataset, market=market,
                status="warning", details=f"OHLC logic violations: {', '.join(issues)}"
            )
        return QualityCheckResult(
            check_type="ohlc_logic", dataset=dataset, market=market,
            status="pass", details="OHLC logic OK"
        )

    def check_price_extreme(self, df: pd.DataFrame,
                             dataset: str, market: str,
                             threshold_pct: float = 20.0) -> QualityCheckResult:
        if "pct_change" not in df.columns:
            return QualityCheckResult(
                check_type="price_extreme", dataset=dataset, market=market,
                status="error", details="Missing pct_change column"
            )
        extremes = df[df["pct_change"].abs() > threshold_pct]
        extreme_count = len(extremes)
        if extreme_count > 0:
            samples = extremes[["trade_date", "symbol", "pct_change"]].head(5)
            return QualityCheckResult(
                check_type="price_extreme", dataset=dataset, market=market,
                status="warning", details=f"Found {extreme_count} rows with |pct_change|>{threshold_pct}%. Samples: {samples.to_dict()}"
            )
        return QualityCheckResult(
            check_type="price_extreme", dataset=dataset, market=market,
            status="pass", details=f"No price changes exceed {threshold_pct}%"
        )

    def run_all_checks(self, df: pd.DataFrame, dataset: str,
                        market: str) -> list:
        return [
            self.check_duplicate_primary_keys(df, dataset, market),
            self.check_ohlc_logic(df, dataset, market),
            self.check_price_extreme(df, dataset, market),
        ]
