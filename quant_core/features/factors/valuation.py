import pandas as pd
class ValuationFactors:
    @classmethod
    def list_all(cls):
        return [
            {"name": "pe_ttm", "description": "市盈率(TTM)", "category": "valuation"},
            {"name": "pb", "description": "市净率", "category": "valuation"},
            {"name": "ps_ttm", "description": "市销率(TTM)", "category": "valuation"},
        ]
    @classmethod
    def compute(cls, name, bars, financials_df=None, params=None):
        return pd.DataFrame(columns=["trade_date", "symbol", "factor_value"])
