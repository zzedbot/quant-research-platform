"""AkShare 数据源适配器 - 使用 Sina/腾讯源绕过东财阻断"""
import pandas as pd
import urllib.request
import json
import re
from datetime import date
from .adapter import MarketDataAdapter


def _fetch_sina(symbols: str) -> str:
    """新浪财经批量行情"""
    url = f"https://hq.sinajs.cn/list={symbols}"
    req = urllib.request.Request(url, headers={"Referer": "https://finance.sina.com.cn/"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.read().decode("gbk", errors="replace")


def _fetch_tencent(symbols: str) -> str:
    """腾讯财经批量行情"""
    url = f"https://qt.gtimg.cn/q={symbols}"
    req = urllib.request.Request(url, headers={"Referer": "https://finance.qq.com/"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.read().decode("gbk", errors="replace")


def _fetch_sina_daily(symbol: str, adjust: str = "qfq") -> pd.DataFrame:
    """新浪财经日K线（通过 money.finance.sina.com.cn）"""
    url = f"https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData"
    params = f"symbol={symbol}&scale=240&ma=no&datalen=10000"
    full_url = f"{url}?{params}"
    req = urllib.request.Request(full_url, headers={"Referer": "https://finance.sina.com.cn/"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8", errors="replace"))
    if not data:
        return pd.DataFrame()
    df = pd.DataFrame(data)
    df = df.rename(columns={
        "day": "trade_date", "open": "open", "high": "high",
        "low": "low", "close": "close", "volume": "volume",
    })
    df["trade_date"] = pd.to_datetime(df["trade_date"]).dt.date
    for col in ["open", "high", "low", "close", "volume"]:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)
    df["amount"] = 0.0
    df["pre_close"] = 0.0
    df["change"] = 0.0
    df["pct_change"] = 0.0
    # Calculate pct_change from previous close
    for i in range(1, len(df)):
        prev = df.iloc[i-1]["close"]
        if prev > 0:
            df.iloc[i, df.columns.get_loc("pct_change")] = round(
                (df.iloc[i]["close"] - prev) / prev * 100, 2)
            df.iloc[i, df.columns.get_loc("change")] = round(
                df.iloc[i]["close"] - prev, 2)
            df.iloc[i, df.columns.get_loc("pre_close")] = prev
    return df


class AkShareAdapter(MarketDataAdapter):
    """
    AkShare 数据源适配器。

    使用 Sina/腾讯 API 直连（绕过 push2his.eastmoney.com 阻断）。
    """

    @property
    def source_name(self) -> str:
        return "akshare"

    def get_source_capabilities(self) -> dict:
        return {
            "market": ["CN", "HK"],
            "frequencies": ["1d"],
            "supports_financials": False,
            "supports_events": False,
            "supports_adjust_factor": True,
            "rate_limit": 1.0,
        }

    def list_symbols(self, market: str) -> pd.DataFrame:
        """获取 A 股或港股所有证券基础信息"""
        if market == "CN":
            text = _fetch_sina("sh600519,sz000001,sh601318,sz002594,sh600036,sz000858")
            # Parse Sina format
            rows = []
            for line in text.strip().split("\n"):
                m = re.search(r'hq_str_(\w+)="(.*)"', line)
                if m:
                    code, data = m.group(1), m.group(2)
                    fields = data.split(",")
                    if len(fields) >= 32:
                        rows.append({
                            "symbol": code,
                            "market": "CN",
                            "exchange": "SSE" if code.startswith("sh") else "SZSE",
                            "name": fields[0],
                            "list_date": None,
                            "security_type": "stock",
                            "currency": "CNY",
                            "is_active": True,
                        })
            return pd.DataFrame(rows)
        elif market == "HK":
            text = _fetch_tencent("hk00700,hk09988,hk03690,hk09618,hk02318,hk01810")
            rows = []
            for line in text.strip().split("\n"):
                m = re.search(r'v_(\w+)="(.*)"', line)
                if m:
                    code, data = m.group(1), m.group(2)
                    f = data.split("~")
                    if len(f) >= 50:
                        rows.append({
                            "symbol": code,
                            "market": "HK",
                            "exchange": "HKEX",
                            "name": f[1],
                            "list_date": None,
                            "security_type": "stock",
                            "currency": "HKD",
                            "is_active": True,
                        })
            return pd.DataFrame(rows)
        raise ValueError(f"Unknown market: {market}")

    def get_trade_calendar(self, market: str, start: str, end: str) -> pd.DataFrame:
        """获取交易日历 - 通过上证指数日K推算"""
        # Use Sina index daily data
        try:
            df = _fetch_sina_daily("sh000001")
            if df.empty:
                return pd.DataFrame(columns=["trade_date", "market", "is_open"])
            start_d = date.fromisoformat(start)
            end_d = date.fromisoformat(end)
            mask = (df["trade_date"] >= start_d) & (df["trade_date"] <= end_d)
            dates = df.loc[mask, "trade_date"].unique()
            return pd.DataFrame({
                "trade_date": sorted(dates),
                "market": "CN",
                "is_open": True,
            })
        except Exception:
            return pd.DataFrame(columns=["trade_date", "market", "is_open"])

    def get_daily_bars(self, symbols: list, market: str,
                       start: str, end: str, adjust: str = "qfq") -> pd.DataFrame:
        """获取日线行情（Sina 源）"""
        start_d = date.fromisoformat(start)
        end_d = date.fromisoformat(end)
        all_bars = []

        for symbol in symbols:
            try:
                if market == "CN":
                    df = _fetch_sina_daily(symbol, adjust)
                    if df.empty:
                        continue
                    df["symbol"] = symbol
                    df["market"] = "CN"
                elif market == "HK":
                    # Use Tencent API for HK daily
                    code = symbol.replace("hk", "")
                    df = self._fetch_tencent_daily(f"hk{code}")
                    if df.empty:
                        continue
                    df["symbol"] = symbol
                    df["market"] = "HK"
                else:
                    continue

                # Date filter
                if not df.empty:
                    mask = (df["trade_date"] >= start_d) & (df["trade_date"] <= end_d)
                    df = df.loc[mask]

                if not df.empty:
                    all_bars.append(df)
            except Exception as e:
                print(f"  Warning: Failed to fetch {symbol}: {e}")

        if not all_bars:
            return pd.DataFrame()

        combined = pd.concat(all_bars, ignore_index=True)
        std_cols = ["trade_date", "symbol", "market", "open", "high", "low",
                     "close", "volume", "amount", "pre_close", "change", "pct_change"]
        available = [c for c in std_cols if c in combined.columns]
        combined = combined[available].copy()
        combined["source"] = "akshare"
        combined["data_version"] = date.today().isoformat()
        return combined

    def get_adjust_factors(self, symbols: list, market: str,
                           start: str, end: str) -> pd.DataFrame:
        """MVP 1 返回空 DataFrame"""
        return pd.DataFrame(columns=["trade_date", "symbol", "market", "adj_factor", "adj_type"])

    def get_index_bars(self, index_code: str, start: str, end: str) -> pd.DataFrame:
        """获取指数日线行情"""
        try:
            df = _fetch_sina_daily(index_code)
            if df.empty:
                return df
            df["symbol"] = index_code
            df["market"] = "CN"
            df["source"] = "akshare"
            start_d = date.fromisoformat(start)
            end_d = date.fromisoformat(end)
            mask = (df["trade_date"] >= start_d) & (df["trade_date"] <= end_d)
            df = df.loc[mask]
            return df
        except Exception as e:
            print(f"Warning: Failed to fetch index {index_code}: {e}")
            return pd.DataFrame()

    def _fetch_tencent_daily(self, symbol: str) -> pd.DataFrame:
        """腾讯财经日K线"""
        code = symbol.replace("hk", "")
        url = f"http://web.ifzq.gtimg.cn/appstock/app/hkfqkline/get?param=hk{code},day,,,1000,qfq"
        req = urllib.request.Request(url, headers={"Referer": "https://finance.qq.com/"})
        with urllib.request.urlopen(req, timeout=20) as resp:
            jdata = json.loads(resp.read())

        stock_data = jdata.get("data", {}).get(f"hk{code}", {})
        klines = stock_data.get("qfqday", []) or stock_data.get("day", [])
        if not klines:
            return pd.DataFrame()

        # Tencent HK API returns variable columns (6-9).
        # Positions: [date, open, close, high, low, volume, extra_info, pct_change, amount]
        rows = []
        for k in klines:
            rows.append({
                "trade_date": k[0],
                "open": float(k[1]) if len(k) > 1 else 0,
                "close": float(k[2]) if len(k) > 2 else 0,
                "high": float(k[3]) if len(k) > 3 else 0,
                "low": float(k[4]) if len(k) > 4 else 0,
                "volume": float(k[5]) if len(k) > 5 else 0,
            })

        df = pd.DataFrame(rows)
        df["trade_date"] = pd.to_datetime(df["trade_date"]).dt.date
        for col in ["open", "high", "low", "close", "volume"]:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)
        df["amount"] = 0.0
        df["pre_close"] = 0.0
        df["change"] = 0.0
        df["pct_change"] = 0.0
        # Calculate pct_change
        for i in range(1, len(df)):
            prev = df.iloc[i-1]["close"]
            if prev > 0:
                df.iloc[i, df.columns.get_loc("pct_change")] = round(
                    (df.iloc[i]["close"] - prev) / prev * 100, 2)
                df.iloc[i, df.columns.get_loc("change")] = round(
                    df.iloc[i]["close"] - prev, 2)
                df.iloc[i, df.columns.get_loc("pre_close")] = prev
        return df
