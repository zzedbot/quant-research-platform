import pandas as pd
class GrowthFactors:
    @classmethod
    def list_all(cls):
        return [
            {"name": "revenue_growth", "description": "营收增长率", "category": "growth"},
            {"name": "profit_growth", "description": "净利润增长率", "category": "growth"},
        ]
    @classmethod
    def compute(cls, name, bars, financials_df=None, params=None):
        from .momentum import MomentumFactors
        return MomentumFactors.compute("momentum_60d", bars, params)
