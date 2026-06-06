import uuid
from datetime import date
import pandas as pd
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
        # Replace NaN/inf for JSON serialization
        import numpy as np
        factor_df["factor_value"] = factor_df["factor_value"].replace([np.inf, -np.inf], np.nan)
        bars["next_return"] = bars.groupby("symbol")["close"].pct_change(-1).shift(-1)
        returns_df = bars[["trade_date", "symbol", "next_return"]].dropna()
        ic_df = ICAnalyzer.compute_ic(factor_df, returns_df)
        ic_stats = ICAnalyzer.ic_statistics(ic_df) if not ic_df.empty else {}
        quantile_df = QuantileAnalyzer.compute_quantile_returns(factor_df, returns_df, n_quantiles=5)
        q_spread = QuantileAnalyzer.quantile_spread(quantile_df)
        dist = DistributionAnalyzer.compute_distribution(factor_df)
        # Convert dates to strings for JSON
        factor_out = factor_df.head(50).copy()
        factor_out["trade_date"] = factor_out["trade_date"].astype(str)
        factor_out = factor_out.where(pd.notnull(factor_out), None)
        return {
            "factor_name": factor_name, "symbol_count": int(bars["symbol"].nunique()),
            "date_count": int(bars["trade_date"].nunique()),
            "ic_statistics": ic_stats, "quantile_spread": q_spread, "distribution": dist,
            "factor_data": factor_out.to_dict(orient="records"),
        }

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
