"""回测任务服务"""
import uuid
from datetime import datetime
from quant_core.storage.experiment_db import ExperimentDB
from quant_core.backtest.engine import run_portfolio_backtest
from quant_core.backtest.signal import run_signal_backtest
from quant_core.backtest.event import run_event_backtest
from quant_core.backtest.result import BacktestResult


class BacktestService:
    def __init__(self, exp_db: ExperimentDB, portal):
        self.db = exp_db
        self.portal = portal

    def create_and_run(self, name, backtest_type, start_date, end_date,
                       initial_capital=100000, benchmark="sh000300",
                       rebalance_freq="daily", top_n=10, weight_method="equal",
                       entry_signal="golden_cross", exit_signal="death_cross",
                       holding_period=0, market="CN", cost_params=None,
                       experiment_id="") -> dict:
        """提交并执行回测（同步）"""
        bt_id = str(uuid.uuid4())[:8]
        self.db.create_backtest(bt_id, name, backtest_type, start_date, end_date,
                                initial_capital, benchmark, experiment_id)

        # 加载数据
        bars = self.portal.read_daily_bars(market=market, start=start_date, end=end_date)
        if bars.empty:
            result = BacktestResult()
            result.fail("No bars data")
            self.db.save_backtest_result(bt_id, result.to_dict())
            return result.to_dict()

        # 因子数据 (从 Experiment 或默认)
        from quant_core.features.factors.technical import TechnicalFactors
        factor_df = TechnicalFactors.compute("ma_20", bars)

        # 基准数据
        benchmark_df = None
        try:
            benchmark_df = self.portal.read_daily_bars(symbols=[benchmark], market="CN",
                                                        start=start_date, end=end_date)
        except:
            pass

        # 执行回测
        if backtest_type == "portfolio":
            result = run_portfolio_backtest(
                bars, factor_df, start_date, end_date,
                initial_capital=initial_capital, benchmark=benchmark,
                benchmark_df=benchmark_df, rebalance_freq=rebalance_freq,
                top_n=top_n, weight_method=weight_method,
                market=market, cost_params=cost_params or {}
            )
        elif backtest_type == "signal":
            result = run_signal_backtest(
                bars, start_date, end_date,
                entry_signal=entry_signal, exit_signal=exit_signal,
                initial_capital=initial_capital, holding_period=holding_period,
                market=market, cost_params=cost_params or {}
            )
        elif backtest_type == "event":
            result = run_event_backtest(
                bars, start_date, end_date,
                event_window=(-5, 10), initial_capital=initial_capital, market=market
            )
        else:
            result = BacktestResult()
            result.fail(f"Unknown backtest type: {backtest_type}")

        # 保存结果
        result.name = name
        self.db.save_backtest_result(bt_id, result.to_dict())
        return result.to_dict()

    def list_backtests(self): return self.db.get_backtests()
    def get_backtest(self, id): return self.db.get_backtest(id)
    def delete_backtest(self, id): return self.db.delete_backtest(id)
