"""回测 API 路由"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.services.backtest_service import BacktestService

router = APIRouter(prefix="/api/backtests", tags=["backtests"])


def get_backtest_service() -> BacktestService:
    from backend.main import app_state
    return BacktestService(app_state["exp_db"], app_state["portal"])


class BacktestRequest(BaseModel):
    name: str
    backtest_type: str = "portfolio"  # portfolio | signal | event
    start_date: str
    end_date: str
    initial_capital: float = 100000
    benchmark: str = "sh000300"
    rebalance_freq: str = "daily"
    top_n: int = 10
    weight_method: str = "equal"
    entry_signal: str = "golden_cross"
    exit_signal: str = "death_cross"
    holding_period: int = 0
    market: str = "CN"
    cost_params: Optional[dict] = None
    experiment_id: str = ""


@router.get("")
async def list_backtests(service: BacktestService = Depends(get_backtest_service)):
    return service.list_backtests()


@router.get("/{bt_id}")
async def get_backtest(bt_id: str, service: BacktestService = Depends(get_backtest_service)):
    result = service.get_backtest(bt_id)
    if not result:
        raise HTTPException(status_code=404, detail="Backtest not found")
    return result


@router.post("")
async def create_backtest(req: BacktestRequest,
                           service: BacktestService = Depends(get_backtest_service)):
    return service.create_and_run(
        name=req.name, backtest_type=req.backtest_type,
        start_date=req.start_date, end_date=req.end_date,
        initial_capital=req.initial_capital, benchmark=req.benchmark,
        rebalance_freq=req.rebalance_freq, top_n=req.top_n,
        weight_method=req.weight_method, entry_signal=req.entry_signal,
        exit_signal=req.exit_signal, holding_period=req.holding_period,
        market=req.market, cost_params=req.cost_params,
        experiment_id=req.experiment_id,
    )


@router.delete("/{bt_id}")
async def delete_backtest(bt_id: str, service: BacktestService = Depends(get_backtest_service)):
    if not service.delete_backtest(bt_id):
        raise HTTPException(status_code=404, detail="Backtest not found")
    return {"status": "deleted"}
