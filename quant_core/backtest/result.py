"""回测结果模型"""
from dataclasses import dataclass, field
from datetime import datetime
import uuid


@dataclass
class BacktestResult:
    id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    name: str = ""
    backtest_type: str = ""
    status: str = "running"
    start_date: str = ""
    end_date: str = ""
    initial_capital: float = 100000
    final_capital: float = 0
    benchmark: str = "sh000300"
    metrics: dict = field(default_factory=dict)
    equity_curve: list = field(default_factory=list)
    drawdown_curve: list = field(default_factory=list)
    positions: list = field(default_factory=list)
    trades: list = field(default_factory=list)
    error_message: str = ""
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    finished_at: str = ""

    def to_dict(self) -> dict:
        return {k: getattr(self, k) for k in self.__dataclass_fields__}

    @classmethod
    def from_dict(cls, d: dict) -> "BacktestResult":
        return cls(**{k: v for k, v in d.items() if k in cls.__dataclass_fields__})

    def complete(self):
        self.status = "completed"
        self.finished_at = datetime.now().isoformat()
        if self.equity_curve:
            self.final_capital = self.equity_curve[-1]["value"]

    def fail(self, error: str):
        self.status = "failed"
        self.error_message = error
        self.finished_at = datetime.now().isoformat()
