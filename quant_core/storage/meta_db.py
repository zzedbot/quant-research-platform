"""SQLite 元数据库 - 数据更新任务、质量检查、数据状态"""
import sqlite3
from pathlib import Path
from datetime import datetime
from typing import Optional
from contextlib import contextmanager


class MetaDB:
    """
    SQLite 元数据库。

    表:
      - data_update_jobs: 数据更新任务
      - data_quality_checks: 质量检查结果
      - data_status: 各数据集最新状态
    """

    def __init__(self, db_path: str):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_tables()

    @contextmanager
    def connection(self):
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()

    def _init_tables(self):
        with self.connection() as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS data_update_jobs (
                    job_id TEXT PRIMARY KEY,
                    data_source TEXT NOT NULL,
                    markets TEXT NOT NULL,
                    datasets TEXT NOT NULL,
                    start_date TEXT,
                    end_date TEXT,
                    started_at TEXT NOT NULL,
                    finished_at TEXT,
                    status TEXT NOT NULL DEFAULT 'running',
                    row_count INTEGER DEFAULT 0,
                    error_message TEXT
                );

                CREATE TABLE IF NOT EXISTS data_quality_checks (
                    check_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    job_id TEXT NOT NULL,
                    dataset TEXT NOT NULL,
                    market TEXT NOT NULL,
                    check_type TEXT NOT NULL,
                    status TEXT NOT NULL,
                    details TEXT,
                    checked_at TEXT NOT NULL,
                    FOREIGN KEY (job_id) REFERENCES data_update_jobs(job_id)
                );

                CREATE TABLE IF NOT EXISTS data_status (
                    dataset TEXT NOT NULL,
                    market TEXT NOT NULL,
                    latest_date TEXT,
                    row_count INTEGER DEFAULT 0,
                    last_updated TEXT NOT NULL,
                    PRIMARY KEY (dataset, market)
                );
            """)

    def create_job(self, job_id: str, data_source: str, markets: list,
                   datasets: list, start_date: str, end_date: str):
        """创建数据更新任务"""
        with self.connection() as conn:
            conn.execute(
                """INSERT INTO data_update_jobs
                   (job_id, data_source, markets, datasets, start_date, end_date, started_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (job_id, data_source, ",".join(markets), ",".join(datasets),
                 start_date, end_date, datetime.now().isoformat())
            )

    def update_job(self, job_id: str, status: str, row_count: int = 0,
                   error_message: str = None):
        """更新任务状态"""
        with self.connection() as conn:
            conn.execute(
                """UPDATE data_update_jobs
                   SET status=?, finished_at=?, row_count=?, error_message=?
                   WHERE job_id=?""",
                (status, datetime.now().isoformat(), row_count, error_message, job_id)
            )

    def get_jobs(self, limit: int = 50) -> list:
        """获取任务历史"""
        with self.connection() as conn:
            rows = conn.execute(
                "SELECT * FROM data_update_jobs ORDER BY started_at DESC LIMIT ?",
                (limit,)
            ).fetchall()
            return [dict(r) for r in rows]

    def get_job(self, job_id: str) -> Optional[dict]:
        """获取单个任务"""
        with self.connection() as conn:
            row = conn.execute(
                "SELECT * FROM data_update_jobs WHERE job_id=?", (job_id,)
            ).fetchone()
            return dict(row) if row else None

    def record_quality_check(self, job_id: str, dataset: str, market: str,
                             check_type: str, status: str, details: str = None):
        """记录质量检查结果"""
        with self.connection() as conn:
            conn.execute(
                """INSERT INTO data_quality_checks
                   (job_id, dataset, market, check_type, status, details, checked_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (job_id, dataset, market, check_type, status, details,
                 datetime.now().isoformat())
            )

    def get_quality_checks(self, limit: int = 50) -> list:
        """获取质量检查结果"""
        with self.connection() as conn:
            rows = conn.execute(
                "SELECT * FROM data_quality_checks ORDER BY checked_at DESC LIMIT ?",
                (limit,)
            ).fetchall()
            return [dict(r) for r in rows]

    def update_data_status(self, dataset: str, market: str,
                           latest_date: str, row_count: int):
        """更新数据集状态"""
        with self.connection() as conn:
            conn.execute(
                """INSERT INTO data_status (dataset, market, latest_date, row_count, last_updated)
                   VALUES (?, ?, ?, ?, ?)
                   ON CONFLICT(dataset, market) DO UPDATE SET
                     latest_date=excluded.latest_date,
                     row_count=excluded.row_count,
                     last_updated=excluded.last_updated""",
                (dataset, market, latest_date, row_count, datetime.now().isoformat())
            )

    def get_data_status(self) -> list:
        """获取所有数据集状态"""
        with self.connection() as conn:
            rows = conn.execute("SELECT * FROM data_status ORDER BY dataset, market").fetchall()
            return [dict(r) for r in rows]
