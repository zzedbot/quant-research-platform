"""SQLite 数据库扩展 - Universes, Experiments, Events"""
import sqlite3
import json
from pathlib import Path
from datetime import datetime
from typing import Optional
from contextlib import contextmanager


class ExperimentDB:
    """扩展 MetaDB 的数据库，增加 experiment/universe/events 表"""

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
                CREATE TABLE IF NOT EXISTS universes (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT DEFAULT '',
                    symbols TEXT NOT NULL DEFAULT '[]',
                    filters TEXT NOT NULL DEFAULT '[]',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS experiments (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT DEFAULT '',
                    universe_id TEXT NOT NULL,
                    factors TEXT NOT NULL DEFAULT '[]',
                    portfolio TEXT NOT NULL DEFAULT '{}',
                    execution TEXT NOT NULL DEFAULT '{}',
                    data_version TEXT DEFAULT '',
                    status TEXT NOT NULL DEFAULT 'draft',
                    result_path TEXT DEFAULT '',
                    metrics TEXT DEFAULT '{}',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY (universe_id) REFERENCES universes(id)
                );
                CREATE TABLE IF NOT EXISTS events (
                    event_id TEXT PRIMARY KEY,
                    symbol TEXT NOT NULL,
                    market TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    event_date TEXT NOT NULL,
                    publish_time TEXT DEFAULT '',
                    title TEXT DEFAULT '',
                    summary TEXT DEFAULT '',
                    source TEXT DEFAULT '',
                    metadata TEXT DEFAULT '{}',
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS backtests (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    backtest_type TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'running',
                    experiment_id TEXT DEFAULT '',
                    start_date TEXT NOT NULL,
                    end_date TEXT NOT NULL,
                    initial_capital REAL NOT NULL,
                    final_capital REAL DEFAULT 0,
                    benchmark TEXT DEFAULT '',
                    metrics TEXT DEFAULT '{}',
                    equity_curve TEXT DEFAULT '[]',
                    drawdown_curve TEXT DEFAULT '[]',
                    positions TEXT DEFAULT '[]',
                    trades TEXT DEFAULT '[]',
                    error_message TEXT DEFAULT '',
                    created_at TEXT NOT NULL,
                    finished_at TEXT DEFAULT ''
                );
            """)

    def _json(self, val):
        return json.dumps(val) if isinstance(val, (dict, list)) else val

    def _load_json(self, d: dict, fields: list):
        for f in fields:
            if f in d:
                try:
                    d[f] = json.loads(d[f]) if isinstance(d[f], str) else d[f]
                except:
                    d[f] = {} if f in ('portfolio', 'execution', 'metrics') else []

    # Universe CRUD
    def create_universe(self, id: str, name: str, description: str, symbols: list, filters: list) -> dict:
        now = datetime.now().isoformat()
        with self.connection() as conn:
            conn.execute(
                """INSERT INTO universes (id, name, description, symbols, filters, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (id, name, description, self._json(symbols), self._json(filters), now, now)
            )
        return {"id": id, "name": name, "description": description, "symbols": symbols, "filters": filters, "created_at": now}

    def get_universes(self) -> list:
        with self.connection() as conn:
            rows = conn.execute("SELECT * FROM universes ORDER BY created_at DESC").fetchall()
            result = []
            for r in rows:
                d = dict(r)
                self._load_json(d, ["symbols", "filters"])
                result.append(d)
            return result

    def get_universe(self, id: str) -> Optional[dict]:
        with self.connection() as conn:
            row = conn.execute("SELECT * FROM universes WHERE id=?", (id,)).fetchone()
            if not row: return None
            d = dict(row)
            self._load_json(d, ["symbols", "filters"])
            return d

    def update_universe(self, id: str, **kwargs) -> Optional[dict]:
        now = datetime.now().isoformat()
        with self.connection() as conn:
            existing = conn.execute("SELECT * FROM universes WHERE id=?", (id,)).fetchone()
            if not existing: return None
            updates = {"updated_at": now}
            for k, v in kwargs.items():
                if k in ("symbols", "filters"):
                    updates[k] = self._json(v)
                elif k in ("name", "description"):
                    updates[k] = v
            set_clause = ", ".join(f"{k}=?" for k in updates.keys())
            values = list(updates.values()) + [id]
            conn.execute(f"UPDATE universes SET {set_clause} WHERE id=?", values)
        return self.get_universe(id)

    def delete_universe(self, id: str) -> bool:
        with self.connection() as conn:
            conn.execute("DELETE FROM universes WHERE id=?", (id,))
        return True

    # Experiment CRUD
    def create_experiment(self, id: str, name: str, description: str, universe_id: str,
                          factors: list, portfolio: dict, execution: dict, data_version: str = "") -> dict:
        now = datetime.now().isoformat()
        with self.connection() as conn:
            conn.execute(
                """INSERT INTO experiments
                   (id, name, description, universe_id, factors, portfolio, execution, data_version, status, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)""",
                (id, name, description, universe_id, self._json(factors),
                 self._json(portfolio), self._json(execution), data_version, now, now)
            )
        return {"id": id, "name": name, "status": "draft", "created_at": now}

    def get_experiments(self) -> list:
        with self.connection() as conn:
            rows = conn.execute("SELECT * FROM experiments ORDER BY created_at DESC").fetchall()
            result = []
            for r in rows:
                d = dict(r)
                self._load_json(d, ["factors", "portfolio", "execution", "metrics"])
                result.append(d)
            return result

    def get_experiment(self, id: str) -> Optional[dict]:
        with self.connection() as conn:
            row = conn.execute("SELECT * FROM experiments WHERE id=?", (id,)).fetchone()
            if not row: return None
            d = dict(row)
            self._load_json(d, ["factors", "portfolio", "execution", "metrics"])
            return d

    def update_experiment(self, id: str, **kwargs) -> Optional[dict]:
        now = datetime.now().isoformat()
        with self.connection() as conn:
            existing = conn.execute("SELECT * FROM experiments WHERE id=?", (id,)).fetchone()
            if not existing: return None
            updates = {"updated_at": now}
            for k, v in kwargs.items():
                if k in ("factors", "portfolio", "execution", "metrics"):
                    updates[k] = self._json(v) if isinstance(v, (dict, list)) else v
                else:
                    updates[k] = v
            set_clause = ", ".join(f"{k}=?" for k in updates.keys())
            values = list(updates.values()) + [id]
            conn.execute(f"UPDATE experiments SET {set_clause} WHERE id=?", values)
        return self.get_experiment(id)

    def delete_experiment(self, id: str) -> bool:
        with self.connection() as conn:
            conn.execute("DELETE FROM experiments WHERE id=?", (id,))
        return True

    def clone_experiment(self, id: str) -> Optional[dict]:
        exp = self.get_experiment(id)
        if not exp: return None
        new_id = f"{id[:4]}_clone"
        return self.create_experiment(
            new_id, f"{exp['name']} (copy)", exp.get("description", ""),
            exp["universe_id"], exp.get("factors", []),
            exp.get("portfolio", {}), exp.get("execution", {}),
            exp.get("data_version", ""),
        )

    # Events
    def add_event(self, event_id: str, symbol: str, market: str, event_type: str,
                  event_date: str, title: str = "", summary: str = "",
                  source: str = "", metadata: dict = None) -> dict:
        now = datetime.now().isoformat()
        with self.connection() as conn:
            conn.execute(
                """INSERT OR REPLACE INTO events
                   (event_id, symbol, market, event_type, event_date, publish_time, title, summary, source, metadata, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (event_id, symbol, market, event_type, event_date, now,
                 title, summary, source, self._json(metadata or {}), now)
            )
        return {"event_id": event_id, "event_type": event_type}

    def get_events(self, event_type: str = None, market: str = None,
                   start_date: str = None, end_date: str = None,
                   symbol: str = None, limit: int = 100) -> list:
        query = "SELECT * FROM events WHERE 1=1"
        params = []
        if event_type: query += " AND event_type=?"; params.append(event_type)
        if market: query += " AND market=?"; params.append(market)
        if start_date: query += " AND event_date>=?"; params.append(start_date)
        if end_date: query += " AND event_date<=?"; params.append(end_date)
        if symbol: query += " AND symbol=?"; params.append(symbol)
        query += " ORDER BY event_date DESC LIMIT ?"; params.append(limit)
        with self.connection() as conn:
            rows = conn.execute(query, params).fetchall()
            result = []
            for r in rows:
                d = dict(r)
                try: d["metadata"] = json.loads(d["metadata"])
                except: d["metadata"] = {}
                result.append(d)
            return result

    def get_event_types(self) -> list:
        with self.connection() as conn:
            rows = conn.execute("SELECT DISTINCT event_type FROM events").fetchall()
            return [r["event_type"] for r in rows]

    # Backtest CRUD
    def create_backtest(self, id, name, backtest_type, start_date, end_date,
                        initial_capital, benchmark="", experiment_id="") -> dict:
        now = datetime.now().isoformat()
        with self.connection() as conn:
            conn.execute(
                """INSERT INTO backtests
                   (id, name, backtest_type, start_date, end_date, initial_capital,
                    benchmark, experiment_id, status, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'running', ?)""",
                (id, name, backtest_type, start_date, end_date, initial_capital,
                 benchmark, experiment_id, now)
            )
        return {"id": id, "status": "running", "created_at": now}

    def save_backtest_result(self, id, result: dict) -> bool:
        import json
        with self.connection() as conn:
            conn.execute(
                """UPDATE backtests SET
                   final_capital=?, status=?, metrics=?, equity_curve=?,
                   drawdown_curve=?, positions=?, trades=?,
                   error_message=?, finished_at=?
                   WHERE id=?""",
                (result.get("final_capital", 0), result.get("status", "failed"),
                 json.dumps(result.get("metrics", {})),
                 json.dumps(result.get("equity_curve", [])),
                 json.dumps(result.get("drawdown_curve", [])),
                 json.dumps(result.get("positions", [])[-200:]),
                 json.dumps(result.get("trades", [])),
                 result.get("error_message", ""),
                 result.get("finished_at", ""),
                 id)
            )
        return True

    def get_backtests(self) -> list:
        import json
        with self.connection() as conn:
            rows = conn.execute("SELECT * FROM backtests ORDER BY created_at DESC").fetchall()
            result = []
            for r in rows:
                d = dict(r)
                for f in ["metrics", "equity_curve", "drawdown_curve", "positions", "trades"]:
                    try: d[f] = json.loads(d[f])
                    except: d[f] = [] if f != "metrics" else {}
                result.append(d)
            return result

    def get_backtest(self, id) -> dict:
        import json
        with self.connection() as conn:
            row = conn.execute("SELECT * FROM backtests WHERE id=?", (id,)).fetchone()
            if not row: return {}
            d = dict(row)
            for f in ["metrics", "equity_curve", "drawdown_curve", "positions", "trades"]:
                try: d[f] = json.loads(d[f])
                except: d[f] = [] if f != "metrics" else {}
            return d

    def delete_backtest(self, id) -> bool:
        with self.connection() as conn:
            conn.execute("DELETE FROM backtests WHERE id=?", (id,))
        return True
