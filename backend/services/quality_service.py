"""质量检查服务 - wrapper for DataQualityChecker with DB integration"""
from quant_core.data.quality import DataQualityChecker, QualityCheckResult


class QualityService:
    def __init__(self, checker: DataQualityChecker, meta_db=None):
        self.checker = checker
        self.meta_db = meta_db

    def run_and_record(self, df, dataset: str, market: str, job_id: str = None):
        results = self.checker.run_all_checks(df, dataset, market)
        if self.meta_db and job_id:
            for cr in results:
                self.meta_db.record_quality_check(
                    job_id, cr.dataset, cr.market,
                    cr.check_type, cr.status, cr.details)
        return results
