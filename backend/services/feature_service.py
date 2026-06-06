import uuid
import math
from datetime import date
import pandas as pd
import numpy as np
from quant_core.features.factors.technical import TechnicalFactors
from quant_core.features.factors.momentum import MomentumFactors
from quant_core.features.factors.volatility import VolatilityFactors
from quant_core.features.liquidity import LiquidityFactors
from quant_core.features.factors.valuation import ValuationFactors
from quant_core.features.factors.quality import QualityFactors
from quant_core.features.factors.growth import GrowthFactors
from quant_core.features.analysis.ic import ICAnalyzer
from quant_core.features.analysis.quantile import QuantileAnalyzer
from quant_core.features.analysis.distribution import DistributionAnalyzer


def sanitize(obj):
    if isinstance(obj, dict):
        return {k: sanitize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [sanitize(i) for i in obj]
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj): return None
    if isinstance(obj, (np.floating, np.integer)):
        v = float(obj) if isinstance(obj, np.floating) else int(obj)
        if isinstance(obj, np.floating) and (math.isnan(v) or math.isinf(v)): return None
        return v
    if isinstance(obj, np.bool_): return bool(obj)
    return obj


class FeatureService:
    def __init__(self, portal):
        self.portal = portal

    def list_factors(self):
        factors = []
        factors += TechnicalFactors.list_all()
        factors += MomentumFactors.list_all()
        factors += VolatilityFactors.list_all()
        factors += LiquidityFactors.list_all()
        factors += ValuationFactors.list_all()
        factors += QualityFactors.list_all()
        factors += GrowthFactors.list_all()
        return factors

    def compute_factor(self, factor_name, symbols, market, start, end):
        bars = self.portal.read_daily_bars(symbols=symbols, market=market, start=start, end=end)
        if bars.empty:
            return {"error": "No data"}
        factor_df = self._compute_factor(factor_name, bars)
        if factor_df.empty:
            return {"error": "Factor computation failed"}
        # Sanitize
        factor_df["factor_value"] = factor_df["factor_value"].replace([np.inf, -np.inf], np.nan)
        bars["next_return"] = bars.groupby("symbol")["close"].pct_change(-1).shift(-1)
        bars["next_return"] = bars["next_return"].replace([np.inf, -np.inf], np.nan)
        returns_df = bars[["trade_date", "symbol", "next_return"]].dropna()
        ic_df = ICAnalyzer.compute_ic(factor_df, returns_df)
        ic_stats = ICAnalyzer.ic_statistics(ic_df) if not ic_df.empty else {}
        quantile_df = QuantileAnalyzer.compute_quantile_returns(factor_df, returns_df, n_quantiles=5)
        q_spread = QuantileAnalyzer.quantile_spread(quantile_df)
        dist = DistributionAnalyzer.compute_distribution(factor_df)
        # Convert for JSON
        factor_out = factor_df.head(50).copy()
        factor_out["trade_date"] = factor_out["trade_date"].astype(str)
        factor_out["factor_value"] = factor_out["factor_value"].where(pd.notnull(factor_out["factor_value"]), None)
        result = {
            "factor_name": factor_name, "symbol_count": int(bars["symbol"].nunique()),
            "date_count": int(bars["trade_date"].nunique()),
            "ic_statistics": ic_stats, "quantile_spread": q_spread, "distribution": dist,
            "factor_data": factor_out.to_dict(orient="records"),
        }
        return sanitize(result)

    def _compute_factor(self, name, bars):
        factor = TechnicalFactors.get(name)
        if factor: return factor.compute(bars)
        if name.startswith("momentum"): return MomentumFactors.compute(name, bars)
        if name.startswith("volatility"): return VolatilityFactors.compute(name, bars)
        if name in ("amount", "turnover", "amihud"): return LiquidityFactors.compute(name, bars)
        if name in ("pe_ttm", "pb", "ps_ttm"): return ValuationFactors.compute(name, bars)
        if name in ("roe", "roa", "gross_margin", "net_margin"): return QualityFactors.compute(name, bars)
        if name in ("revenue_growth", "profit_growth"): return GrowthFactors.compute(name, bars)
        raise ValueError(f"Unknown factor: {name}")
