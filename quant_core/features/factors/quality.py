import pandas as pd
class QualityFactors:
    @classmethod
    def list_all(cls):
        return [
            {"name": "roe", "description": "净资产收益率", "category": "quality"},
            {"name": "roa", "description": "总资产收益率", "category": "quality"},
            {"name": "gross_margin", "description": "毛利率", "category": "quality"},
            {"name": "net_margin", "description": "净利率", "category": "quality"},
        ]
    @classmethod
    def compute(cls, name, bars, financials_df=None, params=None):
        return pd.DataFrame(columns=["trade_date", "symbol", "factor_value"])
