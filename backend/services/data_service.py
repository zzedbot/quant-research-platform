"""数据更新/查询服务"""
import uuid
import pandas as pd

from quant_core.data.quality import DataQualityChecker
from backend.api.schemas import DataStatusItem, JobInfo, QualityCheckInfo


class DataService:
    def __init__(self, portal):
        self.portal = portal
        self.meta_db = portal.meta_db
        self.checker = DataQualityChecker()

    def trigger_update(self, request) -> dict:
        job_id = str(uuid.uuid4())[:8]
        markets = request.markets
        datasets = request.datasets
        start = request.start_date
        end = request.end_date or pd.Timestamp.today().date().isoformat()

        self.meta_db.create_job(job_id, self.portal.default_source,
                                 markets, datasets, start, end)

        details = {}
        total_rows = 0

        try:
            for market in markets:
                if "symbols" in datasets:
                    count = self.portal.fetch_and_store_symbols(market, job_id)
                    details[f"symbols_{market}"] = count
                    total_rows += count

                if "trade_calendar" in datasets:
                    count = self.portal.fetch_and_store_calendar(market, start, end, job_id)
                    details[f"calendar_{market}"] = count
                    total_rows += count

                if "daily_bars" in datasets:
                    if request.symbols:
                        count = self.portal.fetch_and_store_daily_bars(
                            request.symbols, market, start, end, job_id=job_id)
                    else:
                        symbols_df = self.portal.store.read("clean", market, "symbols")
                        if symbols_df.empty:
                            symbols_df = self.portal.fetch_and_store_symbols(market)
                        symbols = symbols_df["symbol"].tolist()[:50]
                        count = self.portal.fetch_and_store_daily_bars(
                            symbols, market, start, end, job_id=job_id)
                    details[f"bars_{market}"] = count
                    total_rows += count

                    bars_df = self.portal.store.read("clean", market, "daily_bars", start, end)
                    if not bars_df.empty:
                        check_results = self.checker.run_all_checks(
                            bars_df, "daily_bars", market)
                        for cr in check_results:
                            self.meta_db.record_quality_check(
                                job_id, cr.dataset, cr.market,
                                cr.check_type, cr.status, cr.details)

                if "index_daily_bars" in datasets:
                    index_codes = ["sh000001", "sz399001", "sz399006", "sh000300", "sh000016"]
                    count = self.portal.fetch_and_store_index_bars(index_codes, start, end, job_id)
                    details[f"index_bars"] = count
                    total_rows += count

            self.meta_db.update_job(job_id, "completed", row_count=total_rows)

        except Exception as e:
            self.meta_db.update_job(job_id, "failed", error_message=str(e))
            return {"job_id": job_id, "status": "failed", "error": str(e), "details": details}

        return {"job_id": job_id, "status": "completed", "details": details}

    def get_data_status(self) -> list:
        db_status = self.meta_db.get_data_status()
        if db_status:
            return [DataStatusItem(**s) for s in db_status]

        items = []
        for market in ["CN", "HK"]:
            for dataset in ["daily_bars", "symbols", "trade_calendar", "index_daily_bars"]:
                if self.portal.store.exists("clean", market, dataset):
                    items.append(DataStatusItem(
                        dataset=dataset, market=market,
                        latest_date=self.portal.store.latest_date("clean", market, dataset),
                        row_count=self.portal.store.row_count("clean", market, dataset),
                    ))
        return items

    def get_jobs(self, limit: int = 50) -> list:
        return [JobInfo(**j) for j in self.meta_db.get_jobs(limit)]

    def get_quality_checks(self, limit: int = 50) -> list:
        return [QualityCheckInfo(**q) for q in self.meta_db.get_quality_checks(limit)]
